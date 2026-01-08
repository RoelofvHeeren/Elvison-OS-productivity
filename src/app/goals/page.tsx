'use client';

import { useState, useEffect } from 'react';
import PageHeader from '@/components/layout/PageHeader';
import GlassCard, { InnerCard } from '@/components/ui/GlassCard';
import Button from '@/components/ui/Button';
import TabNav from '@/components/ui/TabNav';
import Modal from '@/components/ui/Modal';
import { Input, Textarea, Select } from '@/components/ui/FormElements';
import { Target, Link as LinkIcon, Calendar, Check, Plus, Loader2, Edit, Trash2 } from 'lucide-react';

interface Goal {
    id: string;
    title: string;
    category: 'BUSINESS' | 'PERSONAL';
    timeframe: 'ANNUAL' | 'QUARTERLY' | 'MONTHLY';
    successCriteria: string | null;
    why: string | null;
    linkedProjects: string[];
}

interface Project {
    id: string;
    name: string;
}

const tabs = [
    { id: 'MONTHLY', label: 'Monthly', icon: Calendar },
    { id: 'QUARTERLY', label: 'Quarterly', icon: Calendar },
    { id: 'ANNUAL', label: 'Annually', icon: Calendar },
];

export default function GoalsPage() {
    const [activeTab, setActiveTab] = useState('MONTHLY');
    const [goals, setGoals] = useState<Goal[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        title: '',
        category: 'PERSONAL',
        timeframe: 'ANNUAL',
        successCriteria: '',
        why: '',
        linkedProjectIds: [] as string[],
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [goalsRes, projectsRes] = await Promise.all([
                fetch('/api/goals'),
                fetch('/api/projects'),
            ]);

            if (goalsRes.ok) {
                const goalsData = await goalsRes.json();
                setGoals(goalsData);
            }

            if (projectsRes.ok) {
                const projectsData = await projectsRes.json();
                setProjects(projectsData.map((p: any) => ({ id: p.id, name: p.name })));
            }
        } catch (error) {
            console.error('Failed to fetch data:', error);
        } finally {
            setLoading(false);
        }
    };

    const currentGoals = goals.filter(g => g.timeframe === activeTab);

    const openForm = (goal?: Goal) => {
        if (goal) {
            setEditingGoal(goal);
            setFormData({
                title: goal.title,
                category: goal.category,
                timeframe: goal.timeframe,
                successCriteria: goal.successCriteria || '',
                why: goal.why || '',
                linkedProjectIds: [],
            });
        } else {
            setEditingGoal(null);
            setFormData({
                title: '',
                category: 'PERSONAL',
                timeframe: activeTab,
                successCriteria: '',
                why: '',
                linkedProjectIds: [],
            });
        }
        setIsFormOpen(true);
    };

    const deleteGoal = async (id: string) => {
        if (!confirm('Are you sure you want to delete this goal?')) return;

        // Optimistic update
        const originalGoals = [...goals];
        setGoals(goals.filter(g => g.id !== id));

        try {
            const res = await fetch(`/api/goals/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Failed to delete');
        } catch (error) {
            console.error('Failed to delete goal:', error);
            setGoals(originalGoals);
        }
    };

    const handleSubmit = async () => {
        if (!formData.title.trim() || isSubmitting) return;
        setIsSubmitting(true);

        try {
            if (editingGoal) {
                const res = await fetch(`/api/goals/${editingGoal.id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData),
                });

                if (res.ok) {
                    const updatedGoal = await res.json();
                    setGoals(goals.map(g =>
                        g.id === editingGoal.id ? updatedGoal : g
                    ));
                }
            } else {
                const res = await fetch('/api/goals', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData),
                });

                if (res.ok) {
                    const newGoal = await res.json();
                    setGoals([newGoal, ...goals]);
                }
            }
        } catch (error) {
            console.error('Failed to save goal:', error);
        } finally {
            setIsSubmitting(false);
        }

        setIsFormOpen(false);
        setEditingGoal(null);
    };

    if (loading) {
        return (
            <>
                <PageHeader title="Goals" description="Your vision at every level" icon={Target} />
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 text-[#139187] animate-spin" />
                </div>
            </>
        );
    }

    return (
        <>
            <PageHeader title="Goals" description="Your vision at every level" icon={Target}>
                <Button icon={Plus} onClick={() => openForm()}>
                    New Goal
                </Button>
            </PageHeader>



            <TabNav
                tabs={tabs.map((t) => ({
                    ...t,
                    count: goals.filter(g => g.timeframe === t.id).length,
                }))}
                activeTab={activeTab}
                onTabChange={setActiveTab}
            >
                {currentGoals.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-gray-400">No {activeTab.toLowerCase()} goals yet</p>
                        <p className="text-sm text-gray-500 mt-1">Click "New Goal" to add one</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {currentGoals.map((goal) => (
                            <InnerCard key={goal.id}>
                                <div className="flex items-start gap-4">
                                    <div className="p-2 rounded-lg bg-[#139187]/20">
                                        <Target className="w-6 h-6 text-[#139187]" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <h3 className="text-lg font-semibold text-white">
                                                    {goal.title}
                                                </h3>
                                                <span
                                                    className={`inline-block mt-1 px-2 py-0.5 rounded text-xs ${goal.category === 'BUSINESS'
                                                        ? 'bg-blue-500/20 text-blue-400'
                                                        : 'bg-purple-500/20 text-purple-400'
                                                        }`}
                                                >
                                                    {goal.category}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <button
                                                    onClick={() => openForm(goal)}
                                                    className="p-1.5 text-gray-500 hover:text-white hover:bg-white/5 rounded transition-colors"
                                                    title="Edit Goal"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => deleteGoal(goal.id)}
                                                    className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded transition-colors"
                                                    title="Delete Goal"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>

                                        <div className="mt-4 space-y-3">
                                            {goal.successCriteria && (
                                                <div>
                                                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
                                                        Success Criteria
                                                    </p>
                                                    <p className="text-sm text-gray-300 flex items-start gap-2">
                                                        <Check className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
                                                        {goal.successCriteria}
                                                    </p>
                                                </div>
                                            )}

                                            {goal.why && (
                                                <div>
                                                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
                                                        Why This Matters
                                                    </p>
                                                    <p className="text-sm text-gray-400 italic">&ldquo;{goal.why}&rdquo;</p>
                                                </div>
                                            )}

                                            {goal.linkedProjects.length > 0 && (
                                                <div>
                                                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
                                                        Linked Projects
                                                    </p>
                                                    <div className="flex flex-wrap gap-2">
                                                        {goal.linkedProjects.map((project) => (
                                                            <span
                                                                key={project}
                                                                className="inline-flex items-center gap-1 px-2 py-1 bg-white/5 rounded text-xs text-gray-300"
                                                            >
                                                                <LinkIcon className="w-3 h-3" />
                                                                {project}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </InnerCard>
                        ))}
                    </div>
                )}
            </TabNav>

            {/* Goal Form Modal */}
            <Modal
                isOpen={isFormOpen}
                onClose={() => {
                    setIsFormOpen(false);
                    setEditingGoal(null);
                }}
                title={editingGoal ? 'Edit Goal' : 'New Goal'}
                description="Define your vision with clear success criteria"
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setIsFormOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleSubmit} loading={isSubmitting} disabled={!formData.title.trim()}>
                            {editingGoal ? 'Save Changes' : 'Create Goal'}
                        </Button>
                    </>
                }
            >
                <div className="space-y-4">
                    <Input
                        label="Goal Title"
                        placeholder="e.g., Grow business revenue by 50%"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    />
                    <div className="grid grid-cols-2 gap-4">
                        <Select
                            label="Category"
                            value={formData.category}
                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                            options={[
                                { value: 'BUSINESS', label: 'Business' },
                                { value: 'PERSONAL', label: 'Personal' },
                            ]}
                        />
                        <Select
                            label="Timeframe"
                            value={formData.timeframe}
                            onChange={(e) => setFormData({ ...formData, timeframe: e.target.value })}
                            options={[
                                { value: 'ANNUAL', label: 'Annual' },
                                { value: 'QUARTERLY', label: 'Quarterly' },
                                { value: 'MONTHLY', label: 'Monthly' },
                            ]}
                        />
                    </div>
                    <Textarea
                        label="Success Criteria"
                        placeholder="How will you know you've achieved this goal?"
                        rows={2}
                        value={formData.successCriteria}
                        onChange={(e) => setFormData({ ...formData, successCriteria: e.target.value })}
                    />
                    <Textarea
                        label="Why This Matters"
                        placeholder="What's your motivation for this goal?"
                        rows={2}
                        value={formData.why}
                        onChange={(e) => setFormData({ ...formData, why: e.target.value })}
                    />
                    {projects.length > 0 && (
                        <div>
                            <label className="text-sm text-gray-400 block mb-2">Link Projects (Optional)</label>
                            <div className="flex flex-wrap gap-2">
                                {projects.map((project) => (
                                    <button
                                        key={project.id}
                                        onClick={() => {
                                            const isSelected = formData.linkedProjectIds.includes(project.id);
                                            setFormData({
                                                ...formData,
                                                linkedProjectIds: isSelected
                                                    ? formData.linkedProjectIds.filter(id => id !== project.id)
                                                    : [...formData.linkedProjectIds, project.id],
                                            });
                                        }}
                                        className={`px-3 py-1.5 rounded text-sm transition-colors ${formData.linkedProjectIds.includes(project.id)
                                            ? 'bg-[#139187]/30 text-[#139187] border border-[#139187]'
                                            : 'bg-white/5 text-gray-400 border border-white/10 hover:border-white/30'
                                            }`}
                                    >
                                        {project.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </Modal>

            <p className="text-xs text-gray-500 text-center">
                AI does not create or modify goals. You are in full control of your direction.
            </p>
        </>
    );
}
