'use client';

import { useState, useEffect } from 'react';
import PageHeader from '@/components/layout/PageHeader';
import GlassCard, { InnerCard } from '@/components/ui/GlassCard';
import Button from '@/components/ui/Button';
import StatusBadge, { getStatusType } from '@/components/ui/StatusBadge';
import TabNav from '@/components/ui/TabNav';
import Modal from '@/components/ui/Modal';
import { Input, Textarea, Select } from '@/components/ui/FormElements';
import {
    FolderKanban,
    Plus,
    Calendar,
    CheckSquare,
    FileText,
    Edit,
    Loader2,
    Circle,
    CheckCircle2,
} from 'lucide-react';
import ProjectTaskBoard from '@/components/projects/ProjectTaskBoard';

import Link from 'next/link';
import TaskForm from '@/components/tasks/TaskForm';

interface Project {
    id: string;
    name: string;
    category: 'BUSINESS' | 'PERSONAL';
    objective: string | null;
    status: 'ACTIVE' | 'PAUSED' | 'COMPLETED';
    startDate: string | null;
    targetEndDate: string | null;
    tasksCount: number;
    completedTasks: number;
    notesCount: number;
    tasks?: { id: string; title: string; status: string; priority: 'HIGH' | 'MEDIUM' | 'LOW'; dueDate: string | null }[];
    notes?: { id: string; title: string; content: string; createdAt: string }[];
}

const tabs = [
    { id: 'all', label: 'All' },
    { id: 'active', label: 'Active' },
    { id: 'paused', label: 'Paused' },
    { id: 'completed', label: 'Completed' },
];

export default function ProjectsPage() {
    const [activeTab, setActiveTab] = useState('all');
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingProject, setEditingProject] = useState<Project | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);
    const [viewMode, setViewMode] = useState<'tasks' | 'notes' | null>(null);
    const [newNote, setNewNote] = useState({ title: '', content: '' });
    const [isAddingNote, setIsAddingNote] = useState(false);
    const [viewingProject, setViewingProject] = useState<Project | null>(null);

    // Task Editing State
    const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
    const [editingTask, setEditingTask] = useState<any>(null);

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        category: 'PERSONAL',
        objective: '',
        startDate: '',
        targetEndDate: '',
    });

    useEffect(() => {
        fetchProjects();
    }, []);

    const fetchProjects = async () => {
        try {
            const res = await fetch('/api/projects');
            if (res.ok) {
                const data = await res.json();
                setProjects(data);
            }
        } catch (error) {
            console.error('Failed to fetch projects:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredProjects = projects.filter((project) => {
        if (activeTab === 'all') return true;
        return project.status.toLowerCase() === activeTab;
    });

    const getCategoryStyles = (category: string) => {
        return category === 'BUSINESS'
            ? 'bg-blue-500/20 text-blue-400'
            : 'bg-purple-500/20 text-purple-400';
    };

    const openForm = (project?: Project) => {
        if (project) {
            setEditingProject(project);
            setFormData({
                name: project.name,
                category: project.category,
                objective: project.objective || '',
                startDate: project.startDate?.split('T')[0] || '',
                targetEndDate: project.targetEndDate?.split('T')[0] || '',
            });
        } else {
            setEditingProject(null);
            setFormData({
                name: '',
                category: 'PERSONAL',
                objective: '',
                startDate: '',
                targetEndDate: '',
            });
        }
        setIsFormOpen(true);
    };

    const handleSubmit = async () => {
        if (!formData.name.trim() || isSubmitting) return;
        setIsSubmitting(true);

        try {
            if (editingProject) {
                const res = await fetch(`/api/projects/${editingProject.id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData),
                });

                if (res.ok) {
                    const updatedProject = await res.json();
                    setProjects(projects.map(p =>
                        p.id === editingProject.id ? { ...p, ...updatedProject } : p
                    ));
                }
            } else {
                const res = await fetch('/api/projects', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData),
                });

                if (res.ok) {
                    const newProject = await res.json();
                    setProjects([newProject, ...projects]);
                }
            }
        } catch (error) {
            console.error('Failed to save project:', error);
        } finally {
            setIsSubmitting(false);
        }

        setIsFormOpen(false);
        setEditingProject(null);
    };

    const handleStatusChange = async (projectId: string, newStatus: string) => {
        try {
            const res = await fetch(`/api/projects/${projectId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus }),
            });

            if (res.ok) {
                setProjects(projects.map(p =>
                    p.id === projectId ? { ...p, status: newStatus as Project['status'] } : p
                ));
            }
        } catch (error) {
            console.error('Failed to update project status:', error);
        }
    };

    const handleTaskToggle = async (taskId: string, currentStatus: string) => {
        const newStatus = currentStatus === 'DONE' ? 'TODO' : 'DONE';

        // Optimistic update for selectedProject
        if (selectedProject) {
            const updatedTasks = selectedProject.tasks?.map(t =>
                t.id === taskId ? { ...t, status: newStatus } : t
            );
            setSelectedProject({ ...selectedProject, tasks: updatedTasks });
        }

        // Optimistic update for viewingProject
        if (viewingProject) {
            const updatedTasks = viewingProject.tasks?.map(t =>
                t.id === taskId ? { ...t, status: newStatus } : t
            );
            setViewingProject({ ...viewingProject, tasks: updatedTasks });
        }

        try {
            await fetch(`/api/tasks/${taskId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus }),
            });
            // Refresh projects to update counts
            fetchProjects();
        } catch (error) {
            console.error('Failed to toggle task:', error);
            fetchProjects();
        }
    };

    if (loading) {
        return (
            <>
                <PageHeader
                    title="Projects"
                    description="Organize your work into focused projects"
                    icon={FolderKanban}
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
                title="Projects"
                description="Organize your work into focused projects"
                icon={FolderKanban}
            >
                <Button icon={Plus} onClick={() => openForm()}>
                    New Project
                </Button>
            </PageHeader>

            <TabNav
                tabs={tabs.map((t) => ({
                    ...t,
                    count:
                        t.id === 'all'
                            ? projects.length
                            : projects.filter((p) => p.status.toLowerCase() === t.id).length,
                }))}
                activeTab={activeTab}
                onTabChange={setActiveTab}
            >
                {filteredProjects.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-gray-400">No projects found</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {filteredProjects.map((project) => (
                            <InnerCard key={project.id} padding="none">
                                <div className="p-4 border-b border-white/5">
                                    <div className="flex items-start justify-between mb-2">
                                        <div>
                                            <button
                                                onClick={() => setViewingProject(project)}
                                                className="text-lg font-semibold text-[var(--text-main)] hover:text-[#139187] transition-colors text-left"
                                            >
                                                {project.name}
                                            </button>
                                            <span
                                                className={`inline-block px-2 py-0.5 rounded text-xs ${getCategoryStyles(
                                                    project.category
                                                )}`}
                                            >
                                                {project.category}
                                            </span>
                                        </div>
                                        <StatusBadge
                                            status={getStatusType(project.status)}
                                            label={project.status}
                                        />
                                    </div>
                                    <p className="text-sm text-[var(--text-muted)] mt-2">{project.objective}</p>
                                </div>

                                <div className="p-4 space-y-3">
                                    {/* Progress */}
                                    <div>
                                        <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                                            <span>Progress</span>
                                            <span>
                                                {project.completedTasks}/{project.tasksCount} tasks
                                            </span>
                                        </div>
                                        <div className="w-full bg-[var(--glass-border)] rounded-full h-2">
                                            <div
                                                className="bg-gradient-to-r from-[#139187] to-[#0d6b63] h-2 rounded-full"
                                                style={{
                                                    width: `${project.tasksCount > 0
                                                        ? (project.completedTasks / project.tasksCount) * 100
                                                        : 0
                                                        }%`,
                                                }}
                                            />
                                        </div>
                                    </div>

                                    {/* Dates */}
                                    {project.startDate && project.targetEndDate && (
                                        <div className="flex items-center gap-4 text-xs text-[var(--text-muted)]">
                                            <span className="flex items-center gap-1">
                                                <Calendar className="w-3 h-3" />
                                                {new Date(project.startDate).toLocaleDateString('en-US', {
                                                    month: 'short',
                                                    day: 'numeric',
                                                })}
                                            </span>
                                            <span>→</span>
                                            <span>
                                                {new Date(project.targetEndDate).toLocaleDateString('en-US', {
                                                    month: 'short',
                                                    day: 'numeric',
                                                    year: 'numeric',
                                                })}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* Actions */}
                                <div className="flex border-t border-[var(--glass-border)]">
                                    <button
                                        onClick={() => {
                                            setSelectedProject(project);
                                            setViewMode('tasks');
                                        }}
                                        className="flex-1 flex items-center justify-center gap-2 py-3 text-sm text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--glass-base)] transition-colors"
                                    >
                                        <CheckSquare className="w-4 h-4" />
                                        Tasks ({project.tasksCount})
                                    </button>
                                    <button
                                        onClick={() => {
                                            setSelectedProject(project);
                                            setViewMode('notes');
                                        }}
                                        className="flex-1 flex items-center justify-center gap-2 py-3 text-sm text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--glass-base)] transition-colors border-l border-[var(--glass-border)]"
                                    >
                                        <FileText className="w-4 h-4" />
                                        Notes ({project.notesCount})
                                    </button>
                                    <button
                                        onClick={() => openForm(project)}
                                        className="flex-1 flex items-center justify-center gap-2 py-3 text-sm text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--glass-base)] transition-colors border-l border-[var(--glass-border)]"
                                    >
                                        <Edit className="w-4 h-4" />
                                        Edit
                                    </button>
                                </div>
                            </InnerCard>
                        ))}
                    </div>
                )}
            </TabNav>

            {/* Project Form Modal */}
            <Modal
                isOpen={isFormOpen}
                onClose={() => {
                    setIsFormOpen(false);
                    setEditingProject(null);
                }}
                title={editingProject ? 'Edit Project' : 'New Project'}
                description="Create a container for related tasks and goals"
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setIsFormOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleSubmit} disabled={!formData.name.trim()}>
                            {editingProject ? 'Save Changes' : 'Create Project'}
                        </Button>
                    </>
                }
            >
                <div className="space-y-4">
                    <Input
                        label="Project Name"
                        placeholder="e.g., Website Redesign"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                    <Select
                        label="Category"
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        options={[
                            { value: 'BUSINESS', label: 'Business' },
                            { value: 'PERSONAL', label: 'Personal' },
                        ]}
                    />
                    <Textarea
                        label="Objective"
                        placeholder="What's the goal of this project?"
                        rows={3}
                        value={formData.objective}
                        onChange={(e) => setFormData({ ...formData, objective: e.target.value })}
                    />
                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="Start Date"
                            type="date"
                            value={formData.startDate}
                            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                        />
                        <Input
                            label="Target End Date"
                            type="date"
                            value={formData.targetEndDate}
                            onChange={(e) => setFormData({ ...formData, targetEndDate: e.target.value })}
                        />
                    </div>
                </div>
            </Modal>

            {/* Project Detail Modal */}
            <Modal
                isOpen={!!selectedProject && !!viewMode}
                onClose={() => {
                    setSelectedProject(null);
                    setViewMode(null);
                    setIsAddingNote(false);
                }}
                title={`${selectedProject?.name} - ${viewMode === 'tasks' ? 'Tasks' : 'Notes'}`}
                className="max-w-[95vw] h-[90vh] w-full"
            >
                {viewMode === 'tasks' ? (
                    <div className="h-full flex flex-col bg-[var(--glass-base)] rounded-lg p-2 overflow-hidden">
                        <div className="flex-1 overflow-hidden">
                            {selectedProject && (
                                <ProjectTaskBoard
                                    project={selectedProject}
                                    tasks={selectedProject.tasks as any[] || []}
                                    onTaskUpdate={handleTaskToggle}
                                    onEditTask={(task) => {
                                        setEditingTask(task);
                                        setIsTaskFormOpen(true);
                                    }}
                                />
                            )}
                        </div>
                        <div className="mt-4 flex justify-between items-center bg-white/5 p-3 rounded-lg">
                            <span className="text-sm text-gray-400">Drag tasks to update status</span>
                            <div className="flex gap-2">
                                <Button
                                    icon={Plus}
                                    onClick={() => {
                                        setEditingTask(null);
                                        setIsTaskFormOpen(true);
                                    }}
                                >
                                    Add Task
                                </Button>
                                <Button variant="secondary" onClick={() => window.location.href = '/tasks'}>
                                    Manage All Tasks
                                </Button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {isAddingNote ? (
                            <div className="space-y-3 p-4 bg-[#139187]/5 rounded-lg border border-[#139187]/20">
                                <h4 className="text-sm font-medium text-white mb-2">New Quick Note</h4>
                                <Input
                                    placeholder="Note Title"
                                    value={newNote.title}
                                    onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
                                />
                                <Textarea
                                    placeholder="Write your note..."
                                    rows={3}
                                    value={newNote.content}
                                    onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
                                />
                                <div className="flex gap-2">
                                    <Button size="sm" onClick={async () => {
                                        if (!newNote.title.trim()) return;
                                        try {
                                            const res = await fetch('/api/knowledge', {
                                                method: 'POST',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({
                                                    ...newNote,
                                                    projectId: selectedProject?.id,
                                                    category: 'DOCUMENT'
                                                }),
                                            });
                                            if (res.ok) {
                                                const note = await res.json();
                                                const updatedProject = {
                                                    ...selectedProject!,
                                                    notes: [note, ...(selectedProject?.notes || [])],
                                                    notesCount: (selectedProject?.notesCount || 0) + 1
                                                };
                                                setSelectedProject(updatedProject);
                                                setProjects(projects.map(p => p.id === selectedProject!.id ? updatedProject : p));
                                                setNewNote({ title: '', content: '' });
                                                setIsAddingNote(false);
                                            }
                                        } catch (e) {
                                            console.error('Failed to add note:', e);
                                        }
                                    }}>Save Note</Button>
                                    <Button size="sm" variant="secondary" onClick={() => setIsAddingNote(false)}>Cancel</Button>
                                </div>
                            </div>
                        ) : (
                            <Button icon={Plus} variant="secondary" className="w-full" onClick={() => setIsAddingNote(true)}>
                                Add Quick Note
                            </Button>
                        )}

                        <div className="space-y-3 pt-2">
                            {selectedProject?.notes && selectedProject.notes.length > 0 ? (
                                selectedProject.notes.map((note) => (
                                    <div key={note.id} className="p-3 bg-white/5 rounded-lg border border-white/5">
                                        <div className="flex items-start justify-between mb-1">
                                            <h5 className="text-sm font-semibold text-white">{note.title}</h5>
                                            <span className="text-[10px] text-gray-500">
                                                {new Date(note.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-400 line-clamp-2">{note.content}</p>
                                    </div>
                                ))
                            ) : !isAddingNote && (
                                <div className="text-center py-8 text-gray-400">
                                    <p>No notes yet.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </Modal>

            {/* Full Project Detail Modal */}
            <Modal
                isOpen={!!viewingProject}
                onClose={() => setViewingProject(null)}
                title={viewingProject?.name || 'Project Details'}
            >
                {viewingProject && (
                    <div className="space-y-6">
                        {/* Project Info */}
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <span className={`px-2 py-0.5 rounded text-xs ${getCategoryStyles(viewingProject.category)}`}>
                                    {viewingProject.category}
                                </span>
                                <StatusBadge status={getStatusType(viewingProject.status)} label={viewingProject.status} />
                            </div>
                            {viewingProject.objective && (
                                <p className="text-sm text-gray-400">{viewingProject.objective}</p>
                            )}
                        </div>

                        {/* Tasks Section */}
                        <div>
                            <h4 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
                                <CheckSquare className="w-4 h-4 text-[#139187]" />
                                Tasks ({viewingProject.tasks?.length || 0})
                            </h4>
                            <div className="space-y-2">
                                {viewingProject.tasks && viewingProject.tasks.length > 0 ? (
                                    viewingProject.tasks.map((task) => (
                                        <button
                                            key={task.id}
                                            onClick={() => handleTaskToggle(task.id, task.status)}
                                            className="w-full flex items-center gap-3 p-2 bg-white/5 rounded-lg hover:bg-white/10 transition-colors text-left"
                                        >
                                            {task.status === 'DONE' ? (
                                                <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
                                            ) : (
                                                <Circle className="w-4 h-4 text-gray-500 shrink-0" />
                                            )}
                                            <span className={`text-sm ${task.status === 'DONE' ? 'text-gray-500 line-through' : 'text-white'}`}>
                                                {task.title}
                                            </span>
                                        </button>
                                    ))
                                ) : (
                                    <p className="text-sm text-gray-500">No tasks yet</p>
                                )}
                            </div>
                        </div>

                        {/* Notes Section */}
                        <div>
                            <h4 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
                                <FileText className="w-4 h-4 text-[#139187]" />
                                Notes ({viewingProject.notes?.length || 0})
                            </h4>
                            <div className="space-y-2">
                                {viewingProject.notes && viewingProject.notes.length > 0 ? (
                                    viewingProject.notes.map((note) => (
                                        <div key={note.id} className="p-2 bg-white/5 rounded-lg">
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-sm font-medium text-white">{note.title}</span>
                                                <span className="text-xs text-gray-500">
                                                    {new Date(note.createdAt).toLocaleDateString()}
                                                </span>
                                            </div>
                                            <p className="text-xs text-gray-400 line-clamp-2">{note.content}</p>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-sm text-gray-500">No notes yet</p>
                                )}
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2 pt-2 border-t border-white/10">
                            <Button
                                variant="secondary"
                                className="flex-1"
                                icon={Edit}
                                onClick={() => {
                                    openForm(viewingProject);
                                    setViewingProject(null);
                                }}
                            >
                                Edit Project
                            </Button>
                            <Button
                                variant="secondary"
                                className="flex-1"
                                onClick={() => {
                                    setSelectedProject(viewingProject);
                                    setViewMode('notes');
                                    setViewingProject(null);
                                }}
                            >
                                Add Note
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Task Form Modal */}
            {isTaskFormOpen && (
                <TaskForm
                    isOpen={isTaskFormOpen}
                    onClose={() => {
                        setIsTaskFormOpen(false);
                        setEditingTask(null);
                    }}
                    initialData={editingTask ? {
                        title: editingTask.title,
                        priority: editingTask.priority,
                        projectId: selectedProject?.id,
                        dueDate: editingTask.dueDate ? editingTask.dueDate.split('T')[0] : '',
                    } : {
                        projectId: selectedProject?.id,
                        priority: 'MEDIUM',
                    }}
                    projects={projects}
                    onSubmit={async (data) => {
                        try {
                            const url = editingTask ? `/api/tasks/${editingTask.id}` : '/api/tasks';
                            const method = editingTask ? 'PATCH' : 'POST';

                            const res = await fetch(url, {
                                method,
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify(data),
                            });

                            if (res.ok) {
                                fetchProjects();
                                const updatedTask = await res.json();

                                if (selectedProject) {
                                    let newTasks = selectedProject.tasks || [];
                                    if (editingTask) {
                                        newTasks = newTasks.map(t => t.id === updatedTask.id ? { ...t, ...updatedTask } : t);
                                    } else {
                                        newTasks = [updatedTask, ...newTasks];
                                    }

                                    const updatedProject = { ...selectedProject, tasks: newTasks, tasksCount: newTasks.length };
                                    setSelectedProject(updatedProject);
                                    setProjects(prev => prev.map(p => p.id === updatedProject.id ? updatedProject : p));
                                }

                                setIsTaskFormOpen(false);
                                setEditingTask(null);
                            }
                        } catch (e) {
                            console.error('Failed to save task:', e);
                        }
                    }}
                    onDelete={editingTask ? async () => {
                        if (!confirm('Are you sure you want to delete this task?')) return;
                        try {
                            const res = await fetch(`/api/tasks/${editingTask.id}`, { method: 'DELETE' });
                            if (res.ok) {
                                fetchProjects();
                                if (selectedProject) {
                                    const newTasks = (selectedProject.tasks || []).filter(t => t.id !== editingTask.id);
                                    const updatedProject = { ...selectedProject, tasks: newTasks, tasksCount: newTasks.length };
                                    setSelectedProject(updatedProject);
                                    setProjects(prev => prev.map(p => p.id === updatedProject.id ? updatedProject : p));
                                }
                                setIsTaskFormOpen(false);
                                setEditingTask(null);
                            }
                        } catch (e) {
                            console.error('Failed to delete task:', e);
                        }
                    } : undefined}
                />
            )}
        </>
    );
}
