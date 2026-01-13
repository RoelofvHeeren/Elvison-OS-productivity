
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const user = await prisma.user.findFirst();
    console.log('User:', user.id, 'Timezone:', user.timezone);

    const tasks = await prisma.task.findMany({
        where: {
            userId: user.id,
            status: { not: 'DONE' }
        },
        select: {
            id: true,
            title: true,
            dueDate: true,
            dueTime: true,
            doToday: true,
            status: true
        }
    });

    console.log('--- ALL PENDING TASKS ---');
    tasks.forEach(t => {
        console.log(`[${t.title}] DueDate: ${t.dueDate ? t.dueDate.toISOString() : 'NULL'} | DoToday: ${t.doToday}`);
    });

    // also check habits
    const habits = await prisma.habit.findMany({ where: { userId: user.id, archived: false } });
    console.log('--- ACTIVE HABITS ---');
    console.log('Count:', habits.length);
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
