'use client';

import { useState, useEffect } from 'react';
import GlassCard from '@/components/ui/GlassCard';
import { Sparkles, RefreshCw, Loader2 } from 'lucide-react';

interface Affirmation {
    id: string;
    content: string;
    type: string;
    active: boolean;
}

interface AffirmationsData {
    coreIdentity: Affirmation[];
    shortTerm: Affirmation[];
}

export default function DailyAffirmation() {
    const [affirmations, setAffirmations] = useState<AffirmationsData | null>(null);
    const [showShortTerm, setShowShortTerm] = useState(false);
    const [loading, setLoading] = useState(true);
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        fetchAffirmations();
    }, []);

    const fetchAffirmations = async () => {
        try {
            const res = await fetch('/api/affirmations');
            if (res.ok) {
                const data = await res.json();
                setAffirmations(data);
            }
        } catch (error) {
            console.error('Failed to fetch affirmations:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleRefresh = () => {
        const currentList = showShortTerm
            ? affirmations?.shortTerm
            : affirmations?.coreIdentity;

        if (currentList && currentList.length > 1) {
            setCurrentIndex((currentIndex + 1) % currentList.length);
        } else {
            setShowShortTerm(!showShortTerm);
            setCurrentIndex(0);
        }
    };

    if (loading) {
        return (
            <GlassCard className="bg-gradient-to-br from-[#139187]/10 to-transparent">
                <div className="flex items-center justify-center py-6">
                    <Loader2 className="w-5 h-5 text-[#139187] animate-spin" />
                </div>
            </GlassCard>
        );
    }

    const currentList = showShortTerm
        ? affirmations?.shortTerm
        : affirmations?.coreIdentity;
    const currentAffirmation = currentList?.[currentIndex];

    // Fallback content if no affirmations exist
    const displayContent = currentAffirmation?.content
        || (showShortTerm
            ? "Today, I operate with calm clarity and execute with precision."
            : "I am a focused, disciplined creator who delivers exceptional work.");

    return (
        <GlassCard className="bg-gradient-to-br from-[#139187]/10 to-transparent">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-[#139187]" />
                    <span className="text-xs text-gray-400 uppercase tracking-wider">
                        {showShortTerm ? 'Short-Term' : 'Core Identity'}
                    </span>
                </div>
                <button
                    onClick={handleRefresh}
                    className="p-1 hover:bg-white/5 rounded transition-colors"
                    title="Show next affirmation"
                >
                    <RefreshCw className="w-4 h-4 text-gray-500" />
                </button>
            </div>

            <p className="text-white font-serif text-lg italic leading-relaxed">
                &ldquo;{displayContent}&rdquo;
            </p>

            <p className="text-xs text-gray-500 mt-3">
                Manage affirmations in Manifestation
            </p>
        </GlassCard>
    );
}
