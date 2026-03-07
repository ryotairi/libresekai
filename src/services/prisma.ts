import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';
import { config } from '../config';

export const prisma = new PrismaClient({
    log: ['info', 'query'],
    adapter: new PrismaPg({
        connectionString: config.databaseUrl ?? process.env.DATABASE_URL!
    }),
});