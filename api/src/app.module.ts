import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module.js';
import { UsersModule } from './users/users.module.js';
import { RoomsModule } from './rooms/rooms.module.js';
import { ConnectionModule } from './connection/connection.module.js';
import { BroadcastModule } from './broadcast/broadcast.module.js';

// The root module: it just lists every feature module of the app.
@Module({
  imports: [PrismaModule, UsersModule, RoomsModule, ConnectionModule, BroadcastModule],
})
export class AppModule {}
