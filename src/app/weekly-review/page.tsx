'use client';

import { useState, useEffect } from 'react';
import PageHeader from '@/components/layout/PageHeader';
import GlassCard, { InnerCard } from '@/components/ui/GlassCard';
import Button from '@/components/ui/Button';
import { Textarea, Input } from '@/components/ui/FormElements';
import {
    CalendarCheck,
    Lock,
    Unlock,
    CheckCircle,
    AlertCircle,
    Sparkles,
    ArrowRight,
    Plus,
    X,
} from 'lucide-react';

// Check if it's Sunday (Review) or Monday (Planning)
function getReviewDay() {
    const day = new Date().getDay();
    if (day === 0) return 'review'; // Sunday
    if (day === 1) return 'planning'; // Monday
    return null;
}

// Mock data for incomplete review/plan
const mockReviewStatus = {
    reviewCompleted: false,
    planningCompleted: false,
};

export default function WeeklyReviewPage() {
    const [reviewDay, setReviewDay] = useState<'review' | 'planning' | null>(null);
    const [isLocked, setIsLocked] = useState(false);
    const [reviewStatus, setReviewStatus] = useState(mockReviewStatus);

    // Review Form State
    const [wins, setWins] = useState<string[]>(['']);
    const [challenges, setChallenges] = useState<string[]>(['']);
    const [insights, setInsights] = useState<string[]>(['']);
    const [weekNotes, setWeekNotes] = useState('');
    const [aiSummary, setAiSummary] = useState('');
    const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);

    // Planning Form State
    const [priorities, setPriorities] = useState<string[]>(['', '', '']);
    const [focusAreas, setFocusAreas] = useState<string[]>(['']);
    const [aiSuggestions, setAiSuggestions] = useState('');

    useEffect(() => {
        const day = getReviewDay();
        setReviewDay(day);

        // Check if locked
        if (day === 'review' && !reviewStatus.reviewCompleted) {
            setIsLocked(true);
        } else if (day === 'planning' && !reviewStatus.planningCompleted) {
            setIsLocked(true);
        }
    }, [reviewStatus]);

    const addItem = (
        items: string[],
        setItems: React.Dispatch<React.SetStateAction<string[]>>
    ) => {
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

    const handleGenerateAISummary = async () => {
        setIsGeneratingSummary(true);
        // Simulate AI call
        await new Promise((resolve) => setTimeout(resolve, 2000));
        setAiSummary(
            'This week showed strong progress in business development with 3 client meetings converted. Key challenge was time management around the product launch. Consider batching similar tasks and protecting deep work hours next week.'
        );
        setIsGeneratingSummary(false);
    };

    const handleCompleteReview = () => {
        setReviewStatus((prev) => ({ ...prev, reviewCompleted: true }));
        setIsLocked(false);
    };

    const handleCompletePlanning = () => {
        setReviewStatus((prev) => ({ ...prev, planningCompleted: true }));
        setIsLocked(false);
    };

    // Render list input helper
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
                title="Weekly Review & Planning"
                description={
                    reviewDay === 'review'
                        ? 'Sunday: Complete your weekly review'
                        : reviewDay === 'planning'
                            ? 'Monday: Plan your week ahead'
                            : 'Weekly reflection and planning rituals'
                }
                icon={CalendarCheck}
            />

            {/* Lock Status Banner */}
            {isLocked && (
                <GlassCard className="bg-gradient-to-r from-red-500/10 to-orange-500/10 border-red-500/30">
                    <div className="flex items-center gap-3">
                        <Lock className="w-6 h-6 text-red-400" />
                        <div>
                            <p className="font-semibold text-white">
                                App Locked Until {reviewDay === 'review' ? 'Review' : 'Planning'} Complete
                            </p>
                            <p className="text-sm text-gray-400">
                                Complete your {reviewDay === 'review' ? 'weekly review' : 'weekly planning'} to unlock the app.
                            </p>
                        </div>
                    </div>
                </GlassCard>
            )}

            {/* Weekly Review Form (Sunday) */}
            {(reviewDay === 'review' || !reviewDay) && (
                <GlassCard>
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <CalendarCheck className="w-6 h-6 text-[#139187]" />
                            Weekly Review
                        </h2>
                        {reviewStatus.reviewCompleted && (
                            <span className="flex items-center gap-1 text-green-400 text-sm">
                                <CheckCircle className="w-4 h-4" />
                                Completed
                            </span>
                        )}
                    </div>

                    <div className="space-y-6">
                        {renderListInput('Wins', wins, setWins, 'What went well this week?')}
                        {renderListInput('Challenges', challenges, setChallenges, 'What was difficult?')}
                        {renderListInput('Insights', insights, setInsights, 'What did you learn?')}

                        {/* Week Notes - Free form description */}
                        <div>
                            <label className="text-sm text-gray-400 block mb-2">
                                Week Notes
                            </label>
                            <p className="text-xs text-gray-500 mb-2">
                                Describe how the week went in your own words. You can speak or type.
                            </p>
                            <Textarea
                                value={weekNotes}
                                onChange={(e) => setWeekNotes(e.target.value)}
                                placeholder="How did the week go overall? What stood out? Any reflections..."
                                rows={5}
                            />
                        </div>

                        {/* AI Summary */}
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
                            {aiSummary ? (
                                <InnerCard padding="sm">
                                    <p className="text-gray-300 text-sm">{aiSummary}</p>
                                </InnerCard>
                            ) : (
                                <p className="text-xs text-gray-500">
                                    AI will summarize your review and provide insights
                                </p>
                            )}
                        </div>

                        <Button
                            onClick={handleCompleteReview}
                            className="w-full"
                            icon={CheckCircle}
                        >
                            Complete Review
                        </Button>
                    </div>
                </GlassCard>
            )}

            {/* Weekly Planning Form (Monday) */}
            {(reviewDay === 'planning' || !reviewDay) && (
                <GlassCard>
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <ArrowRight className="w-6 h-6 text-[#139187]" />
                            Weekly Planning
                        </h2>
                        {reviewStatus.planningCompleted && (
                            <span className="flex items-center gap-1 text-green-400 text-sm">
                                <CheckCircle className="w-4 h-4" />
                                Completed
                            </span>
                        )}
                    </div>

                    <div className="space-y-6">
                        {/* Top 3 Priorities */}
                        <div>
                            <label className="text-sm text-gray-400 block mb-2">
                                Top 3 Priorities This Week
                            </label>
                            <div className="space-y-2">
                                {priorities.map((priority, index) => (
                                    <div key={index} className="flex gap-2 items-center">
                                        <span className="w-8 h-8 rounded-full bg-[#139187]/20 text-[#139187] flex items-center justify-center font-bold text-sm">
                                            {index + 1}
                                        </span>
                                        <Input
                                            value={priority}
                                            onChange={(e) =>
                                                updateItem(index, e.target.value, priorities, setPriorities)
                                            }
                                            placeholder={`Priority ${index + 1}`}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>

                        {renderListInput('Focus Areas', focusAreas, setFocusAreas, 'What to focus on?')}

                        {/* AI Suggestions */}
                        <InnerCard>
                            <div className="flex items-center gap-2 mb-2">
                                <Sparkles className="w-4 h-4 text-[#139187]" />
                                <span className="text-sm text-gray-400">AI Suggestions</span>
                            </div>
                            <p className="text-sm text-gray-300">
                                Based on your goals and last week&apos;s review, consider prioritizing the client proposal
                                and blocking 2 hours daily for deep work on the product launch.
                            </p>
                        </InnerCard>

                        <Button
                            onClick={handleCompletePlanning}
                            className="w-full"
                            icon={CheckCircle}
                        >
                            Complete Planning
                        </Button>
                    </div>
                </GlassCard>
            )}

            <p className="text-xs text-gray-500 text-center">
                AI assists with summaries and suggestions only. You make all decisions.
            </p>
        </>
    );
}
