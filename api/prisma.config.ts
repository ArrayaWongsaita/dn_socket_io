// Prisma 7 reads its settings (where the database is) from this file.
import 'dotenv/config';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: { path: 'prisma/migrations', seed: 'tsx prisma/seed.ts' },
  // The fallback is the database from docker-compose.yml, so `prisma generate`
  // (which runs during `pnpm install`) also works before api/.env exists.
  datasource: {
    url: process.env.DATABASE_URL ?? 'postgresql://socket:socket@localhost:5434/socket_io_basic',
  },
});
