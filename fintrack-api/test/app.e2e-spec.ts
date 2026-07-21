import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Hello World!');
  });

  it.each([
    ['/users', ['id', 'name', 'email', 'password', 'role', 'created_at']],
    ['/accounts', ['id', 'user_id', 'name', 'type', 'balance', 'created_at']],
    ['/categories', ['id', 'name', 'type']],
    [
      '/transactions',
      [
        'id',
        'account_id',
        'category_id',
        'type',
        'amount',
        'description',
        'transaction_date',
        'created_at',
      ],
    ],
  ])('GET %s returns schema-shaped mock data', async (path, fields) => {
    const response = await request(app.getHttpServer()).get(path).expect(200);
    const body = response.body as unknown;

    expect(Array.isArray(body)).toBe(true);
    if (!Array.isArray(body)) {
      throw new TypeError('Expected the endpoint response to be an array');
    }

    expect(body.length).toBeGreaterThan(0);
    expect(body[0]).toEqual(
      expect.objectContaining(
        Object.fromEntries(fields.map((field) => [field, expect.anything()])),
      ),
    );
  });

  afterEach(async () => {
    await app.close();
  });
});
