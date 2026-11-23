import 'dotenv/config'; // loads api/.env so DATABASE_URL is available
import { Injectable } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client.js';

// PrismaService is our connection to Postgres.
// Any class can ask for it in its constructor and then run queries,
// for example:  this.prisma.user.findMany()
@Injectable()
export class PrismaService extends PrismaClient {
  constructor() {
    // Prisma 7 talks to Postgres through a "driver adapter".
    super({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
  }
}
