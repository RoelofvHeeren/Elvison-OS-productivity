'use client';

import MobileHeader from './MobileHeader';


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
        </div>
    );
}
