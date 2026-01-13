'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    CheckSquare,
    Flame,
    CalendarCheck,
    MoreHorizontal,
} from 'lucide-react';
import { useState } from 'react';

const mainNavItems = [
    { href: '/', label: 'Home', icon: LayoutDashboard },
    { href: '/tasks', label: 'Tasks', icon: CheckSquare },
    { href: '/habits', label: 'Habits', icon: Flame },
    { href: '/calendar', label: 'Calendar', icon: CalendarCheck },
];

const moreNavItems = [
    { href: '/projects', label: 'Projects' },
    { href: '/goals', label: 'Goals' },
    { href: '/manifestation', label: 'Manifestation' },
    { href: '/knowledge', label: 'Knowledge' },
    { href: '/weekly-review', label: 'Weekly Review' },
    { href: '/profile', label: 'Profile' },
];

export default function BottomNav() {
    const pathname = usePathname();
    const [showMore, setShowMore] = useState(false);

    const isMoreActive = moreNavItems.some(item => pathname === item.href);

    return (
        <>
            {/* More Menu Overlay */}
            {showMore && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
                    onClick={() => setShowMore(false)}
                />
            )}

            {/* More Menu */}
            {showMore && (
                <div className="fixed bottom-20 left-4 right-4 bg-[var(--glass-base)] backdrop-blur-xl rounded-2xl border border-[var(--glass-border)] p-2 z-50 animate-slide-up">
                    {moreNavItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setShowMore(false)}
                            className={`block px-4 py-3 rounded-xl text-sm font-medium transition-colors ${pathname === item.href
                                ? 'bg-[#139187] text-white'
                                : 'text-white/80 hover:bg-white/10'
                                }`}
                        >
                            {item.label}
                        </Link>
                    ))}
                </div>
            )}

            {/* Bottom Navigation Bar */}
            <nav className="bottom-nav">
                {mainNavItems.map((item) => {
                    const isActive = pathname === item.href;
                    const Icon = item.icon;

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`bottom-nav-item ${isActive ? 'active' : ''}`}
                        >
                            <Icon className="h-6 w-6" />
                            <span className="text-xs mt-1">{item.label}</span>
                        </Link>
                    );
                })}

                {/* More Button */}
                <button
                    onClick={() => setShowMore(!showMore)}
                    className={`bottom-nav-item ${isMoreActive || showMore ? 'active' : ''}`}
                >
                    <MoreHorizontal className="h-6 w-6" />
                    <span className="text-xs mt-1">More</span>
                </button>
            </nav>
        </>
    );
}
