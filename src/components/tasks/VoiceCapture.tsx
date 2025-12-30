'use client';

import { useState } from 'react';
import { useVoiceInput } from '@/hooks/useVoiceInput';
import { Mic, MicOff, Loader2, Send, Sparkles } from 'lucide-react';
import Button from '@/components/ui/Button';

interface VoiceCaptureProps {
    onCapture: (text: string) => void;
    onAIProcess?: (text: string) => Promise<void>;
    isProcessing?: boolean;
}

export default function VoiceCapture({ onCapture, onAIProcess, isProcessing }: VoiceCaptureProps) {
    const [inputText, setInputText] = useState('');

    const {
        isListening,
        isSupported,
        transcript,
        startListening,
        stopListening,
        resetTranscript,
    } = useVoiceInput({
        onResult: (text) => {
            setInputText(text);
        },
    });

    const handleSubmit = async () => {
        if (!inputText.trim()) return;

        if (onAIProcess) {
            await onAIProcess(inputText.trim());
        } else {
            onCapture(inputText.trim());
        }
        setInputText('');
        resetTranscript();
    };

    const handleVoiceToggle = () => {
        if (isListening) {
            stopListening();
        } else {
            setInputText('');
            startListening();
        }
    };

    return (
        <div className="space-y-3">
            {/* Voice Status Indicator */}
            {isListening && (
                <div className="flex items-center gap-2 text-[#139187] animate-pulse">
                    <div className="w-2 h-2 rounded-full bg-[#139187]" />
                    <span className="text-sm">Listening...</span>
                </div>
            )}

            {/* Input Area */}
            <div className="flex gap-2">
                {/* Voice Button */}
                {isSupported && (
                    <button
                        onClick={handleVoiceToggle}
                        disabled={isProcessing}
                        className={`p-3 rounded-xl transition-all ${isListening
                                ? 'bg-[#139187] text-white shadow-lg scale-110'
                                : 'bg-black/20 text-gray-400 hover:bg-white/5 hover:text-white'
                            } disabled:opacity-50`}
                    >
                        {isListening ? (
                            <Mic className="w-5 h-5" />
                        ) : (
                            <MicOff className="w-5 h-5" />
                        )}
                    </button>
                )}

                {/* Text Input */}
                <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                    placeholder="Type or speak to capture a task..."
                    className="flex-1 bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-gray-500 outline-none focus:border-[#139187] transition-colors"
                    disabled={isProcessing}
                />

                {/* Submit Button */}
                <Button
                    onClick={handleSubmit}
                    disabled={!inputText.trim() || isProcessing}
                    icon={isProcessing ? Loader2 : onAIProcess ? Sparkles : Send}
                    className={isProcessing ? 'animate-spin' : ''}
                >
                    {isProcessing ? '' : onAIProcess ? 'AI Capture' : 'Add'}
                </Button>
            </div>

            {!isSupported && (
                <p className="text-xs text-gray-500">
                    Voice input not supported in this browser
                </p>
            )}
        </div>
    );
}
