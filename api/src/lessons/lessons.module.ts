import { Module } from '@nestjs/common';

// Every playground lesson (1-9) has one gateway. They are listed here so Nest creates them.
// None of them needs the database.
@Module({ providers: [] })
export class LessonsModule {}
