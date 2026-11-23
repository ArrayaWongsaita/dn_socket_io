import { Module } from '@nestjs/common';
import { ConnectionGateway } from './connection.gateway.js';

@Module({ providers: [ConnectionGateway] })
export class ConnectionModule {}
