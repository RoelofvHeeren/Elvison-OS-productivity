import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        console.log('Testing connection to database...');
        const userCount = await prisma.user.count();
        console.log('Successfully connected! User count:', userCount);

        const mockUser = await prisma.user.upsert({
            where: { id: 'user-1' },
            update: {},
            create: {
                id: 'user-1',
                email: 'demo@example.com',
                name: 'Demo User'
            }
        });
        console.log('Mock user verified:', mockUser.id);

    } catch (e) {
        console.error('Connection failed:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
