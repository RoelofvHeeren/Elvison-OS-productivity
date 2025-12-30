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
} from 'lucide-react';

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
    tasks?: { id: string; title: string; status: string }[];
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
                                            <h3 className="text-lg font-semibold text-white">
                                                {project.name}
                                            </h3>
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
                                    <p className="text-sm text-gray-400 mt-2">{project.objective}</p>
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
                                        <div className="w-full bg-black/30 rounded-full h-2">
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
                                        <div className="flex items-center gap-4 text-xs text-gray-500">
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
                                <div className="flex border-t border-white/5">
                                    <button
                                        onClick={() => {
                                            setSelectedProject(project);
                                            setViewMode('tasks');
                                        }}
                                        className="flex-1 flex items-center justify-center gap-2 py-3 text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                                    >
                                        <CheckSquare className="w-4 h-4" />
                                        Tasks ({project.tasksCount})
                                    </button>
                                    <button
                                        onClick={() => {
                                            setSelectedProject(project);
                                            setViewMode('notes');
                                        }}
                                        className="flex-1 flex items-center justify-center gap-2 py-3 text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-colors border-l border-white/5"
                                    >
                                        <FileText className="w-4 h-4" />
                                        Notes ({project.notesCount})
                                    </button>
                                    <button
                                        onClick={() => openForm(project)}
                                        className="flex-1 flex items-center justify-center gap-2 py-3 text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-colors border-l border-white/5"
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
            >
                {viewMode === 'tasks' ? (
                    <div className="space-y-3">
                        {selectedProject?.tasks && selectedProject.tasks.length > 0 ? (
                            selectedProject.tasks.map((task) => (
                                <div key={task.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/5">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-1.5 rounded-full ${task.status === 'DONE' ? 'bg-green-500/20 text-green-400' : 'bg-black/20 text-gray-500'}`}>
                                            <CheckSquare className="w-4 h-4" />
                                        </div>
                                        <span className={`text-sm ${task.status === 'DONE' ? 'text-gray-500 line-through' : 'text-white'}`}>
                                            {task.title}
                                        </span>
                                    </div>
                                    <StatusBadge status={getStatusType(task.status)} label={task.status} />
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-8 text-gray-400">
                                <p>No tasks yet. Add tasks in the Task Manager.</p>
                            </div>
                        )}
                        <div className="pt-4 border-t border-white/5">
                            <Button variant="secondary" className="w-full" onClick={() => window.location.href = '/tasks'}>
                                Manage Tasks
                            </Button>
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
        </>
    );
}
