'use client';

import MobileHeader from './MobileHeader';
import BottomNav from './BottomNav';

interface MobileLayoutProps {
    children: React.ReactNode;
}

export default function MobileLayout({ children }: MobileLayoutProps) {
    return (
        <div className="mobile-layout">
            <MobileHeader />
            <main className="mobile-main">
                {children}
            </main>
            <BottomNav />
        </div>
    );
}
