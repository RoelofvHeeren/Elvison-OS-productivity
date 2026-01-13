
import cron from 'node-cron';
import { prisma } from '@/lib/db';
import { sendNotification } from './notifications';

let isSchedulerRunning = false;

export function initScheduler() {
    // SERVER-SIDE SCHEDULER DISABLED (v2.0)
    // We have moved to Client-Side Polling (NotificationScheduler.tsx) via /api/notifications/poll
    // This allows for reliable delivery while the app is open/backgrounded in a tab,
    // bypassing serverless cron limitations and maximizing reliability for the user.

    console.log('[Scheduler] Server-side scheduler is disabled in favor of Client-Side Polling.');
}
