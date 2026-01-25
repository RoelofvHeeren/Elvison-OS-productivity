'use client';

import { useState, useEffect } from 'react';
import {
    DndContext,
    closestCorners,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import TaskColumn from './TaskColumn';

interface Task {
    id: string;
    title: string;
    status: string;
    priority: 'HIGH' | 'MEDIUM' | 'LOW';
    dueDate: string | null;
}

interface Project {
    id: string;
    name: string;
}

interface ProjectTaskBoardProps {
    project: Project;
    tasks: Task[];
    onTaskUpdate: (taskId: string, newStatus: string) => void;
}

const COLUMNS = [
    { id: 'TODO', title: 'To Do' },
    { id: 'IN_PROGRESS', title: 'In Progress' },
    { id: 'DONE', title: 'Done' },
];

export default function ProjectTaskBoard({ project, tasks: initialTasks, onTaskUpdate }: ProjectTaskBoardProps) {
    const [tasks, setTasks] = useState<Task[]>(initialTasks);

    useEffect(() => {
        setTasks(initialTasks);
    }, [initialTasks]);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (!over) return;

        const activeId = active.id as string;
        const overId = over.id as string;

        // Find the task
        const activeTask = tasks.find(t => t.id === activeId);
        if (!activeTask) return;

        // Determine new status
        let newStatus = activeTask.status;

        // Dropped over a column
        if (COLUMNS.some(col => col.id === overId)) {
            newStatus = overId;
        }
        // Dropped over another task
        else {
            const overTask = tasks.find(t => t.id === overId);
            if (overTask) {
                newStatus = overTask.status;
            }
        }

        if (activeTask.status !== newStatus) {
            // Optimistic update
            setTasks(tasks.map((t) =>
                t.id === activeId ? { ...t, status: newStatus } : t
            ));
            onTaskUpdate(activeId, newStatus);
        }
    };

    return (
        <div className="flex-1 overflow-x-auto overflow-y-hidden h-full">
            <DndContext
                sensors={sensors}
                collisionDetection={closestCorners}
                onDragEnd={handleDragEnd}
            >
                <div className="flex gap-4 h-full min-w-max pb-4 px-1">
                    {COLUMNS.map((col) => (
                        <TaskColumn
                            key={col.id}
                            id={col.id}
                            title={col.title}
                            tasks={tasks.filter((t) => t.status === col.id)}
                        />
                    ))}
                </div>
            </DndContext>
        </div>
    );
}
