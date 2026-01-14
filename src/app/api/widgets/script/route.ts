import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import fs from 'fs';
import path from 'path';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    const type = searchParams.get('type') || 'dashboard'; // 'dashboard' | 'calendar'

    if (!token) {
        return NextResponse.json({ error: 'Missing token' }, { status: 400 });
    }

    // Verify token exists (optional but prevents misuse)
    const user = await prisma.user.findUnique({
        where: { widgetToken: token }
    });

    if (!user) {
        return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    try {
        let filename = 'elvison-widget.js';
        if (type === 'calendar') {
            filename = 'elvison-calendar-widget.js';
        }

        const filePath = path.join(process.cwd(), 'public', filename);
        let scriptContent = fs.readFileSync(filePath, 'utf8');

        // Personalize the script by replacing the placeholder
        // New standard: PASTE_YOUR_TOKEN_HERE
        if (scriptContent.includes('PASTE_YOUR_TOKEN_HERE')) {
            scriptContent = scriptContent.replace('PASTE_YOUR_TOKEN_HERE', token);
        } else {
            // Fallback: Try to replace WIDGET_TOKEN variable if placeholder is missing
            scriptContent = scriptContent.replace(
                /const WIDGET_TOKEN = ".*";/,
                `const WIDGET_TOKEN = "${token}";`
            );
        }

        return new NextResponse(scriptContent, {
            headers: {
                'Content-Type': 'application/javascript',
                'Content-Disposition': `attachment; filename="${filename.replace('.js', '')}-${user.name || 'user'}.js"`
            }
        });
    } catch (error) {
        console.error('Failed to generate personalized script:', error);
        return NextResponse.json({ error: 'Failed to generate script' }, { status: 500 });
    }
}
