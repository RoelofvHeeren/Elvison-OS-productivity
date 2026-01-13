"use client";

import React, { useState } from 'react';
import GlassCard, { InnerCard } from "@/components/ui/GlassCard";
import Button from "@/components/ui/Button";
import { useTheme } from "@/providers/ThemeProvider";
import { Check, Palette, Image as ImageIcon, Video, Monitor } from 'lucide-react';

const PRESET_COLORS = [
    '#139187', // Default Teal
    '#3b82f6', // Blue
    '#8b5cf6', // Violet
    '#ec4899', // Pink
    '#f59e0b', // Amber
    '#10b981', // Emerald
    '#ef4444', // Red
    '#6366f1', // Indigo
];

const BACKGROUND_OPTIONS = [
    { type: 'video', value: '/Background video.mp4', label: 'Dark Flow', icon: Video, schema: 'dark' },
    { type: 'video', value: '/light-mode-desktop.mp4', label: 'Light Flow', icon: Video, schema: 'light' },
    { type: 'image', value: '/Static Mobile background.png', label: 'Dark Gradient', icon: ImageIcon, schema: 'dark' },
    { type: 'solid', value: '#000000', label: 'OLED Black', icon: Monitor, schema: 'dark' },
    { type: 'solid', value: '#f5f5f5', label: 'Clean White', icon: Monitor, schema: 'light' },
];

export default function AppearanceSettingsPage() {
    const { preferences, updatePreferences, resetTheme } = useTheme();
    const [customColor, setCustomColor] = useState(preferences.accentColor);

    const handleColorChange = (color: string) => {
        setCustomColor(color);
        updatePreferences({ accentColor: color });
    };

    const handleBackgroundChange = (type: 'video' | 'image' | 'solid', value: string, schema: 'dark' | 'light' = 'dark') => {
        updatePreferences({
            backgroundType: type,
            backgroundValue: value,
            colorSchema: schema as 'dark' | 'light'
        } as any); // Force cast to avoid build type overlap issues
    };

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-8">
            <header>
                <h1 className="text-3xl font-serif text-[var(--text-main)] mb-2">Appearance</h1>
                <p className="text-[var(--text-muted)]">Customize the look and feel of your workspace.</p>
            </header>

            {/* Accent Color Section */}
            <GlassCard className="space-y-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-[var(--accent-primary)]/10 rounded-lg">
                        <Palette className="w-5 h-5 text-[var(--accent-primary)]" />
                    </div>
                    <div>
                        <h2 className="text-lg font-medium text-[var(--text-main)]">Accent Color</h2>
                        <p className="text-sm text-[var(--text-muted)]">Choose a primary color for buttons and highlights.</p>
                    </div>
                </div>

                <div className="grid grid-cols-4 sm:grid-cols-8 gap-4">
                    {PRESET_COLORS.map((color) => (
                        <button
                            key={color}
                            onClick={() => handleColorChange(color)}
                            className={`
                                group relative w-10 h-10 rounded-full transition-transform hover:scale-110
                                ${preferences.accentColor === color ? 'ring-2 ring-[var(--text-main)] ring-offset-2 ring-offset-black' : ''}
                            `}
                            style={{ backgroundColor: color }}
                            aria-label={`Select color ${color}`}
                        >
                            {preferences.accentColor === color && (
                                <Check className="w-5 h-5 text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                            )}
                        </button>
                    ))}
                </div>

                <div className="pt-4 border-t border-[var(--glass-border)]">
                    <label className="block text-sm font-medium text-[var(--text-main)] mb-2">Custom Hex Code</label>
                    <div className="flex gap-4">
                        <div className="relative flex-1">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <span className="text-[var(--text-muted)]">#</span>
                            </div>
                            <input
                                type="text"
                                value={customColor.replace('#', '')}
                                onChange={(e) => handleColorChange(`#${e.target.value}`)}
                                className="block w-full pl-8 pr-3 py-2 bg-black/20 border border-[var(--glass-border)] rounded-md text-[var(--text-main)] focus:ring-[var(--accent-primary)] focus:border-[var(--accent-primary)] sm:text-sm"
                                placeholder="139187"
                            />
                        </div>
                        <div
                            className="w-10 h-10 rounded-md border border-[var(--glass-border)]"
                            style={{ backgroundColor: customColor }}
                        />
                    </div>
                </div>
            </GlassCard>

            {/* Background Section */}
            <GlassCard className="space-y-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-[var(--accent-primary)]/10 rounded-lg">
                        <Monitor className="w-5 h-5 text-[var(--accent-primary)]" />
                    </div>
                    <div>
                        <h2 className="text-lg font-medium text-[var(--text-main)]">Background</h2>
                        <p className="text-sm text-[var(--text-muted)]">Select a background wallpaper or video.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {BACKGROUND_OPTIONS.map((option) => (
                        <button
                            key={option.label}
                            onClick={() => handleBackgroundChange(option.type as any, option.value, option.schema as any)}
                            className={`
                                relative p-4 rounded-xl border border-[var(--glass-border)] text-left transition-all
                                hover:bg-[var(--glass-base)]
                                ${preferences.backgroundValue === option.value ? 'ring-2 ring-[var(--accent-primary)] bg-[var(--glass-base)]' : 'bg-transparent'}
                            `}
                        >
                            <div className="flex items-center gap-3 mb-3">
                                <option.icon className="w-5 h-5 text-[var(--text-muted)]" />
                                <span className="text-sm font-medium text-[var(--text-main)]">{option.label}</span>
                                {option.schema === 'light' && (
                                    <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-400/10 text-yellow-600 border border-yellow-400/20">Light</span>
                                )}
                            </div>
                            <div
                                className="w-full h-24 rounded-lg border border-[var(--glass-border)] overflow-hidden relative"
                                style={{ backgroundColor: option.type === 'solid' ? option.value : '#000' }}
                            >
                                {option.type === 'video' && (
                                    <div className={`absolute inset-0 flex items-center justify-center ${option.schema === 'light' ? 'bg-gray-100 text-gray-500' : 'bg-gray-900 text-gray-500'} text-xs`}>
                                        Video Preview
                                    </div>
                                )}
                                {option.type === 'image' && (
                                    <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-gray-800" />
                                )}
                            </div>
                        </button>
                    ))}
                </div>
            </GlassCard>

            {/* Manual Schema Override (Advanced) */}
            <GlassCard className="space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-medium text-[var(--text-main)]">Interface Theme</h2>
                        <p className="text-sm text-[var(--text-muted)]">Manually override the light/dark text mode.</p>
                    </div>
                    <div className="flex gap-2 bg-black/20 p-1 rounded-lg">
                        {(['dark', 'light'] as const).map((mode) => (
                            <button
                                key={mode}
                                onClick={() => updatePreferences({ colorSchema: mode })}
                                className={`
                                    px-4 py-2 rounded-md text-sm font-medium transition-colors
                                    ${preferences.colorSchema === mode
                                        ? 'bg-[var(--accent-primary)] text-white shadow-sm'
                                        : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'}
                                `}
                            >
                                {mode.charAt(0).toUpperCase() + mode.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>
            </GlassCard>

            <div className="flex justify-end gap-4">
                <Button variant="ghost" onClick={resetTheme}>Reset to Defaults</Button>
                <Button
                    variant="primary"
                    onClick={async () => {
                        try {
                            const res = await fetch('/api/user/settings', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ themePreferences: preferences })
                            });
                            if (res.ok) {
                                alert('Theme preferences saved!');
                            } else {
                                throw new Error('Failed to save');
                            }
                        } catch (e) {
                            console.error(e);
                            alert('Failed to save preferences');
                        }
                    }}
                >
                    Save Preferences
                </Button>
            </div>
        </div>
    );
}
