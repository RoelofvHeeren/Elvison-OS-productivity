'use client';

import { usePathname } from 'next/navigation';
import { Menu, Bell } from 'lucide-react';

const pageTitles: Record<string, string> = {
    '/': 'Dashboard',
    '/tasks': 'Tasks',
    '/projects': 'Projects',
    '/goals': 'Goals',
    '/habits': 'Habits',
    '/manifestation': 'Manifestation',
    '/calendar': 'Calendar',
    '/knowledge': 'Knowledge',
    '/weekly-review': 'Weekly Review',
};

export default function MobileHeader() {
    const pathname = usePathname();
    const pageTitle = pageTitles[pathname] || 'Elvison';

    return (
        <header className="mobile-header">
            <div className="flex items-center gap-3">
                <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-black shadow-lg overflow-hidden">
                    <img
                        src="/Transparent Logo Elvison.png"
                        alt="Elvison"
                        className="h-8 w-8 object-contain"
                    />
                </div>
                <span className="font-serif text-xl font-bold text-white">
                    {pageTitle}
                </span>
            </div>

            <button
                className="flex items-center justify-center h-10 w-10 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-colors"
                aria-label="Notifications"
            >
                <Bell className="h-5 w-5" />
            </button>
        </header>
    );
}
