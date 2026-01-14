'use client';

import { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { Mail, Plus, X, Calendar as CalendarIcon, Clock, AlignLeft, Users, Trash2 } from 'lucide-react';
import GlassCard, { InnerCard } from '@/components/ui/GlassCard';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    initialDate?: Date;
    initialData?: any; // Event object for editing
    onDelete?: (eventId: string) => void;
}

export default function EventModal({ isOpen, onClose, onSuccess, initialDate, initialData, onDelete }: Props) {
    const [loading, setLoading] = useState(false);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [startDate, setStartDate] = useState(initialDate ? initialDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
    const [startTime, setStartTime] = useState('09:00');
    const [endDate, setEndDate] = useState(initialDate ? initialDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
    const [endTime, setEndTime] = useState('10:00');
    const [attendeeEmail, setAttendeeEmail] = useState('');
    const [attendees, setAttendees] = useState<string[]>([]);

    useEffect(() => {
        if (initialData) {
            setTitle(initialData.title);
            setDescription(initialData.description || '');
            const start = new Date(initialData.start);
            const end = new Date(initialData.end);
            setStartDate(start.toISOString().split('T')[0]);
            setStartTime(start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }));
            setEndDate(end.toISOString().split('T')[0]);
            setEndTime(end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }));
            setAttendees(initialData.attendees?.map((a: any) => a.email) || []);
        } else if (isOpen && initialDate) {
            // Reset to initialDate if creating new
            setStartDate(initialDate.toISOString().split('T')[0]);
            setEndDate(initialDate.toISOString().split('T')[0]);
            setStartTime('09:00');
            setEndTime('10:00');
            setTitle('');
            setDescription('');
            setAttendees([]);
        }
    }, [initialData, initialDate, isOpen]);

    const addAttendee = () => {
        if (attendeeEmail && !attendees.includes(attendeeEmail) && attendeeEmail.includes('@')) {
            setAttendees([...attendees, attendeeEmail]);
            setAttendeeEmail('');
        }
    };

    const removeAttendee = (email: string) => {
        setAttendees(attendees.filter(a => a !== email));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const startStr = new Date(`${startDate}T${startTime}`).toISOString();
            const endStr = new Date(`${endDate}T${endTime}`).toISOString();

            // We currently only assume creating for simplicity, but editing would be a PATCH.
            // Since we primarily care about Deleting Google events per user request, 
            // and editing Google events is complex (needs PATCH support), we'll focus on Creation/Deletion first.
            // However, if initialData exists, we should technically PATCH? 
            // For now, let's just assume we are creating if no ID, or maybe we re-create?
            // User explicitly asked to DELETE.

            if (initialData?.id) {
                // TODO: Add PATCH support if fully requested.
                // For now, let's just close or recreate. 
                // Assuming user primarily wants to delete.
                // Let's create new for now. Or error?
                // Let's just allow creating new from here for now.
            }

            const res = await fetch('/api/calendar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title,
                    description,
                    start: startStr,
                    end: endStr,
                    attendees,
                }),
            });

            if (res.ok) {
                onSuccess();
                resetForm();
                onClose();
            }
        } catch (error) {
            console.error('Failed to create event:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!initialData?.id || !onDelete) return;
        if (window.confirm('Are you sure you want to delete this event? This will remove it from Google Calendar as well.')) {
            setLoading(true);
            try {
                await onDelete(initialData.id);
                onClose();
            } catch (e) {
                console.error("Delete failed", e);
            } finally {
                setLoading(false);
            }
        }
    };

    const resetForm = () => {
        setTitle('');
        setDescription('');
        setAttendees([]);
        setAttendeeEmail('');
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={initialData ? "Edit Event" : "Create New Event"} className="max-w-xl">
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Title */}
                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-400 flex items-center gap-2">
                        <CalendarIcon className="w-4 h-4 text-[#139187]" /> Event Title
                    </label>
                    <input
                        type="text"
                        required
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="e.g., Weekly Sync"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#139187] transition-colors"
                    />
                </div>

                {/* Date & Time */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-400 flex items-center gap-2">
                            <Clock className="w-4 h-4 text-[#139187]" /> Start
                        </label>
                        <div className="grid grid-cols-[1fr_auto] gap-2">
                            <input
                                type="date"
                                required
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                style={{ colorScheme: 'dark' }}
                                className="min-w-0 w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-[#139187]"
                            />
                            <input
                                type="time"
                                required
                                value={startTime}
                                onChange={(e) => setStartTime(e.target.value)}
                                style={{ colorScheme: 'dark' }}
                                className="w-28 min-w-0 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-[#139187]"
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-400 flex items-center gap-2">
                            <Clock className="w-4 h-4 text-emerald-500" /> End
                        </label>
                        <div className="grid grid-cols-[1fr_auto] gap-2">
                            <input
                                type="date"
                                required
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                style={{ colorScheme: 'dark' }}
                                className="min-w-0 w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-[#139187]"
                            />
                            <input
                                type="time"
                                required
                                value={endTime}
                                onChange={(e) => setEndTime(e.target.value)}
                                style={{ colorScheme: 'dark' }}
                                className="w-28 min-w-0 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-[#139187]"
                            />
                        </div>
                    </div>
                </div>

                {/* Description */}
                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-400 flex items-center gap-2">
                        <AlignLeft className="w-4 h-4 text-[#139187]" /> Description
                    </label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Add notes or agenda..."
                        rows={3}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#139187] transition-colors resize-none"
                    />
                </div>

                {/* Attendees */}
                <div className="space-y-3">
                    <label className="text-sm font-medium text-gray-400 flex items-center gap-2">
                        <Users className="w-4 h-4 text-[#139187]" /> Invite People
                    </label>
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                            <input
                                type="email"
                                value={attendeeEmail}
                                onChange={(e) => setAttendeeEmail(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addAttendee())}
                                placeholder="email@example.com"
                                className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-white text-sm focus:outline-none focus:border-[#139187]"
                            />
                        </div>
                        <button
                            type="button"
                            onClick={addAttendee}
                            className="bg-white/10 hover:bg-white/20 p-2 rounded-xl border border-white/10 transition-colors"
                        >
                            <Plus className="w-5 h-5 text-white" />
                        </button>
                    </div>

                    {/* Attendee Tags */}
                    {attendees.length > 0 && (
                        <div className="flex flex-wrap gap-2 p-3 bg-white/[0.02] border border-white/5 rounded-xl">
                            {attendees.map((email) => (
                                <div key={email} className="flex items-center gap-2 bg-[#139187]/20 border border-[#139187]/30 px-2 py-1 rounded-lg text-xs text-emerald-100">
                                    <span>{email}</span>
                                    <button type="button" onClick={() => removeAttendee(email)}>
                                        <X className="w-3 h-3 hover:text-white transition-colors" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer Buttons */}
                <div className="pt-4 flex gap-3">
                    {initialData && onDelete && (
                        <Button type="button" variant="danger" onClick={handleDelete} loading={loading}>
                            <Trash2 className="w-4 h-4" />
                        </Button>
                    )}
                    <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>
                        Cancel
                    </Button>
                    {!initialData && (
                        <Button type="submit" loading={loading} className="flex-[2]">
                            Create Event & Send Invites
                        </Button>
                    )}
                    {initialData && (
                        <Button type="submit" loading={loading} className="flex-[2]" disabled>
                            Edit Not Supported Yet (Delete Only)
                        </Button>
                    )}
                </div>
            </form>
        </Modal>
    );
}
