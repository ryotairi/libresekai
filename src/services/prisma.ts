import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';

export const prisma = new PrismaClient({
    log: ['info', 'query'],
    adapter: new PrismaPg({
        connectionString: process.env.DATABASE_URL!
    }),
});