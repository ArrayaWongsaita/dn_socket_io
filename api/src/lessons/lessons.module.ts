import { Module } from '@nestjs/common';
import { Lesson1Gateway } from './01-connect.gateway.js';
import { Lesson2Gateway } from './02-disconnect.gateway.js';
import { Lesson3Gateway } from './03-send-to-server.gateway.js';
import { Lesson4Gateway } from './04-send-to-client.gateway.js';

// Every playground lesson (1-9) has one gateway. They are listed here so Nest creates them.
// None of them needs the database.
@Module({ providers: [Lesson1Gateway, Lesson2Gateway, Lesson3Gateway, Lesson4Gateway] })
export class LessonsModule {}
