'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import {
    LayoutDashboard,
    CheckSquare,
    FolderKanban,
    Target,
    Flame,
    Sparkles,
    BookOpen,
    CalendarCheck,
    ChevronLeft,
    ChevronRight,
} from 'lucide-react';

const navItems = [
    { href: '/', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/tasks', label: 'Tasks', icon: CheckSquare },
    { href: '/projects', label: 'Projects', icon: FolderKanban },
    { href: '/goals', label: 'Goals', icon: Target },
    { href: '/habits', label: 'Habits', icon: Flame },
    { href: '/manifestation', label: 'Manifestation', icon: Sparkles },
    { href: '/knowledge', label: 'Knowledge', icon: BookOpen },
    { href: '/weekly-review', label: 'Weekly Review', icon: CalendarCheck },
];

export default function Sidebar() {
    const [collapsed, setCollapsed] = useState(false);
    const pathname = usePathname();

    return (
        <aside
            className={`sticky top-0 h-screen shrink-0 flex flex-col border-r-2 border-[#139187] bg-white px-4 py-6 shadow-luxury z-50 transition-all duration-500 ${collapsed ? 'w-20' : 'w-64'
                }`}
        >
            {/* Logo */}
            <div className="mb-8 flex items-center gap-3 px-2">
                <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-black shadow-luxury overflow-hidden">
                    <img
                        src="/Transparent Logo Elvison.png"
                        alt="Elvison"
                        className="h-10 w-10 object-contain"
                    />
                </div>
                {!collapsed && (
                    <span className="font-serif text-2xl font-bold tracking-tight text-black">
                        Elvison
                    </span>
                )}
            </div>

            {/* Navigation */}
            <nav className="flex flex-1 flex-col gap-1">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    const Icon = item.icon;

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`group relative flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-all duration-300 ${isActive
                                ? 'bg-black text-white shadow-3d translate-x-1'
                                : 'text-gray-600 hover:bg-gray-100 hover:text-black hover:translate-x-1'
                                }`}
                        >
                            <Icon
                                className={`h-5 w-5 shrink-0 transition-transform group-hover:scale-110 ${isActive ? 'text-[#139187]' : 'text-[#139187]'
                                    }`}
                            />
                            {!collapsed && <span>{item.label}</span>}
                        </Link>
                    );
                })}
            </nav>

            {/* Collapse Button */}
            <button
                onClick={() => setCollapsed(!collapsed)}
                className="mt-4 flex items-center justify-center p-2 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
                {collapsed ? (
                    <ChevronRight className="h-5 w-5" />
                ) : (
                    <ChevronLeft className="h-5 w-5" />
                )}
            </button>
        </aside>
    );
}
