import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/prisma/prisma.service';

interface AuthResponse {
  access_token: string;
  user: { id: number; email: string; role: string };
}

describe('FinTrack authentication and authorization (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let firstToken: string;
  let secondToken: string;
  let adminToken: string;
  let firstUserId: number;
  let secondUserId: number;
  let adminUserId: number;
  let firstAccountId: number;

  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const firstEmail = `first-${suffix}@example.com`;
  const secondEmail = `second-${suffix}@example.com`;
  const adminEmail = `admin-${suffix}@example.com`;
  const password = 'Secure123';

  beforeAll(async () => {
    process.env.JWT_SECRET = 'e2e-only-jwt-secret';

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
    prisma = app.get(PrismaService);
  });

  it('keeps the health endpoint public', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Hello World!');
  });

  it('rejects protected requests without a token', () => {
    return request(app.getHttpServer()).get('/accounts').expect(401);
  });

  it('registers users with hidden, hashed passwords', async () => {
    const firstResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ name: 'First Tester', email: firstEmail, password })
      .expect(201);
    const secondResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ name: 'Second Tester', email: secondEmail, password })
      .expect(201);

    firstUserId = (firstResponse.body as { id: number }).id;
    secondUserId = (secondResponse.body as { id: number }).id;
    expect(firstResponse.body).not.toHaveProperty('password');

    const storedUser = await prisma.user.findUniqueOrThrow({
      where: { id: firstUserId },
    });
    expect(storedUser.password).not.toBe(password);
    await expect(bcrypt.compare(password, storedUser.password)).resolves.toBe(
      true,
    );
  });

  it('logs users in and returns signed access tokens', async () => {
    const firstLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: firstEmail, password })
      .expect(200);
    const secondLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: secondEmail, password })
      .expect(200);

    firstToken = (firstLogin.body as AuthResponse).access_token;
    secondToken = (secondLogin.body as AuthResponse).access_token;
    expect(firstToken).toEqual(expect.any(String));
  });

  it('rejects invalid bearer tokens', () => {
    return request(app.getHttpServer())
      .get('/accounts')
      .set('Authorization', 'Bearer invalid-token')
      .expect(401);
  });

  it('derives account ownership from JWT and isolates other users', async () => {
    const created = await request(app.getHttpServer())
      .post('/accounts')
      .set('Authorization', `Bearer ${firstToken}`)
      .send({ name: 'Private Account', type: 'bank', balance: 50000 })
      .expect(201);

    firstAccountId = (created.body as { id: number }).id;
    expect(created.body).toEqual(
      expect.objectContaining({ user_id: firstUserId, balance: 50000 }),
    );

    await request(app.getHttpServer())
      .get(`/accounts/${firstAccountId}`)
      .set('Authorization', `Bearer ${secondToken}`)
      .expect(404);

    const secondAccounts = await request(app.getHttpServer())
      .get('/accounts')
      .set('Authorization', `Bearer ${secondToken}`)
      .expect(200);
    expect(secondAccounts.body).toEqual([]);
  });

  it('rejects a client-supplied account owner', () => {
    return request(app.getHttpServer())
      .post('/accounts')
      .set('Authorization', `Bearer ${firstToken}`)
      .send({
        user_id: secondUserId,
        name: 'Forged Owner',
        type: 'bank',
      })
      .expect(400);
  });

  it('enforces ownership when validating transaction accounts', () => {
    return request(app.getHttpServer())
      .post('/transactions')
      .set('Authorization', `Bearer ${secondToken}`)
      .send({
        account_id: firstAccountId,
        category_id: 1,
        type: 'expense',
        amount: 10000,
        transaction_date: '2026-08-04',
      })
      .expect(404);
  });

  it('allows only admins to write categories and inspect global data', async () => {
    await request(app.getHttpServer())
      .post('/categories')
      .set('Authorization', `Bearer ${firstToken}`)
      .send({ name: `Blocked ${suffix}`, type: 'expense' })
      .expect(403);

    const admin = await prisma.user.create({
      data: {
        name: 'Admin Tester',
        email: adminEmail,
        password: await bcrypt.hash(password, 10),
        role: 'admin',
      },
    });
    adminUserId = admin.id;

    const login = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: adminEmail, password })
      .expect(200);
    adminToken = (login.body as AuthResponse).access_token;

    await request(app.getHttpServer())
      .get('/users/admin/all-accounts')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200)
      .expect(({ body }: { body: unknown }) => {
        expect(Array.isArray(body)).toBe(true);
      });
  });

  it('throttles repeated login attempts', async () => {
    const statuses: number[] = [];
    for (let attempt = 0; attempt < 6; attempt += 1) {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: `missing-${suffix}@example.com`, password });
      statuses.push(response.status);
    }
    expect(statuses).toContain(429);
  });

  afterAll(async () => {
    const ids = [firstUserId, secondUserId, adminUserId].filter(Boolean);
    if (ids.length) {
      await prisma.user.deleteMany({ where: { id: { in: ids } } });
    }
    await app.close();
  });
});
