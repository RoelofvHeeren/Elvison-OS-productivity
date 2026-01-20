'use client';

import { useIsMobile } from '@/hooks/useIsMobile';
import { usePWA } from '@/hooks/usePWA';
import Sidebar from './Sidebar';
import MobileLayout from './MobileLayout';
import NotificationScheduler from '../notifications/NotificationScheduler';

interface AppLayoutProps {
    children: React.ReactNode;
}

import { usePathname } from 'next/navigation';

export default function AppLayout({ children }: AppLayoutProps) {
    const isMobile = useIsMobile();
    const pathname = usePathname();

    // Register Service Worker
    usePWA();

    const isAuthPage = pathname?.startsWith('/login') || pathname?.startsWith('/signup');

    if (isAuthPage) {
        return <main className="min-h-screen w-full relative">{children}</main>;
    }

    // Mobile Layout
    if (isMobile) {
        return (
            <>
                <NotificationScheduler />
                <MobileLayout>{children}</MobileLayout>
            </>
        );
    }

    // Desktop Layout (unchanged)
    return (
        <>
            <NotificationScheduler />
            <div className="relative z-10 flex h-screen overflow-hidden">
                <Sidebar />
                <main className="flex-1 h-full overflow-y-auto p-6 lg:p-8">
                    <div className="w-[98%] mx-auto space-y-6">
                        {children}
                    </div>
                </main>
            </div>
        </>
    );
}
