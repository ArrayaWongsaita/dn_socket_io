import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module.js';
import { UsersModule } from './users/users.module.js';
import { RoomsModule } from './rooms/rooms.module.js';
import { LessonsModule } from './lessons/lessons.module.js';
import { ChatModule } from './chat/chat.module.js';

// The root module: it just lists every feature module of the app.
@Module({
  imports: [PrismaModule, UsersModule, RoomsModule, LessonsModule, ChatModule],
})
export class AppModule {}
