'use client';

import { useState } from 'react';
import { InnerCard } from '@/components/ui/GlassCard';
import StatusBadge, { getStatusType } from '@/components/ui/StatusBadge';
import { IconButton } from '@/components/ui/Button';
import {
    Circle,
    CheckCircle2,
    Clock,
    MoreVertical,
    Trash2,
    Edit,
    ChevronDown,
    ChevronRight,
    GripVertical,
    Calendar,
} from 'lucide-react';

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

interface TaskItemProps {
    task: Task;
    onToggleStatus: (id: string) => void;
    onEdit: (task: Task) => void;
    onDelete: (id: string) => void;
    onToggleSubtask: (taskId: string, subtaskId: string) => void;
}

const priorityColors = {
    HIGH: 'border-l-red-400',
    MEDIUM: 'border-l-yellow-400',
    LOW: 'border-l-green-400',
};

export default function TaskItem({
    task,
    onToggleStatus,
    onEdit,
    onDelete,
    onToggleSubtask,
}: TaskItemProps) {
    const [showSubtasks, setShowSubtasks] = useState(false);
    const [showMenu, setShowMenu] = useState(false);

    const isDone = task.status === 'DONE';
    const completedSubtasks = task.subtasks.filter((s) => s.completed).length;

    return (
        <InnerCard
            padding="none"
            className={`border-l-4 ${priorityColors[task.priority]} ${isDone ? 'opacity-60' : ''
                } ${showMenu ? 'relative z-[100]' : 'relative'}`}
        >
            <div className="flex items-start gap-3 p-4">
                {/* Status Toggle */}
                <button
                    onClick={() => onToggleStatus(task.id)}
                    className="mt-0.5 shrink-0"
                >
                    {isDone ? (
                        <CheckCircle2 className="w-5 h-5 text-green-400" />
                    ) : task.status === 'IN_PROGRESS' ? (
                        <Circle className="w-5 h-5 text-[#139187] fill-[#139187]/30" />
                    ) : (
                        <Circle className="w-5 h-5 text-gray-500 hover:text-[#139187] transition-colors" />
                    )}
                </button>

                {/* Task Content */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                        <div>
                            <p
                                className={`font-medium ${isDone ? 'text-gray-500 line-through' : 'text-white'
                                    }`}
                            >
                                {task.title}
                            </p>
                            <div className="flex flex-wrap items-center gap-2 mt-1">
                                {task.project && (
                                    <span className="text-xs text-gray-500 bg-white/5 px-2 py-0.5 rounded">
                                        {task.project.name}
                                    </span>
                                )}
                                {task.dueDate && new Date(task.dueDate).getFullYear() > 2000 && (
                                    <span className="flex items-center gap-1 text-xs text-gray-400">
                                        <Calendar className="w-3 h-3" />
                                        {new Date(task.dueDate).toLocaleDateString('en-US', {
                                            month: 'short',
                                            day: 'numeric',
                                        })}
                                        {task.dueTime && ` at ${new Date(task.dueTime).toLocaleTimeString('en-US', {
                                            hour: 'numeric',
                                            minute: '2-digit',
                                        })}`}
                                    </span>
                                )}
                                {task.doToday && !isDone && (
                                    <span className="text-xs text-[#139187] bg-[#139187]/10 px-2 py-0.5 rounded">
                                        Today
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="relative">
                            <IconButton
                                icon={MoreVertical}
                                onClick={() => setShowMenu(!showMenu)}
                            />
                            {showMenu && (
                                <>
                                    <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
                                    <div className="absolute right-0 top-full mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50 py-1 min-w-[120px]">
                                        <button
                                            onClick={() => {
                                                onEdit(task);
                                                setShowMenu(false);
                                            }}
                                            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-300 hover:bg-white/5"
                                        >
                                            <Edit className="w-4 h-4" />
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => {
                                                onDelete(task.id);
                                                setShowMenu(false);
                                            }}
                                            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-400 hover:bg-white/5"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                            Delete
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Subtasks */}
                    {task.subtasks.length > 0 && (
                        <div className="mt-2">
                            <button
                                onClick={() => setShowSubtasks(!showSubtasks)}
                                className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-300"
                            >
                                {showSubtasks ? (
                                    <ChevronDown className="w-3 h-3" />
                                ) : (
                                    <ChevronRight className="w-3 h-3" />
                                )}
                                {completedSubtasks}/{task.subtasks.length} subtasks
                            </button>

                            {showSubtasks && (
                                <div className="mt-2 space-y-1 pl-2 border-l border-white/10">
                                    {task.subtasks.map((subtask) => (
                                        <div
                                            key={subtask.id}
                                            className="flex items-center gap-2 py-1"
                                        >
                                            <button
                                                onClick={() => onToggleSubtask(task.id, subtask.id)}
                                                className="shrink-0"
                                            >
                                                {subtask.completed ? (
                                                    <CheckCircle2 className="w-4 h-4 text-green-400" />
                                                ) : (
                                                    <Circle className="w-4 h-4 text-gray-500 hover:text-[#139187]" />
                                                )}
                                            </button>
                                            <span
                                                className={`text-sm ${subtask.completed
                                                    ? 'text-gray-500 line-through'
                                                    : 'text-gray-300'
                                                    }`}
                                            >
                                                {subtask.title}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </InnerCard>
    );
}
