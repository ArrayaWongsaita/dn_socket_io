import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

// GET /users -> the list of seeded users (the web app shows them on the "pick a user" page).
@Controller('users')
export class UsersController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  findAll() {
    return this.prisma.user.findMany({ orderBy: { id: 'asc' } });
  }
}
