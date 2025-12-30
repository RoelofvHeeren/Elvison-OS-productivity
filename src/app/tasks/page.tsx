'use client';

import { useState, useEffect } from 'react';
import PageHeader from '@/components/layout/PageHeader';
import GlassCard from '@/components/ui/GlassCard';
import Button from '@/components/ui/Button';
import TabNav from '@/components/ui/TabNav';
import VoiceCapture from '@/components/tasks/VoiceCapture';
import TaskForm from '@/components/tasks/TaskForm';
import TaskItem from '@/components/tasks/TaskItem';
import { CheckSquare, Plus, Filter, Search, Loader2, ChevronDown, ChevronRight } from 'lucide-react';

interface Task {
    id: string;
    title: string;
    priority: 'HIGH' | 'MEDIUM' | 'LOW';
    status: 'TODO' | 'IN_PROGRESS' | 'BLOCKED' | 'DONE';
    dueDate?: string | null;
    dueTime?: string | null;
    doToday: boolean;
    project?: { id: string; name: string } | null;
    subtasks: { id: string; title: string; completed: boolean }[];
}

interface Project {
    id: string;
    name: string;
}

const tabs = [
    { id: 'all', label: 'All Tasks' },
    { id: 'today', label: 'Today' },
    { id: 'upcoming', label: 'Upcoming' },
    { id: 'completed', label: 'Completed' },
];

export default function TasksPage() {
    const [activeTab, setActiveTab] = useState('all');
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingTask, setEditingTask] = useState<Task | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isProcessingAI, setIsProcessingAI] = useState(false);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCompletedToday, setShowCompletedToday] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [tasksRes, projectsRes] = await Promise.all([
                fetch('/api/tasks'),
                fetch('/api/projects'),
            ]);

            if (tasksRes.ok) {
                const tasksData = await tasksRes.json();
                setTasks(tasksData);
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

    // Filter tasks based on active tab
    const filteredTasks = tasks.filter((task) => {
        // Search filter
        if (searchQuery && !task.title.toLowerCase().includes(searchQuery.toLowerCase())) {
            return false;
        }

        switch (activeTab) {
            case 'today':
                return task.doToday && task.status !== 'DONE';
            case 'upcoming':
                return task.dueDate && task.status !== 'DONE';
            case 'completed':
                return task.status === 'DONE';
            default: // 'all'
                return task.status !== 'DONE';
        }
    });

    const completedTodayTasks = tasks.filter(task => task.doToday && task.status === 'DONE');

    const handleVoiceCapture = async (text: string) => {
        try {
            const res = await fetch('/api/tasks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: text,
                    priority: 'MEDIUM',
                    doToday: false,
                }),
            });

            if (res.ok) {
                const newTask = await res.json();
                setTasks([newTask, ...tasks]);
            }
        } catch (error) {
            console.error('Failed to create task:', error);
        }
    };

    const handleAIProcess = async (text: string) => {
        setIsProcessingAI(true);
        try {
            const response = await fetch('/api/ai/task-ingestion', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ input: text }),
            });

            if (response.ok) {
                const result = await response.json();
                const res = await fetch('/api/tasks', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        title: result.title || text,
                        priority: result.priority || 'MEDIUM',
                        dueDate: result.dueDate || null,
                        dueTime: result.dueTime || null,
                        doToday: result.doToday || false,
                        projectId: result.projectId || null,
                    }),
                });

                if (res.ok) {
                    const newTask = await res.json();
                    setTasks([newTask, ...tasks]);
                }
            } else {
                handleVoiceCapture(text);
            }
        } catch (error) {
            console.error('AI processing failed:', error);
            handleVoiceCapture(text);
        } finally {
            setIsProcessingAI(false);
        }
    };

    const handleToggleStatus = async (id: string) => {
        const task = tasks.find(t => t.id === id);
        if (!task) return;

        const newStatus = task.status === 'DONE' ? 'TODO' : 'DONE';

        // Optimistic update
        setTasks(tasks.map(t =>
            t.id === id ? { ...t, status: newStatus } : t
        ));

        try {
            await fetch(`/api/tasks/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus }),
            });
        } catch (error) {
            console.error('Failed to toggle task:', error);
            setTasks(tasks.map(t =>
                t.id === id ? { ...t, status: task.status } : t
            ));
        }
    };

    const handleToggleSubtask = async (taskId: string, subtaskId: string) => {
        setTasks(
            tasks.map((task) =>
                task.id === taskId
                    ? {
                        ...task,
                        subtasks: task.subtasks.map((s) =>
                            s.id === subtaskId ? { ...s, completed: !s.completed } : s
                        ),
                    }
                    : task
            )
        );
    };

    const handleEdit = (task: Task) => {
        setEditingTask(task);
        setIsFormOpen(true);
    };

    const handleDelete = async (id: string) => {
        // Optimistic update
        const taskToDelete = tasks.find(t => t.id === id);
        setTasks(tasks.filter((t) => t.id !== id));

        try {
            await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
        } catch (error) {
            console.error('Failed to delete task:', error);
            if (taskToDelete) {
                setTasks([...tasks]);
            }
        }
    };

    const handleFormSubmit = async (data: any) => {
        if (isSubmitting) return;
        setIsSubmitting(true);
        try {
            if (editingTask) {
                const res = await fetch(`/api/tasks/${editingTask.id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data),
                });

                if (res.ok) {
                    const updatedTask = await res.json();
                    setTasks(tasks.map(t =>
                        t.id === editingTask.id ? updatedTask : t
                    ));
                }
            } else {
                const res = await fetch('/api/tasks', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data),
                });

                if (res.ok) {
                    const newTask = await res.json();
                    setTasks([newTask, ...tasks]);
                }
            }
        } catch (error) {
            console.error('Failed to save task:', error);
        } finally {
            setIsSubmitting(false);
        }

        setIsFormOpen(false);
        setEditingTask(null);
    };

    if (loading) {
        return (
            <>
                <PageHeader
                    title="Task Manager"
                    description="Capture and manage your tasks"
                    icon={CheckSquare}
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
                title="Task Manager"
                description="Capture and manage your tasks"
                icon={CheckSquare}
            >
                <Button icon={Plus} onClick={() => setIsFormOpen(true)}>
                    New Task
                </Button>
            </PageHeader>

            {/* Quick Capture */}
            <GlassCard>
                <h3 className="text-sm text-gray-400 uppercase tracking-wider mb-3">
                    Quick Capture
                </h3>
                <VoiceCapture
                    onCapture={handleVoiceCapture}
                    onAIProcess={handleAIProcess}
                    isProcessing={isProcessingAI}
                />
            </GlassCard>

            {/* Task List */}
            <div className="space-y-4">
                {/* Search & Filters */}
                <div className="flex items-center gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search tasks..."
                            className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-white placeholder:text-gray-500 outline-none focus:border-[#139187]"
                        />
                    </div>
                    <Button variant="secondary" icon={Filter}>
                        Filters
                    </Button>
                </div>

                {/* Tabs */}
                <TabNav
                    tabs={tabs.map((t) => ({
                        ...t,
                        count:
                            t.id === 'all'
                                ? tasks.length
                                : t.id === 'today'
                                    ? tasks.filter((task) => task.doToday && task.status !== 'DONE').length
                                    : t.id === 'completed'
                                        ? tasks.filter((task) => task.status === 'DONE').length
                                        : undefined,
                    }))}
                    activeTab={activeTab}
                    onTabChange={setActiveTab}
                >
                    {/* Task List */}
                    <div className="space-y-3">
                        {filteredTasks.length === 0 ? (
                            <div className="text-center py-12">
                                <p className="text-gray-400">No tasks found</p>
                                <p className="text-sm text-gray-500 mt-1">
                                    {activeTab === 'all'
                                        ? 'Create your first task using voice or the button above'
                                        : 'No tasks match the current filter'}
                                </p>
                            </div>
                        ) : (
                            filteredTasks.map((task) => (
                                <TaskItem
                                    key={task.id}
                                    task={task}
                                    onToggleStatus={handleToggleStatus}
                                    onEdit={handleEdit}
                                    onDelete={handleDelete}
                                    onToggleSubtask={handleToggleSubtask}
                                />
                            ))
                        )}

                        {/* Completed Today Section for Today Tab */}
                        {activeTab === 'today' && completedTodayTasks.length > 0 && (
                            <div className="mt-8">
                                <button
                                    onClick={() => setShowCompletedToday(!showCompletedToday)}
                                    className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-400 transition-colors mb-4"
                                >
                                    {showCompletedToday ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                                    Completed Today ({completedTodayTasks.length})
                                </button>

                                {showCompletedToday && (
                                    <div className="space-y-3 opacity-60">
                                        {completedTodayTasks.map((task) => (
                                            <TaskItem
                                                key={task.id}
                                                task={task}
                                                onToggleStatus={handleToggleStatus}
                                                onEdit={handleEdit}
                                                onDelete={handleDelete}
                                                onToggleSubtask={handleToggleSubtask}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </TabNav>
            </div>

            {/* Task Form Modal */}
            <TaskForm
                isOpen={isFormOpen}
                onClose={() => {
                    setIsFormOpen(false);
                    setEditingTask(null);
                }}
                onSubmit={handleFormSubmit}
                initialData={editingTask ? {
                    title: editingTask.title,
                    priority: editingTask.priority,
                    dueDate: editingTask.dueDate || '',
                    dueTime: editingTask.dueTime || '',
                    doToday: editingTask.doToday,
                    projectId: editingTask.project?.id || null,
                    subtasks: editingTask.subtasks,
                } : undefined}
                projects={projects}
            />
        </>
    );
}
