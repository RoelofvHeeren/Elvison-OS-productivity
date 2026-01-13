
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const user = await prisma.user.findFirst();
    console.log('User:', user.id, 'Timezone:', user.timezone);

    const events = await prisma.calendarEvent.findMany({
        where: { userId: user.id },
        orderBy: { start: 'asc' }
    });
    console.log('--- CALENDAR EVENTS ---');
    events.forEach(e => {
        console.log(`[${e.title}] Start: ${e.start.toISOString()} | End: ${e.end.toISOString()} | Source: ${e.source} | ExternalId: ${e.externalId}`);
    });
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
