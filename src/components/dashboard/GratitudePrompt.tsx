'use client';

import { useState, useEffect } from 'react';
import GlassCard from '@/components/ui/GlassCard';
import { Heart, Plus, Loader2 } from 'lucide-react';

export default function GratitudePrompt() {
    const [entry, setEntry] = useState('');
    const [entries, setEntries] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const today = new Date().toISOString().split('T')[0];

    useEffect(() => {
        fetchTodaysGratitude();
    }, []);

    const fetchTodaysGratitude = async () => {
        try {
            const res = await fetch(`/api/gratitude?date=${today}`);
            if (res.ok) {
                const data = await res.json();
                if (data.length > 0 && data[0].entries) {
                    setEntries(data[0].entries);
                }
            }
        } catch (error) {
            console.error('Failed to fetch gratitude:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = async () => {
        if (!entry.trim()) return;

        const newEntries = [...entries, entry.trim()];
        setEntries(newEntries);
        setEntry('');
        setSaving(true);

        try {
            await fetch('/api/gratitude', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    date: today,
                    entries: newEntries,
                }),
            });
        } catch (error) {
            console.error('Failed to save gratitude:', error);
            // Revert on error
            setEntries(entries);
        } finally {
            setSaving(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleAdd();
        }
    };

    if (loading) {
        return (
            <GlassCard>
                <div className="flex items-center justify-center py-6">
                    <Loader2 className="w-5 h-5 text-pink-400 animate-spin" />
                </div>
            </GlassCard>
        );
    }

    return (
        <GlassCard>
            <div className="flex items-center gap-2 mb-3">
                <Heart className="w-5 h-5 text-pink-400" />
                <h3 className="text-sm text-gray-400 uppercase tracking-wider">
                    Grateful For Today
                </h3>
            </div>

            {/* Existing entries */}
            {entries.length > 0 && (
                <ul className="space-y-1 mb-3">
                    {entries.map((item, index) => (
                        <li key={index} className="text-sm text-gray-300 flex items-start gap-2">
                            <span className="text-pink-400/60">•</span>
                            {item}
                        </li>
                    ))}
                </ul>
            )}

            {/* Add new entry */}
            <div className="flex gap-2">
                <input
                    type="text"
                    value={entry}
                    onChange={(e) => setEntry(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="What are you grateful for?"
                    className="flex-1 bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-500 outline-none focus:border-[#139187]"
                    disabled={saving}
                />
                <button
                    onClick={handleAdd}
                    disabled={!entry.trim() || saving}
                    className="p-2 bg-[#139187]/20 hover:bg-[#139187]/30 text-[#139187] rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {saving ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        <Plus className="w-4 h-4" />
                    )}
                </button>
            </div>
        </GlassCard>
    );
}
