import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { io, Socket } from 'socket.io-client';
import { AppModule } from '../src/app.module.js';

// Starts the whole Nest app on a random free port, so tests can connect real sockets to it.
export async function startApp() {
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
  const app: INestApplication = moduleRef.createNestApplication();
  await app.listen(0);
  const url = (await app.getUrl()).replace('[::1]', 'localhost');
  return { app, url, close: () => app.close() };
}

// Connects a socket.io client to one namespace, "logged in" as the given user id.
// Resolves when connected, rejects with the server's message if the handshake is refused.
export function connectAs(url: string, namespace: string, userId?: unknown): Promise<Socket> {
  return new Promise((resolve, reject) => {
    const socket = io(url + namespace, {
      auth: userId === undefined ? {} : { userId },
      forceNew: true,
      transports: ['websocket'],
    });
    socket.on('connect', () => resolve(socket));
    socket.on('connect_error', (err) => {
      socket.close();
      reject(err);
    });
  });
}

// Waits for one event; used to assert "this socket received it".
export function waitFor<T = any>(socket: Socket, event: string, timeoutMs = 1000): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`timeout waiting for "${event}"`)), timeoutMs);
    socket.once(event, (data: T) => {
      clearTimeout(timer);
      resolve(data);
    });
  });
}

// Collects every `event` a socket receives, so tests can assert who got what (or nothing).
export function collect<T = any>(socket: Socket, event: string): T[] {
  const received: T[] = [];
  socket.on(event, (data: T) => received.push(data));
  return received;
}

export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
