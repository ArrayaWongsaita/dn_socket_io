import { Controller, Get, NotFoundException, Param, ParseIntPipe } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Controller('rooms')
export class RoomsController {
  constructor(private readonly prisma: PrismaService) {}

  // GET /rooms -> the list of chat rooms.
  @Get()
  findAll() {
    return this.prisma.room.findMany({ orderBy: { id: 'asc' } });
  }

  // GET /rooms/1/messages -> old messages of a room (oldest first).
  // The chat page loads this when you enter a room; new messages then arrive live via the socket.
  @Get(':id/messages')
  async findMessages(@Param('id', ParseIntPipe) id: number) {
    const room = await this.prisma.room.findUnique({ where: { id } });
    if (!room) {
      throw new NotFoundException('room not found');
    }
    return this.prisma.message.findMany({
      where: { roomId: id },
      orderBy: { id: 'asc' },
      select: { id: true, text: true, createdAt: true, user: { select: { id: true, name: true } } },
    });
  }
}
