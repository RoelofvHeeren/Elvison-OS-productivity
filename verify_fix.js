
const { PrismaClient } = require('@prisma/client');
const { toZonedTime } = require('date-fns-tz');

const prisma = new PrismaClient();

async function main() {
    console.log('--- Verifying Weekly Review Logic ---');

    // 1. Fetch Main User (Deterministic)
    const user = await prisma.user.findFirst({
        orderBy: { createdAt: 'asc' }
    });

    if (!user) {
        throw new Error('No user found');
    }
    console.log(`1. Main User Found: ${user.email} (${user.id})`);
    console.log(`   Timezone: ${user.timezone}`);

    // 2. Simulate Status Check Logic
    const userTz = user.timezone || 'UTC';
    const now = new Date();
    // Use fixed date for testing if needed, or just use current time
    // For verification, let's assume we are checking "Right Now"

    const zonedNow = toZonedTime(now, userTz);
    console.log(`2. Current Time (User TZ): ${zonedNow.toString()}`);

    // 3. Simulate Save Logic (Week Start calculation)
    const day = zonedNow.getDay(); // 0 = Sunday
    const diff = zonedNow.getDate() - day;

    const weekStartLocal = new Date(zonedNow);
    weekStartLocal.setDate(diff);
    weekStartLocal.setHours(0, 0, 0, 0);

    const cleanWeekStart = new Date(Date.UTC(
        weekStartLocal.getFullYear(),
        weekStartLocal.getMonth(),
        weekStartLocal.getDate(),
        12, 0, 0, 0
    ));

    console.log(`3. Calculated Week Start (UTC Noon): ${cleanWeekStart.toISOString()}`);

    // 4. Upsert Review
    console.log('4. Attempting Upsert Review...');
    const review = await prisma.weeklyReview.upsert({
        where: {
            userId_weekStart: {
                userId: user.id,
                weekStart: cleanWeekStart
            }
        },
        update: {
            wins: ['Verified Win'],
            challenges: ['Verified Challenge'],
            weekNotes: 'Verified via script',
            completedAt: new Date(),
        },
        create: {
            userId: user.id,
            weekStart: cleanWeekStart,
            wins: ['Verified Win'],
            challenges: ['Verified Challenge'],
            weekNotes: 'Verified via script',
            completedAt: new Date(),
        }
    });

    console.log(`   Review Saved/Updated! ID: ${review.id}`);

    // 5. Verify it appears in History (Deterministic Fetch)
    const history = await prisma.weeklyReview.findMany({
        where: { userId: user.id },
        orderBy: { weekStart: 'desc' },
        take: 1
    });

    if (history[0].id === review.id) {
        console.log('5. SUCCESS: Review found in history.');
    } else {
        console.error('5. FAILURE: Review NOT found in history (or not top).');
    }

    console.log('--- Verification Complete ---');
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
