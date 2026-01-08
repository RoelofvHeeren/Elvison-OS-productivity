'use client';

import { useState, useRef, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Mic, Square, Loader2, Send, CheckCircle2, ChevronLeft } from 'lucide-react';
import Button, { IconButton } from '@/components/ui/Button';

function CapturePageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const mode = searchParams.get('mode') || 'task'; // task, note, reminder

    const [isRecording, setIsRecording] = useState(false);
    const [transcript, setTranscript] = useState(''); // If we want to show real-time transcription (optional complexity)
    const [isProcessing, setIsProcessing] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);

    useEffect(() => {
        // Request permissions early
        navigator.mediaDevices.getUserMedia({ audio: true })
            .catch(err => {
                console.error('Microphone permission denied:', err);
                setError('Microphone access is required for voice capture.');
            });
    }, []);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });

            mediaRecorderRef.current = mediaRecorder;
            chunksRef.current = [];

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    chunksRef.current.push(e.data);
                }
            };

            mediaRecorder.onstop = async () => {
                const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
                await processCapture(blob);

                // Stop all tracks
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.start();
            setIsRecording(true);
            setError(null);
        } catch (err) {
            setError('Could not start recording.');
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    };

    const processCapture = async (audioBlob: Blob) => {
        setIsProcessing(true);
        setError(null);

        const formData = new FormData();
        formData.append('audio', audioBlob, 'recording.webm');
        formData.append('mode', mode);

        try {
            const response = await fetch('/api/capture/process', {
                method: 'POST',
                body: formData,
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to process capture');
            }

            setResult(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Something went wrong');
        } finally {
            setIsProcessing(false);
        }
    };

    const reset = () => {
        setResult(null);
        setError(null);
    };

    // --- UI Rendering ---

    if (result) {
        return (
            <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-center space-y-6">
                <div className="bg-green-500/20 text-green-400 p-4 rounded-full">
                    <CheckCircle2 className="w-12 h-12" />
                </div>
                <div>
                    <h1 className="text-2xl font-serif font-bold text-white mb-2">Captured!</h1>
                    <p className="text-gray-400 text-sm max-w-xs mx-auto">
                        {result.type === 'TASK'
                            ? `Added task: "${result.item.title}"`
                            : `Authorized note.`}
                    </p>
                </div>

                <div className="flex gap-4 w-full max-w-xs">
                    <Button
                        variant="secondary"
                        className="flex-1"
                        onClick={() => router.push('/')}
                    >
                        Home
                    </Button>
                    <Button
                        variant="primary"
                        className="flex-1"
                        onClick={reset}
                    >
                        New Capture
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black flex flex-col p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <IconButton icon={ChevronLeft} onClick={() => router.push('/')} />
                <span className="text-sm font-medium text-gray-400 uppercase tracking-widest">
                    New {mode}
                </span>
                <div className="w-8" /> {/* Spacer */}
            </div>

            {/* Main */}
            <div className="flex-1 flex flex-col items-center justify-center space-y-12">

                {/* Status Text */}
                <div className="text-center space-y-2 h-16">
                    {isProcessing ? (
                        <p className="text-xl font-medium text-purple-400 animate-pulse">Processing...</p>
                    ) : isRecording ? (
                        <p className="text-xl font-medium text-red-500 animate-pulse">Listening...</p>
                    ) : (
                        <p className="text-xl font-medium text-gray-500">Tap to Record</p>
                    )}
                    {error && <p className="text-xs text-red-400">{error}</p>}
                </div>

                {/* Big Record Button */}
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

                {/* Text Fallback Link (Future) */}
                {!isProcessing && !isRecording && (
                    <p className="text-xs text-gray-600">
                        Hold for text input (Coming Soon)
                    </p>
                )}
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
