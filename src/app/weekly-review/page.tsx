'use client';

import { useState, useEffect } from 'react';
import PageHeader from '@/components/layout/PageHeader';
import GlassCard, { InnerCard } from '@/components/ui/GlassCard';
import Button from '@/components/ui/Button';
import { Textarea, Input } from '@/components/ui/FormElements';
import { useWeeklyReviewLock } from '@/providers/WeeklyReviewLockProvider';
import { formatDate } from '@/lib/utils';
import {
    CalendarCheck,
    Lock,
    CheckCircle,
    Sparkles,
    Plus,
    X,
    History
} from 'lucide-react';

interface WeeklyReviewHistory {
    id: string;
    weekStart: string;
    wins: string[];
    challenges: string[];
    insights: string[];
    weekNotes: string;
    aiSummary: string;
    createdAt: string;
}

export default function WeeklyReviewPage() {
    const { isLocked, checkStatus } = useWeeklyReviewLock();
    const [activeTab, setActiveTab] = useState<'review' | 'history'>('review');
    const [history, setHistory] = useState<WeeklyReviewHistory[]>([]);

    // Review Form State
    const [wins, setWins] = useState<string[]>(['']);
    const [challenges, setChallenges] = useState<string[]>(['']);
    const [insights, setInsights] = useState<string[]>(['']);
    const [weekNotes, setWeekNotes] = useState('');
    const [aiSummary, setAiSummary] = useState('');
    const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        try {
            const res = await fetch('/api/weekly-review/history');
            if (res.ok) {
                const data = await res.json();
                setHistory(data);
            }
        } catch (error) {
            console.error('Failed to fetch history', error);
        }
    };

    const handleGenerateAISummary = async () => {
        setIsGeneratingSummary(true);
        try {
            const res = await fetch('/api/weekly-review/ai-summary', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    wins: wins.filter(w => w.trim()),
                    challenges: challenges.filter(c => c.trim()),
                    insights: insights.filter(i => i.trim()),
                    weekNotes
                })
            });

            if (res.ok) {
                const data = await res.json();
                setAiSummary(data.summary + (data.suggestions ? `\n\nTips: ${data.suggestions}` : ''));
            }
        } catch (error) {
            console.error('Failed to generate summary', error);
        } finally {
            setIsGeneratingSummary(false);
        }
    };

    const handleCompleteReview = async () => {
        setIsSubmitting(true);
        try {
            const res = await fetch('/api/weekly-review/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    wins: wins.filter(w => w.trim()),
                    challenges: challenges.filter(c => c.trim()),
                    insights: insights.filter(i => i.trim()),
                    weekNotes,
                    aiSummary
                })
            });

            if (res.ok) {
                await checkStatus();
                setWins(['']);
                setChallenges(['']);
                setInsights(['']);
                setWeekNotes('');
                setAiSummary('');
                fetchHistory();
                setActiveTab('history');
            }
        } catch (error) {
            console.error('Error saving review', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const addItem = (items: string[], setItems: React.Dispatch<React.SetStateAction<string[]>>) => {
        setItems([...items, '']);
    };

    const removeItem = (
        index: number,
        items: string[],
        setItems: React.Dispatch<React.SetStateAction<string[]>>
    ) => {
        if (items.length > 1) {
            setItems(items.filter((_, i) => i !== index));
        }
    };

    const updateItem = (
        index: number,
        value: string,
        items: string[],
        setItems: React.Dispatch<React.SetStateAction<string[]>>
    ) => {
        const newItems = [...items];
        newItems[index] = value;
        setItems(newItems);
    };

    const renderListInput = (
        label: string,
        items: string[],
        setItems: React.Dispatch<React.SetStateAction<string[]>>,
        placeholder: string
    ) => (
        <div>
            <label className="text-sm text-gray-400 block mb-2">{label}</label>
            <div className="space-y-2">
                {items.map((item, index) => (
                    <div key={index} className="flex gap-2">
                        <Input
                            value={item}
                            onChange={(e) => updateItem(index, e.target.value, items, setItems)}
                            placeholder={placeholder}
                        />
                        {items.length > 1 && (
                            <button
                                onClick={() => removeItem(index, items, setItems)}
                                className="p-2 hover:bg-white/5 rounded-lg text-gray-500 hover:text-red-400"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                ))}
                <button
                    onClick={() => addItem(items, setItems)}
                    className="flex items-center gap-1 text-sm text-[#139187] hover:text-[#0d6b63]"
                >
                    <Plus className="w-4 h-4" />
                    Add another
                </button>
            </div>
        </div>
    );

    return (
        <>
            <PageHeader
                title="Weekly Review"
                description="Reflect on your progress and plan for the week ahead."
                icon={CalendarCheck}
            />

            {isLocked && (
                <GlassCard className="bg-gradient-to-r from-red-500/10 to-orange-500/10 border-red-500/30 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-full bg-red-500/20">
                            <Lock className="w-5 h-5 text-red-400" />
                        </div>
                        <div>
                            <p className="font-semibold text-white">System Locked</p>
                            <p className="text-sm text-gray-400">
                                Complete your weekly review to unlock the rest of the application.
                            </p>
                        </div>
                    </div>
                </GlassCard>
            )}

            <div className="flex gap-4 mb-6 border-b border-white/10 pb-1">
                <button
                    onClick={() => setActiveTab('review')}
                    className={`pb-2 text-sm font-medium transition-colors ${activeTab === 'review' ? 'text-[#139187] border-b-2 border-[#139187]' : 'text-gray-400 hover:text-white'}`}
                >
                    Current Review
                </button>
                <button
                    onClick={() => setActiveTab('history')}
                    className={`pb-2 text-sm font-medium transition-colors ${activeTab === 'history' ? 'text-[#139187] border-b-2 border-[#139187]' : 'text-gray-400 hover:text-white'}`}
                >
                    History
                </button>
            </div>

            {activeTab === 'review' && (
                <GlassCard>
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <CalendarCheck className="w-6 h-6 text-[#139187]" />
                            Weekly Review
                        </h2>
                    </div>

                    <div className="space-y-6">
                        {renderListInput('Wins', wins, setWins, 'What went well this week?')}
                        {renderListInput('Challenges', challenges, setChallenges, 'What was difficult?')}
                        {renderListInput('Insights', insights, setInsights, 'What did you learn?')}

                        <div>
                            <label className="text-sm text-gray-400 block mb-2">Week Notes</label>
                            <p className="text-xs text-gray-500 mb-2">
                                Describe how the week went in your own words.
                            </p>
                            <Textarea
                                value={weekNotes}
                                onChange={(e) => setWeekNotes(e.target.value)}
                                placeholder="Reflections..."
                                rows={5}
                            />
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-sm text-gray-400">AI Summary</label>
                                <Button
                                    variant="accent"
                                    size="sm"
                                    icon={Sparkles}
                                    onClick={handleGenerateAISummary}
                                    loading={isGeneratingSummary}
                                >
                                    Generate Summary
                                </Button>
                            </div>
                            {aiSummary && (
                                <InnerCard padding="sm">
                                    <p className="text-gray-300 text-sm">{aiSummary}</p>
                                </InnerCard>
                            )}
                        </div>

                        <Button
                            onClick={handleCompleteReview}
                            className="w-full"
                            icon={CheckCircle}
                            loading={isSubmitting}
                        >
                            Complete Review
                        </Button>
                    </div>
                </GlassCard>
            )}

            {activeTab === 'history' && (
                <div className="space-y-4">
                    {history.length === 0 ? (
                        <p className="text-center text-gray-500 py-8">No past reviews found.</p>
                    ) : (
                        history.map((review) => (
                            <GlassCard key={review.id} className="hover:border-white/20 transition-colors">
                                <div className="flex items-start justify-between mb-4">
                                    <div>
                                        <h3 className="text-lg font-semibold text-white">
                                            Week of {formatDate(review.weekStart)}
                                        </h3>
                                        <p className="text-xs text-gray-400">
                                            Completed - {formatDate(review.createdAt)}
                                        </p>
                                    </div>
                                    <div className="p-2 rounded-full bg-green-500/10 text-green-400">
                                        <CheckCircle className="w-4 h-4" />
                                    </div>
                                </div>

                                {review.aiSummary && (
                                    <InnerCard className="mb-4 bg-white/5 border-white/5">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Sparkles className="w-3 h-3 text-[#139187]" />
                                            <span className="text-xs font-medium text-gray-300">AI Summary</span>
                                        </div>
                                        <p className="text-sm text-gray-400 italic">
                                            &ldquo;{review.aiSummary}&rdquo;
                                        </p>
                                    </InnerCard>
                                )}

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-400">
                                    <div>
                                        <span className="block text-xs uppercase tracking-wider text-gray-500 mb-1">Wins</span>
                                        <ul className="list-disc list-inside space-y-1">
                                            {review.wins.map((w, i) => <li key={i}>{w}</li>)}
                                        </ul>
                                    </div>
                                    <div>
                                        <span className="block text-xs uppercase tracking-wider text-gray-500 mb-1">Challenges</span>
                                        <ul className="list-disc list-inside space-y-1">
                                            {review.challenges.map((w, i) => <li key={i}>{w}</li>)}
                                        </ul>
                                    </div>
                                    <div>
                                        <span className="block text-xs uppercase tracking-wider text-gray-500 mb-1">Insights</span>
                                        <ul className="list-disc list-inside space-y-1">
                                            {review.insights.map((w, i) => <li key={i}>{w}</li>)}
                                        </ul>
                                    </div>
                                </div>
                            </GlassCard>
                        ))
                    )}
                </div>
            )}
        </>
    );
}
