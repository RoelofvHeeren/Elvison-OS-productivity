"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';

// Types for theme preferences
export interface ThemePreferences {
    accentColor: string;
    backgroundType: 'video' | 'image' | 'solid';
    backgroundValue: string; // URL or Hex
    contrastMode: 'normal' | 'high';
}

interface ThemeContextType {
    preferences: ThemePreferences;
    updatePreferences: (newPrefs: Partial<ThemePreferences>) => Promise<void>;
    resetTheme: () => void;
    isLoading: boolean;
}

const DEFAULT_THEME: ThemePreferences = {
    accentColor: '#139187',
    backgroundType: 'video',
    backgroundValue: '/Background video.mp4',
    contrastMode: 'normal',
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const { data: session } = useSession();
    const [preferences, setPreferences] = useState<ThemePreferences>(DEFAULT_THEME);
    const [isLoading, setIsLoading] = useState(true);

    // Load preferences from session or local state
    useEffect(() => {
        if (session?.user) {
            // In a real implementation, we would fetch from the DB here
            // For now, we'll check local storage first for immediate feedback
            const savedTheme = localStorage.getItem('elvison_theme_prefs');
            if (savedTheme) {
                try {
                    setPreferences({ ...DEFAULT_THEME, ...JSON.parse(savedTheme) });
                } catch (e) {
                    console.error("Failed to parse saved theme", e);
                }
            }
            setIsLoading(false);
        } else {
            setIsLoading(false);
        }
    }, [session]);

    // Apply CSS variables whenever preferences change
    useEffect(() => {
        const root = document.documentElement;

        // Apply Accent Color
        root.style.setProperty('--accent-primary', preferences.accentColor);

        // Calculate and apply accent variants (simple darkening for secondary)
        // Note: In a production app, use a color manipulation library like 'tinycolor2'
        root.style.setProperty('--accent-glow', `${preferences.accentColor}66`); // 40% opacity

        // Apply Background (Handled by Layout/VideoBackground component, but set var here)
        if (preferences.backgroundType === 'solid') {
            root.style.setProperty('--bg-primary', preferences.backgroundValue);
            document.body.style.backgroundColor = preferences.backgroundValue;
        } else {
            // Reset to black for video/image overlay
            root.style.setProperty('--bg-primary', '#000000');
            document.body.style.backgroundColor = '#000000';
        }

        // Contrast Logic: Determine if we need dark text
        // Simple heuristic: if solid background is light, switch text to dark
        // For video/image, we rely on the overlay opacity
        if (preferences.backgroundType === 'solid') {
            const isLight = isLightColor(preferences.backgroundValue);
            if (isLight) {
                root.style.setProperty('--text-main', '#000000');
                root.style.setProperty('--text-muted', '#4b5563');
                root.style.setProperty('--glass-base', 'rgba(0, 0, 0, 0.05)');
                root.style.setProperty('--glass-border', 'rgba(0, 0, 0, 0.1)');
            } else {
                // Revert to dark mode defaults
                root.style.setProperty('--text-main', '#ffffff');
                root.style.setProperty('--text-muted', '#666666');
                root.style.setProperty('--glass-base', 'rgba(255, 255, 255, 0.05)');
                root.style.setProperty('--glass-border', 'rgba(255, 255, 255, 0.1)');
            }
        } else {
            // For video/image, enforce dark mode text (white) because we have overlays
            root.style.setProperty('--text-main', '#ffffff');
            root.style.setProperty('--text-muted', '#666666');
            root.style.setProperty('--glass-base', 'rgba(255, 255, 255, 0.05)');
            root.style.setProperty('--glass-border', 'rgba(255, 255, 255, 0.1)');
        }

    }, [preferences]);

    const updatePreferences = async (newPrefs: Partial<ThemePreferences>) => {
        const updated = { ...preferences, ...newPrefs };
        setPreferences(updated);
        // Persist to LocalStorage for now (DB sync would happen here)
        localStorage.setItem('elvison_theme_prefs', JSON.stringify(updated));
    };

    const resetTheme = () => {
        setPreferences(DEFAULT_THEME);
        localStorage.removeItem('elvison_theme_prefs');
    };

    return (
        <ThemeContext.Provider value={{ preferences, updatePreferences, resetTheme, isLoading }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
}

// Helper for contrast check (simple hex parser)
function isLightColor(hex: string): boolean {
    const c = hex.substring(1);      // strip #
    const rgb = parseInt(c, 16);   // convert rrggbb to decimal
    const r = (rgb >> 16) & 0xff;  // extract red
    const g = (rgb >> 8) & 0xff;  // extract green
    const b = (rgb >> 0) & 0xff;  // extract blue

    const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b; // per ITU-R BT.709

    return luma > 128; // > 128 is generally considered light
}
