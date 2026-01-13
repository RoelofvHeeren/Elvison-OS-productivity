'use client';

import { useState } from 'react';
import GlassCard, { InnerCard } from '@/components/ui/GlassCard';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { Input, Textarea, Select, Checkbox } from '@/components/ui/FormElements';
import { Plus, X, GripVertical } from 'lucide-react';

interface TaskFormData {
    title: string;
    projectId: string | null;
    priority: 'HIGH' | 'MEDIUM' | 'LOW';
    dueDate: string;
    dueTime: string;
    subtasks: { id: string; title: string; completed: boolean }[];
}

interface TaskFormProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: TaskFormData) => void;
    initialData?: Partial<TaskFormData>;
    projects?: { id: string; name: string }[];
}

const defaultData: TaskFormData = {
    title: '',
    projectId: null,
    priority: 'MEDIUM',
    dueDate: '',
    dueTime: '',
    subtasks: [],
};

export default function TaskForm({
    isOpen,
    onClose,
    onSubmit,
    initialData,
    projects = [],
}: TaskFormProps) {
    const [formData, setFormData] = useState<TaskFormData>({
        ...defaultData,
        ...initialData,
    });
    const [newSubtask, setNewSubtask] = useState('');

    const updateField = <K extends keyof TaskFormData>(
        field: K,
        value: TaskFormData[K]
    ) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const addSubtask = () => {
        if (newSubtask.trim()) {
            updateField('subtasks', [
                ...formData.subtasks,
                { id: crypto.randomUUID(), title: newSubtask.trim(), completed: false },
            ]);
            setNewSubtask('');
        }
    };

    const removeSubtask = (id: string) => {
        updateField(
            'subtasks',
            formData.subtasks.filter((s) => s.id !== id)
        );
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.title.trim()) return;
        onSubmit(formData);
        setFormData(defaultData);
        onClose();
    };

    const priorityOptions = [
        { value: 'HIGH', label: '🔴 High Priority' },
        { value: 'MEDIUM', label: '🟡 Medium Priority' },
        { value: 'LOW', label: '🟢 Low Priority' },
    ];

    const projectOptions = [
        { value: '', label: 'No Project' },
        ...projects.map((p) => ({ value: p.id, label: p.name })),
    ];

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={initialData ? 'Edit Task' : 'New Task'}
            description="Create a new task with optional due date and subtasks"
            footer={
                <>
                    <Button variant="secondary" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit} disabled={!formData.title.trim()}>
                        {initialData ? 'Update' : 'Create Task'}
                    </Button>
                </>
            }
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Title */}
                <Input
                    label="Task Title"
                    value={formData.title}
                    onChange={(e) => updateField('title', e.target.value)}
                    placeholder="What needs to be done?"
                    autoFocus
                />

                {/* Project & Priority Row */}
                <div className="grid grid-cols-2 gap-4">
                    <Select
                        label="Project"
                        value={formData.projectId || ''}
                        onChange={(e) => updateField('projectId', e.target.value || null)}
                        options={projectOptions}
                    />
                    <Select
                        label="Priority"
                        value={formData.priority}
                        onChange={(e) => updateField('priority', e.target.value as TaskFormData['priority'])}
                        options={priorityOptions}
                    />
                </div>

                {/* Due Date & Time */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                        label="Due Date"
                        type="date"
                        value={formData.dueDate}
                        onChange={(e) => updateField('dueDate', e.target.value)}
                    />
                    <Input
                        label="Due Time"
                        type="time"
                        value={formData.dueTime}
                        onChange={(e) => updateField('dueTime', e.target.value)}
                    />
                </div>

                {/* Subtasks */}
                <div className="space-y-2">
                    <label className="text-sm text-gray-400 block">Subtasks</label>

                    {formData.subtasks.length > 0 && (
                        <div className="space-y-2 mb-2">
                            {formData.subtasks.map((subtask) => (
                                <div
                                    key={subtask.id}
                                    className="flex items-center gap-2 bg-[var(--glass-base)] rounded-lg px-3 py-2"
                                >
                                    <GripVertical className="w-4 h-4 text-gray-500 cursor-grab" />
                                    <span className="flex-1 text-sm text-gray-300">{subtask.title}</span>
                                    <button
                                        type="button"
                                        onClick={() => removeSubtask(subtask.id)}
                                        className="p-1 hover:bg-white/5 rounded text-gray-500 hover:text-red-400"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={newSubtask}
                            onChange={(e) => setNewSubtask(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSubtask())}
                            placeholder="Add a subtask..."
                            className="flex-1 bg-[var(--glass-base)] border border-[var(--glass-border)] rounded-lg px-3 py-2 text-sm text-[var(--text-main)] placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--accent-primary)]"
                        />
                        <Button
                            type="button"
                            variant="accent"
                            size="sm"
                            icon={Plus}
                            onClick={addSubtask}
                            disabled={!newSubtask.trim()}
                        >
                            Add
                        </Button>
                    </div>
                </div>
            </form>
        </Modal>
    );
}
