// Fills the database with the users and rooms used in the lessons.
// Run it with:  pnpm db:seed
import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client.js';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const userNames = ['Alice', 'Bob', 'Carol', 'Dave'];
const roomNames = ['General', 'Random', 'Tech'];

for (const name of userNames) {
  await prisma.user.upsert({ where: { name }, update: {}, create: { name } });
}
for (const name of roomNames) {
  await prisma.room.upsert({ where: { name }, update: {}, create: { name } });
}

console.log('Seeded users:', userNames.join(', '));
console.log('Seeded rooms:', roomNames.join(', '));
await prisma.$disconnect();
