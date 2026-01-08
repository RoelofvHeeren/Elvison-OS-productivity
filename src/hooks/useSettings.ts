'use client';

import { useState, useEffect } from 'react';

interface NotificationPreferences {
    enabled: boolean;
    types: {
        goals: boolean;
        habits: boolean;
        tasks: boolean;
        projects: boolean;
    };
}

interface SettingsState {
    notifications: NotificationPreferences;
}

const DEFAULT_SETTINGS: SettingsState = {
    notifications: {
        enabled: true,
        types: {
            goals: true,
            habits: true,
            tasks: true,
            projects: true,
        },
    },
};

export function useSettings() {
    const [settings, setSettings] = useState<SettingsState>(DEFAULT_SETTINGS);
    const [isLoaded, setIsLoaded] = useState(false);

    // Load from localStorage on mount
    useEffect(() => {
        try {
            const saved = localStorage.getItem('elvison_settings');
            if (saved) {
                setSettings(JSON.parse(saved));
            }
        } catch (error) {
            console.error('Failed to load settings:', error);
        } finally {
            setIsLoaded(true);
        }
    }, []);

    // Save to localStorage whenever settings change
    const updateSettings = (newSettings: Partial<SettingsState>) => {
        setSettings((prev) => {
            const next = { ...prev, ...newSettings };
            try {
                localStorage.setItem('elvison_settings', JSON.stringify(next));
            } catch (error) {
                console.error('Failed to save settings:', error);
            }
            return next;
        });
    };

    const updateNotificationPreferences = (prefs: Partial<NotificationPreferences>) => {
        setSettings((prev) => {
            const next = {
                ...prev,
                notifications: {
                    ...prev.notifications,
                    ...prefs,
                },
            };
            try {
                localStorage.setItem('elvison_settings', JSON.stringify(next));
            } catch (error) {
                console.error('Failed to save settings:', error);
            }
            return next;
        });
    };

    return {
        settings,
        isLoaded,
        updateSettings,
        updateNotificationPreferences,
    };
}
