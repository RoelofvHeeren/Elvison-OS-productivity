
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { auth } from "@/auth";

export const GET = auth(async (req) => {
    if (!req.auth || !req.auth.user || !req.auth.user.email) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const user = await prisma.user.findUnique({
            where: { email: req.auth.user.email },
            select: {
                reviewDayOfWeek: true,
                reviewTimeHour: true,
                themePreferences: true,
            }
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        return NextResponse.json(user);
    } catch (error) {
        console.error('Error fetching settings:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
});

export const POST = auth(async (req) => {
    if (!req.auth || !req.auth.user || !req.auth.user.email) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const data = await req.json();

        // Validate and prepare update data
        const updateData: any = {};

        if (data.reviewDayOfWeek !== undefined) updateData.reviewDayOfWeek = data.reviewDayOfWeek;
        if (data.reviewTimeHour !== undefined) updateData.reviewTimeHour = data.reviewTimeHour;
        if (data.themePreferences !== undefined) updateData.themePreferences = data.themePreferences;

        const user = await prisma.user.update({
            where: { email: req.auth.user.email },
            data: updateData,
        });

        return NextResponse.json(user);
    } catch (error) {
        console.error('Error updating settings:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
});
