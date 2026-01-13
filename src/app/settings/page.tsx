'use client';

import SettingsContent from '@/components/settings/SettingsContent';

export default function SettingsPage() {
    return (
        <div className="max-w-2xl mx-auto p-6 space-y-8">
            <header>
                <h1 className="text-3xl font-serif text-[var(--text-main)] mb-2">Settings</h1>
                <p className="text-[var(--text-muted)]">Manage your preferences and configurations.</p>
            </header>

            <SettingsContent />
        </div>
    );
}
