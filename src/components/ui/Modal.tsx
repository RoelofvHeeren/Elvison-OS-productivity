'use client';

import { ReactNode, useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    description?: string;
    children: ReactNode;
    footer?: ReactNode;
}

export default function Modal({
    isOpen,
    onClose,
    title,
    description,
    children,
    footer,
}: ModalProps) {
    // Handle escape key
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/70 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div className="relative bg-gray-800 border border-gray-700 rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-1 hover:bg-white/5 rounded-lg text-gray-400 transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* Header */}
                <h3 className="text-xl font-bold text-white mb-2 pr-8">{title}</h3>
                {description && (
                    <p className="text-sm text-gray-400 mb-4">{description}</p>
                )}

                {/* Body */}
                <div className="space-y-4">{children}</div>

                {/* Footer */}
                {footer && <div className="flex gap-3 mt-6">{footer}</div>}
            </div>
        </div>
    );
}
