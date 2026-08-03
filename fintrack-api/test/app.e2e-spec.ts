import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
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
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Hello World!');
  });

  it.each([
    ['/users', ['id', 'name', 'email', 'role', 'created_at', 'accounts']],
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
  ])('GET %s returns schema-shaped database data', async (path, fields) => {
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

    if (path === '/users') {
      expect(body[0]).not.toHaveProperty('password');
    }
  });

  it('POST /accounts rejects an unknown user', () => {
    return request(app.getHttpServer())
      .post('/accounts')
      .send({
        user_id: 999999,
        name: 'Missing Owner Account',
        type: 'bank',
        balance: 0,
      })
      .expect(404)
      .expect(({ body }: { body: { message: string } }) => {
        expect(body.message).toBe('User #999999 not found');
      });
  });

  it('POST /transactions rejects an unknown account', () => {
    return request(app.getHttpServer())
      .post('/transactions')
      .send({
        account_id: 999999,
        category_id: 1,
        type: 'expense',
        amount: 10000,
        transaction_date: '2026-08-04',
      })
      .expect(404)
      .expect(({ body }: { body: { message: string } }) => {
        expect(body.message).toBe('Account #999999 not found');
      });
  });

  afterEach(async () => {
    await app.close();
  });
});
