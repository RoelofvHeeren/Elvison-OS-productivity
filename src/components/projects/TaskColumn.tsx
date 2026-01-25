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
    onEditTask: (task: Task) => void;
}

export default function TaskColumn({ id, title, tasks, onEditTask }: TaskColumnProps) {
    const { setNodeRef } = useDroppable({ id });

    return (
        <div
            ref={setNodeRef}
            className="flex flex-col h-full min-w-[320px] w-[350px] bg-white/5 rounded-xl border border-white/5 overflow-hidden backdrop-blur-sm shadow-xl"
        >
            {/* Column Header */}
            <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/5">
                <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-white tracking-wide">{title}</span>
                    <span className="bg-white/10 text-[10px] px-2 py-0.5 rounded-full text-gray-300 font-medium border border-white/10">
                        {tasks.length}
                    </span>
                </div>
            </div>

            {/* Column Body */}
            <div className="flex-1 p-3 space-y-3 overflow-y-auto custom-scrollbar">
                <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
                    {tasks.map((task) => (
                        <TaskCard key={task.id} task={task} onEdit={() => onEditTask(task)} />
                    ))}
                </SortableContext>

                {tasks.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-24 text-gray-500 text-xs border border-dashed border-white/10 rounded-lg bg-white/[0.02]">
                        <p>Drop items here</p>
                    </div>
                )}
            </div>
        </div>
    );
}
