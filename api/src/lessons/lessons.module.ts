import { Module } from '@nestjs/common';
import { Lesson1Gateway } from './01-connect.gateway.js';

// Every playground lesson (1-9) has one gateway. They are listed here so Nest creates them.
// None of them needs the database.
@Module({ providers: [Lesson1Gateway] })
export class LessonsModule {}
