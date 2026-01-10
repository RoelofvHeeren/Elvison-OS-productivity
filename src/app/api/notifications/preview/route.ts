import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { generateNotificationPayload } from '@/lib/notification-templates';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const type = searchParams.get('type') as 'daily_plan' | 'task_due' | 'weekly_review' | 'reminder';

        if (!type) {
            return NextResponse.json({ error: 'Type required' }, { status: 400 });
        }

        const payload = await generateNotificationPayload(type, session.user.id);

        if (!payload) {
            return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
        }

        return NextResponse.json(payload);
    } catch (error) {
        console.error('[NotificationPreview] Error:', error);
        return NextResponse.json({ error: 'Failed to generate notification' }, { status: 500 });
    }
}
