import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        return NextResponse.json({
            success: true,
            message: 'Test endpoint working'
        });
    } catch (error) {
        console.error('Test Trigger Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function GET(request: NextRequest) {
    return NextResponse.json({ message: 'Test trigger endpoint is alive' });
}
