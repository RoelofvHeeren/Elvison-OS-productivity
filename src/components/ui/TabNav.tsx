'use client';

import { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';

interface Tab {
    id: string;
    label: string;
    icon?: LucideIcon;
    count?: number;
}

interface TabNavProps {
    tabs: Tab[];
    activeTab: string;
    onTabChange: (tabId: string) => void;
    children?: ReactNode;
}

export default function TabNav({
    tabs,
    activeTab,
    onTabChange,
    children,
}: TabNavProps) {
    return (
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden">
            <nav className="flex border-b border-white/10">
                {tabs.map((tab) => {
                    const isActive = activeTab === tab.id;
                    const Icon = tab.icon;

                    return (
                        <button
                            key={tab.id}
                            onClick={() => onTabChange(tab.id)}
                            className={`flex-1 py-4 px-6 font-medium text-sm transition-colors ${isActive
                                    ? 'bg-[#139187]/20 text-[#139187] border-b-2 border-[#139187]'
                                    : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700/30'
                                }`}
                        >
                            <span className="flex items-center justify-center gap-2">
                                {Icon && <Icon className="w-4 h-4" />}
                                {tab.label}
                                {tab.count !== undefined && (
                                    <span
                                        className={`px-2 py-0.5 rounded-full text-xs ${isActive
                                                ? 'bg-[#139187]/30 text-[#139187]'
                                                : 'bg-white/10 text-gray-400'
                                            }`}
                                    >
                                        {tab.count}
                                    </span>
                                )}
                            </span>
                        </button>
                    );
                })}
            </nav>
            {children && <div className="p-6">{children}</div>}
        </div>
    );
}
