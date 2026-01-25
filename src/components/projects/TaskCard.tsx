'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Clock, GripVertical } from 'lucide-react';
import { format } from 'date-fns';
import StatusBadge, { getStatusType } from '@/components/ui/StatusBadge';

interface Task {
    id: string;
    title: string;
    status: string;
    priority: 'HIGH' | 'MEDIUM' | 'LOW';
    dueDate: string | null;
}

interface TaskCardProps {
    task: Task;
}

export default function TaskCard({ task }: TaskCardProps) {
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
            case 'HIGH': return 'border-l-red-500';
            case 'MEDIUM': return 'border-l-yellow-500';
            case 'LOW': return 'border-l-green-500';
            default: return 'border-l-gray-500';
        }
    };

    if (isDragging) {
        return (
            <div
                ref={setNodeRef}
                style={style}
                className="opacity-50 bg-[#139187]/20 border border-[#139187] p-3 rounded-lg h-[100px]"
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
                group bg-[var(--glass-base)] hover:bg-white/10 
                border border-[var(--glass-border)] rounded-lg p-3 
                cursor-grab active:cursor-grabbing transition-all
                border-l-4 ${getPriorityColor(task.priority)}
            `}
        >
            <div className="flex justify-between items-start mb-2">
                <span className="text-sm text-white font-medium line-clamp-2">{task.title}</span>
                <button className="text-gray-500 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity">
                    <GripVertical className="w-4 h-4" />
                </button>
            </div>

            <div className="flex items-center justify-between mt-3">
                <div className="flex items-center gap-2">
                    {task.dueDate && (
                        <div className={`
                            flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded
                            ${new Date(task.dueDate) < new Date() ? 'bg-red-500/20 text-red-400' : 'bg-white/5 text-gray-400'}
                        `}>
                            <Clock className="w-3 h-3" />
                            <span>{format(new Date(task.dueDate), 'MMM d')}</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
