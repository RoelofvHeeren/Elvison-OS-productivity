'use client';

import { useState, useEffect } from 'react';
import PageHeader from '@/components/layout/PageHeader';
import GlassCard, { InnerCard } from '@/components/ui/GlassCard';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { Textarea, Select } from '@/components/ui/FormElements';
import TabNav from '@/components/ui/TabNav';
import {
    Sparkles,
    Plus,
    Edit,
    Heart,
    Star,
    RefreshCw,
    Wand2,
    Loader2,
    Check,
    X,
} from 'lucide-react';

interface Affirmation {
    id: string;
    content: string;
    type: 'CORE_IDENTITY' | 'SHORT_TERM';
    active: boolean;
}

interface GratitudeEntry {
    id: string;
    date: string;
    entries: string[];
}

const tabs = [
    { id: 'affirmations', label: 'Affirmations', icon: Star },
    { id: 'gratitude', label: 'Gratitude', icon: Heart },
];

export default function ManifestationPage() {
    const [activeTab, setActiveTab] = useState('affirmations');
    const [affirmations, setAffirmations] = useState<{ coreIdentity: Affirmation[]; shortTerm: Affirmation[] } | null>(null);
    const [gratitude, setGratitude] = useState<GratitudeEntry[]>([]);
    const [loading, setLoading] = useState(true);

    // Form states
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [formContent, setFormContent] = useState('');
    const [formType, setFormType] = useState<'CORE_IDENTITY' | 'SHORT_TERM'>('CORE_IDENTITY');
    const [gratitudeInputs, setGratitudeInputs] = useState(['', '', '']);

    // AI Rewrite states
    const [showAIRewrite, setShowAIRewrite] = useState(false);
    const [rewriteLoading, setRewriteLoading] = useState(false);
    const [originalContent, setOriginalContent] = useState('');
    const [suggestedContent, setSuggestedContent] = useState('');
    const [editingAffirmationId, setEditingAffirmationId] = useState<string | null>(null);

    // Inline edit states
    const [inlineEditId, setInlineEditId] = useState<string | null>(null);
    const [inlineEditValue, setInlineEditValue] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [affirmationsRes, gratitudeRes] = await Promise.all([
                fetch('/api/affirmations'),
                fetch('/api/gratitude?limit=10'),
            ]);

            if (affirmationsRes.ok) {
                const data = await affirmationsRes.json();
                setAffirmations(data);
            }

            if (gratitudeRes.ok) {
                const data = await gratitudeRes.json();
                setGratitude(data);
            }
        } catch (error) {
            console.error('Failed to fetch data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddAffirmation = async () => {
        if (!formContent.trim()) return;

        try {
            const res = await fetch('/api/affirmations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content: formContent.trim(),
                    type: formType,
                }),
            });

            if (res.ok) {
                fetchData();
                setFormContent('');
                setIsFormOpen(false);
            }
        } catch (error) {
            console.error('Failed to create affirmation:', error);
        }
    };

    const handleAddGratitude = async () => {
        const entries = gratitudeInputs.filter(e => e.trim());
        if (entries.length === 0) return;

        try {
            const today = new Date().toISOString().split('T')[0];
            const res = await fetch('/api/gratitude', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    date: today,
                    entries,
                }),
            });

            if (res.ok) {
                fetchData();
                setGratitudeInputs(['', '', '']);
                setIsFormOpen(false);
            }
        } catch (error) {
            console.error('Failed to save gratitude:', error);
        }
    };

    const handleAIRewrite = async (affirmation: Affirmation) => {
        setEditingAffirmationId(affirmation.id);
        setOriginalContent(affirmation.content);
        setSuggestedContent('');
        setShowAIRewrite(true);
        setRewriteLoading(true);

        try {
            const res = await fetch('/api/affirmations/rewrite', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: affirmation.content }),
            });

            if (res.ok) {
                const data = await res.json();
                setSuggestedContent(data.suggestion);
            }
        } catch (error) {
            console.error('Failed to rewrite:', error);
        } finally {
            setRewriteLoading(false);
        }
    };

    const handleUseSuggestion = async () => {
        if (!editingAffirmationId || !suggestedContent) return;

        try {
            const res = await fetch(`/api/affirmations/${editingAffirmationId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: suggestedContent }),
            });

            if (res.ok) {
                fetchData();
                setShowAIRewrite(false);
            }
        } catch (error) {
            console.error('Failed to update affirmation:', error);
        }
    };

    const startInlineEdit = (affirmation: Affirmation) => {
        setInlineEditId(affirmation.id);
        setInlineEditValue(affirmation.content);
    };

    const saveInlineEdit = async () => {
        if (!inlineEditId || !inlineEditValue.trim()) return;

        try {
            const res = await fetch(`/api/affirmations/${inlineEditId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: inlineEditValue.trim() }),
            });

            if (res.ok) {
                fetchData();
            }
        } catch (error) {
            console.error('Failed to update affirmation:', error);
        }

        setInlineEditId(null);
        setInlineEditValue('');
    };

    if (loading) {
        return (
            <>
                <PageHeader
                    title="Manifestation & Gratitude"
                    description="Shape your identity and cultivate appreciation"
                    icon={Sparkles}
                />
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 text-[#139187] animate-spin" />
                </div>
            </>
        );
    }

    return (
        <>
            <PageHeader
                title="Manifestation & Gratitude"
                description="Shape your identity and cultivate appreciation"
                icon={Sparkles}
            >
                <Button icon={Plus} onClick={() => setIsFormOpen(true)}>
                    {activeTab === 'affirmations' ? 'New Affirmation' : 'Add Gratitude'}
                </Button>
            </PageHeader>

            <TabNav tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab}>
                {activeTab === 'affirmations' ? (
                    <div className="space-y-6">
                        {/* Core Identity */}
                        <div>
                            <h3 className="text-sm text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                                <Star className="w-4 h-4 text-[#139187]" />
                                Core Identity Affirmations
                            </h3>
                            <div className="space-y-3">
                                {affirmations?.coreIdentity.length === 0 ? (
                                    <p className="text-gray-500 text-sm">No core identity affirmations yet</p>
                                ) : (
                                    affirmations?.coreIdentity.map((affirmation) => (
                                        <InnerCard key={affirmation.id} padding="sm">
                                            <div className="flex items-start gap-3">
                                                {inlineEditId === affirmation.id ? (
                                                    <div className="flex-1 flex items-center gap-2">
                                                        <Textarea
                                                            value={inlineEditValue}
                                                            onChange={(e) => setInlineEditValue(e.target.value)}
                                                            rows={2}
                                                            className="flex-1"
                                                        />
                                                        <button onClick={saveInlineEdit} className="p-1.5 text-green-400 hover:bg-white/5 rounded">
                                                            <Check className="w-4 h-4" />
                                                        </button>
                                                        <button onClick={() => setInlineEditId(null)} className="p-1.5 text-red-400 hover:bg-white/5 rounded">
                                                            <X className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <p className="flex-1 text-white font-serif text-lg italic leading-relaxed">
                                                            &ldquo;{affirmation.content}&rdquo;
                                                        </p>
                                                        <div className="flex gap-1">
                                                            <button
                                                                onClick={() => handleAIRewrite(affirmation)}
                                                                className="p-1.5 hover:bg-white/5 rounded text-gray-500 hover:text-[#139187]"
                                                                title="AI Rewrite"
                                                            >
                                                                <Wand2 className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => startInlineEdit(affirmation)}
                                                                className="p-1.5 hover:bg-white/5 rounded text-gray-500 hover:text-white"
                                                            >
                                                                <Edit className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        </InnerCard>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Short-Term */}
                        <div>
                            <h3 className="text-sm text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                                <RefreshCw className="w-4 h-4 text-yellow-400" />
                                Short-Term Affirmations
                            </h3>
                            <div className="space-y-3">
                                {affirmations?.shortTerm.length === 0 ? (
                                    <p className="text-gray-500 text-sm">No short-term affirmations yet</p>
                                ) : (
                                    affirmations?.shortTerm.map((affirmation) => (
                                        <InnerCard key={affirmation.id} padding="sm">
                                            <div className="flex items-start gap-3">
                                                {inlineEditId === affirmation.id ? (
                                                    <div className="flex-1 flex items-center gap-2">
                                                        <Textarea
                                                            value={inlineEditValue}
                                                            onChange={(e) => setInlineEditValue(e.target.value)}
                                                            rows={2}
                                                            className="flex-1"
                                                        />
                                                        <button onClick={saveInlineEdit} className="p-1.5 text-green-400 hover:bg-white/5 rounded">
                                                            <Check className="w-4 h-4" />
                                                        </button>
                                                        <button onClick={() => setInlineEditId(null)} className="p-1.5 text-red-400 hover:bg-white/5 rounded">
                                                            <X className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <p className="flex-1 text-gray-300 font-serif text-lg italic leading-relaxed">
                                                            &ldquo;{affirmation.content}&rdquo;
                                                        </p>
                                                        <div className="flex gap-1">
                                                            <button
                                                                onClick={() => handleAIRewrite(affirmation)}
                                                                className="p-1.5 hover:bg-white/5 rounded text-gray-500 hover:text-[#139187]"
                                                                title="AI Rewrite"
                                                            >
                                                                <Wand2 className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => startInlineEdit(affirmation)}
                                                                className="p-1.5 hover:bg-white/5 rounded text-gray-500 hover:text-white"
                                                            >
                                                                <Edit className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        </InnerCard>
                                    ))
                                )}
                            </div>
                        </div>

                        <p className="text-xs text-gray-500">
                            AI can help rewrite affirmations, but only when you explicitly request it.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {gratitude.length === 0 ? (
                            <div className="text-center py-12">
                                <p className="text-gray-400">No gratitude entries yet</p>
                                <p className="text-sm text-gray-500 mt-1">Click "Add Gratitude" to record what you're grateful for</p>
                            </div>
                        ) : (
                            gratitude.map((entry) => (
                                <InnerCard key={entry.id}>
                                    <div className="flex items-center gap-2 mb-2">
                                        <Heart className="w-4 h-4 text-pink-400" />
                                        <span className="text-sm text-gray-400">
                                            {new Date(entry.date).toLocaleDateString('en-US', {
                                                weekday: 'long',
                                                month: 'short',
                                                day: 'numeric',
                                            })}
                                        </span>
                                    </div>
                                    <ul className="space-y-1 pl-6">
                                        {entry.entries.map((item, i) => (
                                            <li key={i} className="text-gray-300 flex items-start gap-2">
                                                <span className="text-pink-400/60">•</span>
                                                {item}
                                            </li>
                                        ))}
                                    </ul>
                                </InnerCard>
                            ))
                        )}
                    </div>
                )}
            </TabNav>

            {/* New Affirmation/Gratitude Modal */}
            <Modal
                isOpen={isFormOpen}
                onClose={() => setIsFormOpen(false)}
                title={activeTab === 'affirmations' ? 'New Affirmation' : "Today's Gratitude"}
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setIsFormOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={activeTab === 'affirmations' ? handleAddAffirmation : handleAddGratitude}>
                            Save
                        </Button>
                    </>
                }
            >
                {activeTab === 'affirmations' ? (
                    <div className="space-y-4">
                        <Select
                            label="Type"
                            value={formType}
                            onChange={(e) => setFormType(e.target.value as 'CORE_IDENTITY' | 'SHORT_TERM')}
                            options={[
                                { value: 'CORE_IDENTITY', label: 'Core Identity' },
                                { value: 'SHORT_TERM', label: 'Short-Term' },
                            ]}
                        />
                        <Textarea
                            label="Affirmation"
                            placeholder="I am..."
                            value={formContent}
                            onChange={(e) => setFormContent(e.target.value)}
                            rows={4}
                        />
                    </div>
                ) : (
                    <div className="space-y-3">
                        {gratitudeInputs.map((input, i) => (
                            <Textarea
                                key={i}
                                label={i === 0 ? 'What are you grateful for today?' : undefined}
                                placeholder={i === 0 ? 'Enter something you\'re grateful for...' : 'Another thing...'}
                                value={input}
                                onChange={(e) => {
                                    const newInputs = [...gratitudeInputs];
                                    newInputs[i] = e.target.value;
                                    setGratitudeInputs(newInputs);
                                }}
                                rows={2}
                            />
                        ))}
                    </div>
                )}
            </Modal>

            {/* AI Rewrite Modal */}
            <Modal
                isOpen={showAIRewrite}
                onClose={() => setShowAIRewrite(false)}
                title="AI Rewrite Suggestion"
                description="Review the AI-generated alternative below. You can accept, modify, or reject."
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setShowAIRewrite(false)}>
                            Keep Original
                        </Button>
                        <Button onClick={handleUseSuggestion} disabled={rewriteLoading || !suggestedContent}>
                            Use Suggestion
                        </Button>
                    </>
                }
            >
                <div className="space-y-4">
                    <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Original</p>
                        <p className="text-gray-400 italic">
                            &ldquo;{originalContent}&rdquo;
                        </p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">AI Suggestion</p>
                        {rewriteLoading ? (
                            <div className="flex items-center gap-2 text-gray-400">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Generating suggestion...
                            </div>
                        ) : (
                            <p className="text-white italic">
                                &ldquo;{suggestedContent}&rdquo;
                            </p>
                        )}
                    </div>
                </div>
            </Modal>
        </>
    );
}
