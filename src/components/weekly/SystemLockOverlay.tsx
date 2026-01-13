'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Lock, AlertCircle, ArrowRight } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import Button from '@/components/ui/Button';
import { Input } from '@/components/ui/FormElements';

interface SystemLockOverlayProps {
    onBypass: () => void;
}

export default function SystemLockOverlay({ onBypass }: SystemLockOverlayProps) {
    const router = useRouter();
    const pathname = usePathname();
    const [showBypass, setShowBypass] = useState(false);
    const [bypassPhrase, setBypassPhrase] = useState('');
    const [error, setError] = useState('');

    const REQUIRED_PHRASE = "I acknowledge I am skipping my review and will do it later";

    const handleGoToReview = () => {
        router.push('/weekly-review');
    };

    const handleBypassSubmit = () => {
        if (bypassPhrase === REQUIRED_PHRASE) {
            onBypass();
        } else {
            setError('Phrase does not match exactly.');
        }
    };

    // If we are already on the review page, we might want to just show a "Locked Mode" banner 
    // instead of a full screen blocking overlay, OR this overlay is only for NON-review pages.
    // The provider should handle when to show this. 
    // But if this is shown, it implies we are blocked. 

    return (
        <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <GlassCard className="max-w-lg w-full border-red-500/30 bg-black/40">
                <div className="text-center space-y-6">
                    <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto">
                        <Lock className="w-8 h-8 text-red-500" />
                    </div>

                    <div>
                        <h2 className="text-2xl font-bold text-white mb-2">System Locked</h2>
                        <p className="text-gray-300">
                            It is time for your Weekly Review. The system is locked until you complete it.
                        </p>
                    </div>

                    <div className="flex flex-col gap-3">
                        <Button
                            onClick={handleGoToReview}
                            className="w-full py-4 text-lg"
                            variant="primary"
                            icon={ArrowRight}
                        >
                            Go to Weekly Review
                        </Button>

                        {!showBypass ? (
                            <button
                                onClick={() => setShowBypass(true)}
                                className="text-xs text-gray-500 hover:text-gray-400 mt-4 underline"
                            >
                                Emergency Bypass
                            </button>
                        ) : (
                            <div className="mt-4 pt-4 border-t border-white/10 animate-in fade-in slide-in-from-top-2">
                                <p className="text-xs text-red-400 mb-2 font-semibold">
                                    <AlertCircle className="w-3 h-3 inline mr-1" />
                                    Bypassing requires confirmation
                                </p>
                                <p className="text-xs text-gray-400 mb-2">
                                    Type exactly: <span className="text-white font-mono select-all">&quot;{REQUIRED_PHRASE}&quot;</span>
                                </p>
                                <Input
                                    value={bypassPhrase}
                                    onChange={(e) => {
                                        setBypassPhrase(e.target.value);
                                        setError('');
                                    }}
                                    placeholder="Type the phrase here..."
                                    className="mb-2"
                                />
                                {error && <p className="text-xs text-red-500 mb-2">{error}</p>}
                                <div className="flex gap-2">
                                    <Button
                                        onClick={() => setShowBypass(false)}
                                        variant="ghost"
                                        size="sm"
                                        className="flex-1"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        onClick={handleBypassSubmit}
                                        variant="danger"
                                        size="sm"
                                        className="flex-1"
                                        disabled={bypassPhrase !== REQUIRED_PHRASE}
                                    >
                                        Unlock Temporarily
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </GlassCard>
        </div>
    );
}
