'use client';

import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import TaskCard from './TaskCard';

interface Task {
    id: string;
    title: string;
    status: string;
    priority: 'HIGH' | 'MEDIUM' | 'LOW';
    dueDate: string | null;
}

interface TaskColumnProps {
    id: string;
    title: string;
    tasks: Task[];
}

export default function TaskColumn({ id, title, tasks }: TaskColumnProps) {
    const { setNodeRef } = useDroppable({ id });

    return (
        <div className="flex flex-col h-full min-w-[280px] w-full max-w-[350px] bg-white/5 rounded-xl border border-white/5 overflow-hidden">
            {/* Column Header */}
            <div className="p-3 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-white">{title}</span>
                    <span className="bg-white/10 text-[10px] px-1.5 py-0.5 rounded-full text-gray-400">
                        {tasks.length}
                    </span>
                </div>
            </div>

            {/* Column Body */}
            <div
                ref={setNodeRef}
                className="flex-1 p-2 space-y-2 overflow-y-auto custom-scrollbar"
            >
                <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
                    {tasks.map((task) => (
                        <TaskCard key={task.id} task={task} />
                    ))}
                </SortableContext>

                {tasks.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-8 text-gray-500 text-xs border border-dashed border-white/10 rounded-lg">
                        <p>No tasks</p>
                    </div>
                )}
            </div>
        </div>
    );
}
