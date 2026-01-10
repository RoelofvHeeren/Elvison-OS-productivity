import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import fs from 'fs';
import path from 'path';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

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
        const filePath = path.join(process.cwd(), 'public', 'elvison-widget.js');
        let scriptContent = fs.readFileSync(filePath, 'utf8');

        // Personalize the script by replacing the placeholder
        // Find the line with USER_ID and replace it
        scriptContent = scriptContent.replace(
            /const USER_ID = ".*";/,
            `const USER_ID = "${token}";`
        );

        // Also update fetchData to use 'token' param instead of 'userId'
        scriptContent = scriptContent.replace(
            /&userId=\${USER_ID}/,
            `&token=\${USER_ID}`
        );

        return new NextResponse(scriptContent, {
            headers: {
                'Content-Type': 'application/javascript',
                'Content-Disposition': `attachment; filename="elvison-widget-${user.name || 'user'}.js"`
            }
        });
    } catch (error) {
        console.error('Failed to generate personalized script:', error);
        return NextResponse.json({ error: 'Failed to generate script' }, { status: 500 });
    }
}
