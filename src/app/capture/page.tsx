'use client';

import { useState, useRef, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Mic, Square, Loader2, CheckCircle2, ChevronLeft, Edit3, Calendar, FolderOpen, Flag, Bell, Clock } from 'lucide-react';
import Button, { IconButton } from '@/components/ui/Button';

interface CaptureCandidate {
    type: 'TASK' | 'NOTE' | 'REMINDER';
    title: string;
    content?: string;
    priority?: 'HIGH' | 'MEDIUM' | 'LOW';
    dueDate?: string;
    datetime?: string;
    projectId?: string;
    projectName?: string;
}

interface Project {
    id: string;
    name: string;
}

function CapturePageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const mode = searchParams.get('mode') || 'task';

    const [isRecording, setIsRecording] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [candidate, setCandidate] = useState<CaptureCandidate | null>(null);
    const [projects, setProjects] = useState<Project[]>([]);
    const [originalText, setOriginalText] = useState('');
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Editable fields
    const [editTitle, setEditTitle] = useState('');
    const [editDueDate, setEditDueDate] = useState('');
    const [editDatetime, setEditDatetime] = useState('');
    const [editPriority, setEditPriority] = useState<'HIGH' | 'MEDIUM' | 'LOW'>('MEDIUM');
    const [editProjectId, setEditProjectId] = useState<string>('');

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const chunksRef = useRef<Blob[]>([]);

    useEffect(() => {
        // Request permissions early but don't hold the stream
        navigator.mediaDevices.getUserMedia({ audio: true })
            .then(stream => {
                stream.getTracks().forEach(track => track.stop());
            })
            .catch(err => {
                console.error('Microphone permission denied:', err);
                setError('Microphone access is required for voice capture.');
            });
    }, []);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;

            let mimeType = 'audio/webm';
            if (MediaRecorder.isTypeSupported('audio/mp4')) {
                mimeType = 'audio/mp4';
            } else if (!MediaRecorder.isTypeSupported('audio/webm')) {
                mimeType = '';
            }

            const mediaRecorder = mimeType
                ? new MediaRecorder(stream, { mimeType })
                : new MediaRecorder(stream);

            mediaRecorderRef.current = mediaRecorder;
            chunksRef.current = [];

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    chunksRef.current.push(e.data);
                }
            };

            mediaRecorder.onstop = async () => {
                const blob = new Blob(chunksRef.current, { type: mimeType || 'audio/mp4' });
                // We stop tracks immediately in stopRecording(), but ensure here too
                if (streamRef.current) {
                    streamRef.current.getTracks().forEach(track => track.stop());
                    streamRef.current = null;
                }
                await processCapture(blob);
            };

            mediaRecorder.start(200); // Record in 200ms chunks to ensure data availability
            setIsRecording(true);
            setError(null);
        } catch (err: any) {
            setError(`Error: ${err.name || 'Unknown'} - ${err.message || String(err)}`);
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            // Stream cleanup is handled in onstop to ensure all data is captured
        }
    };

    const processCapture = async (audioBlob: Blob) => {
        setIsProcessing(true);
        setError(null);

        if (audioBlob.size === 0) {
            setError('Recording was empty. Please try again.');
            setIsProcessing(false);
            return;
        }

        const formData = new FormData();
        formData.append('audio', audioBlob, 'recording.webm');
        formData.append('mode', mode);
        formData.append('action', 'parse');

        try {
            const response = await fetch('/api/capture/process', {
                method: 'POST',
                body: formData,
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(`${data.error || 'Failed'}${data.details ? `: ${data.details}` : ''}`);
            }

            // Set candidate for review
            setCandidate(data.candidate);
            setProjects(data.projects || []);
            setOriginalText(data.originalText);

            // Initialize editable fields
            setEditTitle(data.candidate.title);
            setEditDueDate(data.candidate.dueDate || '');
            setEditDatetime(data.candidate.datetime || '');
            setEditPriority(data.candidate.priority || 'MEDIUM');
            setEditProjectId(data.candidate.projectId || '');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Something went wrong');
        } finally {
            setIsProcessing(false);
        }
    };

    const saveCapture = async () => {
        if (!candidate) return;

        setIsSaving(true);
        setError(null);

        const itemData = {
            ...candidate,
            title: editTitle,
            dueDate: editDueDate || null,
            datetime: editDatetime || null,
            priority: editPriority,
            projectId: editProjectId || null,
        };

        const formData = new FormData();
        formData.append('action', 'save');
        formData.append('data', JSON.stringify(itemData));
        formData.append('mode', mode);

        try {
            const response = await fetch('/api/capture/process', {
                method: 'POST',
                body: formData,
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(`${data.error || 'Failed'}${data.details ? `: ${data.details}` : ''}`);
            }

            setSaved(true);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Something went wrong');
        } finally {
            setIsSaving(false);
        }
    };

    const reset = () => {
        setCandidate(null);
        setSaved(false);
        setError(null);
        setOriginalText('');
    };

    // Format date for display
    const formatDate = (isoString: string) => {
        if (!isoString) return 'No date';
        try {
            return new Date(isoString).toLocaleString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit'
            });
        } catch {
            return isoString;
        }
    };

    // Success state
    if (saved) {
        return (
            <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-center space-y-6">
                <div className="bg-green-500/20 text-green-400 p-4 rounded-full">
                    <CheckCircle2 className="w-12 h-12" />
                </div>
                <div>
                    <h1 className="text-2xl font-serif font-bold text-white mb-2">Saved!</h1>
                    <p className="text-gray-400 text-sm max-w-xs mx-auto">
                        {candidate?.type === 'TASK' ? `Task: "${editTitle}"`
                            : candidate?.type === 'REMINDER' ? `Reminder: "${editTitle}"`
                                : 'Note saved'}
                    </p>
                </div>
                <div className="flex gap-4 w-full max-w-xs">
                    <Button variant="secondary" className="flex-1" onClick={() => router.push('/')}>
                        Home
                    </Button>
                    <Button variant="primary" className="flex-1" onClick={reset}>
                        New Capture
                    </Button>
                </div>
            </div>
        );
    }

    // Review state
    if (candidate) {
        return (
            <div className="h-[100dvh] bg-black flex flex-col">
                <div className="flex-none p-6 pb-2">
                    <div className="flex items-center justify-between mb-4">
                        <IconButton icon={ChevronLeft} onClick={reset} />
                        <span className="text-sm font-medium text-gray-400 uppercase tracking-widest">
                            Review {candidate.type}
                        </span>
                        <div className="w-8" />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto px-6 space-y-4 pb-4">
                    {/* Original transcript */}
                    <div className="bg-black/60 backdrop-blur-md rounded-lg p-3 border border-white/10">
                        <p className="text-xs text-white font-semibold mb-1">You said:</p>
                        <p className="text-white text-sm italic">"{originalText}"</p>
                    </div>

                    {/* Title */}
                    <div className="bg-black/60 backdrop-blur-md rounded-lg p-4 border border-white/10">
                        <label className="text-xs text-white font-bold mb-2 flex items-center gap-2">
                            <Edit3 className="w-3 h-3 text-[#139187]" /> Title
                        </label>
                        <input
                            type="text"
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            className="w-full bg-transparent text-white text-lg font-bold border-b border-white/20 focus:border-[#139187] outline-none py-1"
                        />
                    </div>

                    {candidate.type === 'TASK' && (
                        <>
                            {/* Due Date */}
                            <div className="bg-black/60 backdrop-blur-md rounded-lg p-4 border border-white/10">
                                <label className="text-xs text-white font-bold mb-2 flex items-center gap-2">
                                    <Calendar className="w-3 h-3 text-[#139187]" /> Due Date
                                </label>
                                <input
                                    type="datetime-local"
                                    value={editDueDate ? editDueDate.slice(0, 16) : ''}
                                    onChange={(e) => setEditDueDate(e.target.value ? new Date(e.target.value).toISOString() : '')}
                                    className="w-full bg-transparent text-white font-medium border-b border-white/20 focus:border-[#139187] outline-none py-1"
                                />
                                {editDueDate && (
                                    <p className="text-xs text-white font-medium mt-1">{formatDate(editDueDate)}</p>
                                )}
                            </div>

                            {/* Project */}
                            <div className="bg-black/60 backdrop-blur-md rounded-lg p-4 border border-white/10">
                                <label className="text-xs text-white font-bold mb-2 flex items-center gap-2">
                                    <FolderOpen className="w-3 h-3 text-[#139187]" /> Project
                                </label>
                                <select
                                    value={editProjectId}
                                    onChange={(e) => setEditProjectId(e.target.value)}
                                    className="w-full bg-transparent text-white font-medium border-b border-white/20 focus:border-[#139187] outline-none py-1"
                                >
                                    <option value="" className="bg-black text-white">No Project</option>
                                    {projects.map(p => (
                                        <option key={p.id} value={p.id} className="bg-black text-white">{p.name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Priority */}
                            <div className="bg-black/60 backdrop-blur-md rounded-lg p-4 border border-white/10">
                                <label className="text-xs text-white font-bold mb-2 flex items-center gap-2">
                                    <Flag className="w-3 h-3 text-[#139187]" /> Priority
                                </label>
                                <div className="flex gap-2">
                                    {(['LOW', 'MEDIUM', 'HIGH'] as const).map(p => (
                                        <button
                                            key={p}
                                            onClick={() => setEditPriority(p)}
                                            className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${editPriority === p
                                                ? p === 'HIGH' ? 'bg-red-500 text-white'
                                                    : p === 'MEDIUM' ? 'bg-yellow-500 text-black'
                                                        : 'bg-green-500 text-white'
                                                : 'bg-white/10 text-white hover:bg-white/20'
                                                }`}
                                        >
                                            {p}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}

                    {candidate.type === 'REMINDER' && (
                        <>
                            {/* Reminder Datetime */}
                            <div className="bg-black/60 backdrop-blur-md rounded-lg p-4 border border-white/10">
                                <label className="text-xs text-white font-bold mb-2 flex items-center gap-2">
                                    <Clock className="w-3 h-3 text-[#139187]" /> Remind me at
                                </label>
                                <input
                                    type="datetime-local"
                                    value={editDatetime ? editDatetime.slice(0, 16) : ''}
                                    onChange={(e) => setEditDatetime(e.target.value ? new Date(e.target.value).toISOString() : '')}
                                    className="w-full bg-transparent text-white font-medium border-b border-white/20 focus:border-[#139187] outline-none py-1"
                                />
                                {editDatetime && (
                                    <p className="text-xs text-white font-medium mt-1">{formatDate(editDatetime)}</p>
                                )}
                                {!editDatetime && (
                                    <p className="text-xs text-red-400 mt-1">Reminder time is required</p>
                                )}
                            </div>
                        </>
                    )}

                    {error && <p className="text-xs text-red-400 text-center font-bold">{error}</p>}
                </div>

                {/* Action buttons - Fixed at bottom */}
                <div className="flex-none p-6 pt-2 bg-black/90 backdrop-blur-xl border-t border-white/10">
                    <div className="flex gap-4">
                        <Button variant="secondary" className="flex-1" onClick={reset}>
                            Cancel
                        </Button>
                        <Button
                            variant="primary"
                            className="flex-1"
                            onClick={saveCapture}
                            disabled={isSaving || !editTitle.trim() || (candidate.type === 'REMINDER' && !editDatetime)}
                        >
                            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Approve & Save'}
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    // Recording state
    return (
        <div className="min-h-screen bg-black flex flex-col p-6">
            <div className="flex items-center justify-between mb-4">
                <IconButton icon={ChevronLeft} onClick={() => router.push('/')} />
                <span className="text-sm font-bold text-white uppercase tracking-widest">
                    Quick Capture
                </span>
                <div className="w-8" />
            </div>

            <div className="flex justify-center gap-2 mb-8">
                {[
                    { key: 'task', label: 'Task', color: '#3B82F6' },
                    { key: 'note', label: 'Note', color: '#F59E0B' },
                    { key: 'reminder', label: 'Reminder', color: '#10B981' }
                ].map(({ key, label, color }) => (
                    <button
                        key={key}
                        onClick={() => router.replace(`/capture?mode=${key}`)}
                        className={`px-4 py-2 rounded-full text-sm font-bold transition-all duration-200 ${mode === key
                            ? 'text-white shadow-lg scale-105'
                            : 'text-white/70 bg-white/10 hover:bg-white/20 hover:text-white'
                            }`}
                        style={mode === key ? { backgroundColor: color } : {}}
                    >
                        {label}
                    </button>
                ))}
            </div>

            <div className="flex-1 flex flex-col items-center justify-center space-y-12">
                <div className="text-center space-y-2 h-16">
                    {isProcessing ? (
                        <p className="text-xl font-bold text-purple-400 animate-pulse">Processing...</p>
                    ) : isRecording ? (
                        <p className="text-xl font-bold text-red-500 animate-pulse">Listening...</p>
                    ) : (
                        <p className="text-xl font-bold text-white">Tap to Record</p>
                    )}
                    {error && <p className="text-xs text-red-400 font-bold">{error}</p>}
                </div>

                <div className="relative group">
                    {isRecording && (
                        <div className="absolute inset-0 bg-red-500/20 rounded-full animate-ping" />
                    )}
                    <button
                        onClick={isRecording ? stopRecording : startRecording}
                        disabled={isProcessing}
                        className={`
                            relative z-10 w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300
                            ${isProcessing
                                ? 'bg-gray-800 cursor-not-allowed opacity-50'
                                : isRecording
                                    ? 'bg-red-500 text-white scale-110 shadow-[0_0_30px_rgba(239,68,68,0.4)]'
                                    : 'bg-[#139187] text-white hover:scale-105 shadow-[0_0_30px_rgba(19,145,135,0.3)]'
                            }
                        `}
                    >
                        {isProcessing ? (
                            <Loader2 className="w-8 h-8 animate-spin" />
                        ) : isRecording ? (
                            <Square className="w-8 h-8 fill-current" />
                        ) : (
                            <Mic className="w-8 h-8" />
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function CapturePage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-black flex items-center justify-center"><Loader2 className="w-8 h-8 text-white animate-spin" /></div>}>
            <CapturePageContent />
        </Suspense>
    );
}
