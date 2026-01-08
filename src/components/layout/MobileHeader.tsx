'use client';

import { usePathname } from 'next/navigation';
import { Menu, Settings, X, ChevronRight } from 'lucide-react';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import SettingsModal from '../settings/SettingsModal';
import {
    LayoutDashboard,
    CheckSquare,
    FolderKanban,
    Target,
    Flame,
    Sparkles,
    BookOpen,
    CalendarCheck,
} from 'lucide-react';

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

const navItems = [
    { href: '/', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/tasks', label: 'Tasks', icon: CheckSquare },
    { href: '/projects', label: 'Projects', icon: FolderKanban },
    { href: '/goals', label: 'Goals', icon: Target },
    { href: '/habits', label: 'Habits', icon: Flame },
    { href: '/manifestation', label: 'Manifestation', icon: Sparkles },
    { href: '/calendar', label: 'Calendar', icon: CalendarCheck },
    { href: '/knowledge', label: 'Knowledge', icon: BookOpen },
    { href: '/weekly-review', label: 'Weekly Review', icon: CalendarCheck },
];

export default function MobileHeader() {
    const pathname = usePathname();
    const pageTitle = pageTitles[pathname] || 'Elvison';
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    // Close menu when route changes
    useEffect(() => {
        setIsMenuOpen(false);
        setIsSettingsOpen(false);
    }, [pathname]);

    // Prevent scrolling when menu is open
    useEffect(() => {
        if (isMenuOpen || isSettingsOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isMenuOpen, isSettingsOpen]);

    return (
        <>
            <header className="mobile-header">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setIsMenuOpen(true)}
                        className="flex items-center justify-center h-10 w-10 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-colors"
                        aria-label="Open menu"
                    >
                        <Menu className="h-5 w-5" />
                    </button>
                    <span className="font-serif text-xl font-bold text-white">
                        {pageTitle}
                    </span>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setIsSettingsOpen(true)}
                        className="flex items-center justify-center h-10 w-10 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-colors"
                        aria-label="Settings"
                    >
                        <Settings className="h-5 w-5" />
                    </button>
                </div>
            </header>

            {/* Settings Modal */}
            <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />

            {/* Full Screen Menu */}
            <div
                className={`fixed inset-0 bg-black z-50 transition-transform duration-300 ease-in-out ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'
                    }`}
            >
                <div className="flex flex-col h-full bg-black pt-[env(safe-area-inset-top)]">
                    {/* Menu Header */}
                    <div className="flex items-center justify-between p-4 border-b border-white/10">
                        <div className="flex items-center gap-3">
                            <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-black shadow-lg overflow-hidden border border-white/10">
                                <img
                                    src="/Transparent Logo Elvison.png"
                                    alt="Elvison"
                                    className="h-8 w-8 object-contain"
                                />
                            </div>
                            <span className="font-serif text-xl font-bold text-white">
                                Menu
                            </span>
                        </div>
                        <button
                            onClick={() => setIsMenuOpen(false)}
                            className="flex items-center justify-center h-10 w-10 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-colors"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    {/* Menu Items */}
                    <nav className="flex-1 overflow-y-auto p-4 space-y-2">
                        {navItems.map((item) => {
                            const isActive = pathname === item.href;
                            const Icon = item.icon;

                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`flex items-center gap-4 p-4 rounded-xl transition-all ${isActive
                                        ? 'bg-[#139187] text-white'
                                        : 'bg-white/5 text-gray-300 hover:bg-white/10'
                                        }`}
                                >
                                    <Icon className={`h-6 w-6 ${isActive ? 'text-white' : 'text-[#139187]'}`} />
                                    <span className="font-medium text-lg">{item.label}</span>
                                    {isActive && <ChevronRight className="ml-auto h-5 w-5 opacity-50" />}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Menu Footer */}
                    <div className="p-6 border-t border-white/10 text-center">
                        <p className="text-xs text-gray-500">Elvison OS v1.0</p>
                    </div>
                </div>
            </div>
        </>
    );
}
