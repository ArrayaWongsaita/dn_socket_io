import { Module } from '@nestjs/common';
import { BroadcastGateway } from './broadcast.gateway.js';

@Module({ providers: [BroadcastGateway] })
export class BroadcastModule {}
