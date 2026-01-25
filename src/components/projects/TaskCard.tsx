'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Clock, GripVertical, Pencil } from 'lucide-react';
import { format } from 'date-fns';

interface Task {
    id: string;
    title: string;
    status: string;
    priority: 'HIGH' | 'MEDIUM' | 'LOW';
    dueDate: string | null;
}

interface TaskCardProps {
    task: Task;
    onEdit: () => void;
}

export default function TaskCard({ task, onEdit }: TaskCardProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: task.id, data: { task } });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'HIGH': return 'from-red-500/20 to-transparent border-l-red-500';
            case 'MEDIUM': return 'from-yellow-500/20 to-transparent border-l-yellow-500';
            case 'LOW': return 'from-green-500/20 to-transparent border-l-green-500';
            default: return 'from-gray-500/20 to-transparent border-l-gray-500';
        }
    };

    const getPriorityBadgeColor = (priority: string) => {
        switch (priority) {
            case 'HIGH': return 'text-red-400 bg-red-400/10 border-red-400/20';
            case 'MEDIUM': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
            case 'LOW': return 'text-green-400 bg-green-400/10 border-green-400/20';
            default: return 'text-gray-400 bg-gray-400/10 border-gray-400/20';
        }
    };

    if (isDragging) {
        return (
            <div
                ref={setNodeRef}
                style={style}
                className="opacity-50 bg-[#139187]/10 border-2 border-[#139187] p-4 rounded-xl h-[120px]"
            />
        );
    }

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className={`
                group relative bg-[var(--glass-base)] hover:bg-white/[0.08]
                border border-[var(--glass-border)] hover:border-white/20
                rounded-xl p-4 cursor-grab active:cursor-grabbing transition-all duration-200
                shadow-sm hover:shadow-lg
                bg-gradient-to-r ${getPriorityColor(task.priority)}
                border-l-[3px]
            `}
        >
            <div className="flex justify-between items-start gap-3 mb-3">
                <span className="text-sm text-white font-medium leading-relaxed line-clamp-3 w-full">
                    {task.title}
                </span>
                <button
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white"
                    onPointerDown={(e) => {
                        e.stopPropagation(); // Prevent drag start
                    }}
                    onClick={(e) => {
                        e.stopPropagation();
                        onEdit();
                    }}
                >
                    <Pencil className="w-3.5 h-3.5" />
                </button>
            </div>

            <div className="flex items-center justify-between mt-auto">
                <div className={`
                    text-[10px] px-2 py-0.5 rounded-full border font-medium
                    ${getPriorityBadgeColor(task.priority)}
                `}>
                    {task.priority || 'NORMAL'}
                </div>

                {task.dueDate && (
                    <div className={`
                        flex items-center gap-1.5 text-[10px] px-2 py-0.5 rounded-full border
                        ${new Date(task.dueDate) < new Date()
                            ? 'bg-red-500/10 text-red-400 border-red-500/20'
                            : 'bg-white/5 text-gray-400 border-white/10'}
                    `}>
                        <Clock className="w-3 h-3" />
                        <span>{format(new Date(task.dueDate), 'MMM d')}</span>
                    </div>
                )}
            </div>

            {/* Grip Handle for visual cue */}
            <div className="absolute top-1/2 right-1 -translate-y-1/2 opacity-0 group-hover:opacity-20 transition-opacity">
                <GripVertical className="w-4 h-8" />
            </div>
        </div>
    );
}
