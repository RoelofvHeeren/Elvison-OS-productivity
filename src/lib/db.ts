import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined;
};

const getDatabaseUrl = () => {
    const url = process.env.DATABASE_URL;
    if (url && url.startsWith('prisma+postgres://')) {
        try {
            const params = new URL(url).searchParams;
            const apiKey = params.get('api_key');
            if (apiKey) {
                const decoded = Buffer.from(apiKey, 'base64').toString('utf-8');
                const config = JSON.parse(decoded);
                if (config.databaseUrl) {
                    return config.databaseUrl;
                }
            }
        } catch (e) {
            console.warn('Failed to parse Prisma Postgres URL, falling back to original');
        }
    }
    return url;
};

const resolvedUrl = getDatabaseUrl();

console.log('DEBUG: Original DATABASE_URL:', process.env.DATABASE_URL);
console.log('DEBUG: Resolved URL from getDatabaseUrl:', resolvedUrl);

if (resolvedUrl) {
    process.env.DATABASE_URL = resolvedUrl;
    console.log('DEBUG: Updated process.env.DATABASE_URL to resolved value');
} else if (process.env.DATABASE_URL?.startsWith('prisma+postgres://')) {
    console.log('DEBUG: URL starts with prisma+postgres, attempting manual fix if extraction failed.');
}

export const prisma =
    globalForPrisma.prisma ??
    new PrismaClient({
        log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;
