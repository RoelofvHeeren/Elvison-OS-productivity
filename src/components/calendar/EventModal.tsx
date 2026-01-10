'use client';

import { useState } from 'react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { Mail, Plus, X, Calendar as CalendarIcon, Clock, AlignLeft, Users } from 'lucide-react';
import GlassCard, { InnerCard } from '@/components/ui/GlassCard';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    initialDate?: Date;
}

export default function EventModal({ isOpen, onClose, onSuccess, initialDate }: Props) {
    const [loading, setLoading] = useState(false);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [startDate, setStartDate] = useState(initialDate ? initialDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
    const [startTime, setStartTime] = useState('09:00');
    const [endDate, setEndDate] = useState(initialDate ? initialDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
    const [endTime, setEndTime] = useState('10:00');
    const [attendeeEmail, setAttendeeEmail] = useState('');
    const [attendees, setAttendees] = useState<string[]>([]);

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
            const startStr = `${startDate}T${startTime}:00`;
            const endStr = `${endDate}T${endTime}:00`;

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

    const resetForm = () => {
        setTitle('');
        setDescription('');
        setAttendees([]);
        setAttendeeEmail('');
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Create New Event">
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-400 flex items-center gap-2">
                            <Clock className="w-4 h-4 text-[#139187]" /> Start
                        </label>
                        <div className="flex gap-2">
                            <input
                                type="date"
                                required
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-[#139187]"
                            />
                            <input
                                type="time"
                                required
                                value={startTime}
                                onChange={(e) => setStartTime(e.target.value)}
                                className="w-32 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-[#139187]"
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-400 flex items-center gap-2">
                            <Clock className="w-4 h-4 text-emerald-500" /> End
                        </label>
                        <div className="flex gap-2">
                            <input
                                type="date"
                                required
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-[#139187]"
                            />
                            <input
                                type="time"
                                required
                                value={endTime}
                                onChange={(e) => setEndTime(e.target.value)}
                                className="w-32 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-[#139187]"
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

                {/* Submit */}
                <div className="pt-4 flex gap-3">
                    <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button type="submit" loading={loading} className="flex-[2]">
                        Create Event & Send Invites
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
