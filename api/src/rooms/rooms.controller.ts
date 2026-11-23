import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

// GET /rooms -> the list of chat rooms.
@Controller('rooms')
export class RoomsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  findAll() {
    return this.prisma.room.findMany({ orderBy: { id: 'asc' } });
  }
}
