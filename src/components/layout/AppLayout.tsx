'use client';

import { useIsMobile } from '@/hooks/useIsMobile';
import Sidebar from './Sidebar';
import MobileLayout from './MobileLayout';

interface AppLayoutProps {
    children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
    const isMobile = useIsMobile();

    // Mobile Layout
    if (isMobile) {
        return <MobileLayout>{children}</MobileLayout>;
    }

    // Desktop Layout (unchanged)
    return (
        <div className="relative z-10 flex min-h-screen">
            <Sidebar />
            <main className="flex-1 min-h-screen p-6 lg:p-8">
                <div className="w-[98%] mx-auto space-y-6">
                    {children}
                </div>
            </main>
        </div>
    );
}
