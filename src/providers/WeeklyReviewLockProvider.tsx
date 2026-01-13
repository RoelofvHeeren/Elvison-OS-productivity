'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import SystemLockOverlay from '@/components/weekly/SystemLockOverlay';

interface WeeklyReviewLockContextType {
    isLocked: boolean;
    checkStatus: () => Promise<void>;
}

const WeeklyReviewLockContext = createContext<WeeklyReviewLockContextType>({
    isLocked: false,
    checkStatus: async () => { },
});

export const useWeeklyReviewLock = () => useContext(WeeklyReviewLockContext);

export function WeeklyReviewLockProvider({ children }: { children: React.ReactNode }) {
    const [isLocked, setIsLocked] = useState(false);
    const [isBypassed, setIsBypassed] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const pathname = usePathname();

    const checkStatus = async () => {
        try {
            // Check session storage for bypass
            const bypass = sessionStorage.getItem('weeklyReviewBypass');
            if (bypass === 'true') {
                setIsBypassed(true);
                setIsLoading(false);
                return;
            }

            const res = await fetch('/api/weekly-review/status');
            if (res.ok) {
                const data = await res.json();
                setIsLocked(data.isLocked);
            }
        } catch (error) {
            console.error('Failed to check review status', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        checkStatus();
        // Check periodically (e.g., every minute)
        const interval = setInterval(checkStatus, 60000);
        return () => clearInterval(interval);
    }, []);

    // Check on route change as well
    useEffect(() => {
        checkStatus();
    }, [pathname]);

    const handleBypass = () => {
        sessionStorage.setItem('weeklyReviewBypass', 'true');
        setIsBypassed(true);
        setIsLocked(false); // Visually unlock
    };

    // If locked and NOT bypassed and NOT loading
    // And NOT already on the review page
    const shouldShowOverlay = isLocked && !isBypassed && !isLoading && pathname !== '/weekly-review';

    return (
        <WeeklyReviewLockContext.Provider value={{ isLocked, checkStatus }}>
            {children}
            {shouldShowOverlay && <SystemLockOverlay onBypass={handleBypass} />}
        </WeeklyReviewLockContext.Provider>
    );
}
