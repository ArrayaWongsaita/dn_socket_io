import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';

// Checks the two plain REST endpoints the web app uses to list users and rooms.
describe('REST: users and rooms', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /users returns the 4 seeded users', async () => {
    const res = await request(app.getHttpServer()).get('/users').expect(200);
    expect(res.body.map((u: { name: string }) => u.name)).toEqual(['Alice', 'Bob', 'Carol', 'Dave']);
    expect(typeof res.body[0].id).toBe('number');
  });

  it('GET /rooms returns the 3 seeded rooms', async () => {
    const res = await request(app.getHttpServer()).get('/rooms').expect(200);
    expect(res.body.map((r: { name: string }) => r.name)).toEqual(['General', 'Random', 'Tech']);
  });
});
