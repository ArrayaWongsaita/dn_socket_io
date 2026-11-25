import { Module } from '@nestjs/common';
import { Lesson1Gateway } from './01-connect.gateway.js';
import { Lesson2Gateway } from './02-disconnect.gateway.js';
import { Lesson3Gateway } from './03-send-to-server.gateway.js';
import { Lesson4Gateway } from './04-send-to-client.gateway.js';
import { Lesson5Gateway } from './05-acknowledgement.gateway.js';
import { Lesson6Gateway } from './06-everyone.gateway.js';
import { Lesson7Gateway } from './07-everyone-else.gateway.js';

// Every playground lesson (1-9) has one gateway. They are listed here so Nest creates them.
// None of them needs the database.
@Module({ providers: [Lesson1Gateway, Lesson2Gateway, Lesson3Gateway, Lesson4Gateway, Lesson5Gateway, Lesson6Gateway, Lesson7Gateway] })
export class LessonsModule {}
