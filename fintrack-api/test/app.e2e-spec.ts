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

interface IdResponse {
  id: number;
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

  it('enforces profile authorization and permits authenticated category reads', async () => {
    await request(app.getHttpServer())
      .get(`/users/${secondUserId}`)
      .set('Authorization', `Bearer ${firstToken}`)
      .expect(403);

    await request(app.getHttpServer())
      .get('/users')
      .set('Authorization', `Bearer ${firstToken}`)
      .expect(403);

    await request(app.getHttpServer())
      .get('/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    await request(app.getHttpServer())
      .get('/categories')
      .set('Authorization', `Bearer ${firstToken}`)
      .expect(200);
  });

  it('maps duplicate account and category names to 409 conflicts', async () => {
    await request(app.getHttpServer())
      .post('/accounts')
      .set('Authorization', `Bearer ${firstToken}`)
      .send({ name: 'Private Account', type: 'bank' })
      .expect(409);

    const categoryName = `E2E Category ${suffix}`;
    const category = await request(app.getHttpServer())
      .post('/categories')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: categoryName, type: 'expense' })
      .expect(201);
    const categoryId = (category.body as IdResponse).id;

    await request(app.getHttpServer())
      .post('/categories')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: categoryName, type: 'expense' })
      .expect(409);

    await request(app.getHttpServer())
      .patch(`/categories/${categoryId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ type: 'income' })
      .expect(200);

    await request(app.getHttpServer())
      .delete(`/categories/${categoryId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(204);
  });

  it('validates category types, transfer ownership, and conditional ID types', async () => {
    const categories = await request(app.getHttpServer())
      .get('/categories')
      .set('Authorization', `Bearer ${firstToken}`)
      .expect(200);
    const incomeCategoryId = (
      categories.body as Array<{ id: number; type: string }>
    ).find((category) => category.type === 'income')?.id;

    await request(app.getHttpServer())
      .post('/transactions')
      .set('Authorization', `Bearer ${firstToken}`)
      .send({
        account_id: firstAccountId,
        category_id: incomeCategoryId,
        type: 'expense',
        amount: 100,
        transaction_date: '2026-08-04',
      })
      .expect(400);

    await request(app.getHttpServer())
      .post('/transactions')
      .set('Authorization', `Bearer ${firstToken}`)
      .send({
        account_id: firstAccountId,
        to_account_id: firstAccountId + 1,
        category_id: 'invalid',
        type: 'transfer',
        amount: 100,
        transaction_date: '2026-08-04',
      })
      .expect(400);

    const otherUserAccount = await request(app.getHttpServer())
      .post('/accounts')
      .set('Authorization', `Bearer ${secondToken}`)
      .send({ name: `Other User ${suffix}`, type: 'cash' })
      .expect(201);
    const otherUserAccountId = (otherUserAccount.body as IdResponse).id;

    await request(app.getHttpServer())
      .post('/transactions')
      .set('Authorization', `Bearer ${firstToken}`)
      .send({
        account_id: firstAccountId,
        to_account_id: otherUserAccountId,
        type: 'transfer',
        amount: 100,
        transaction_date: '2026-08-04',
      })
      .expect(404);
  });

  it('applies and reverses income, expense, and transfer balances', async () => {
    const categories = await request(app.getHttpServer())
      .get('/categories')
      .set('Authorization', `Bearer ${firstToken}`)
      .expect(200);
    const typedCategories = categories.body as Array<{
      id: number;
      type: string;
    }>;
    const incomeCategoryId = typedCategories.find(
      (category) => category.type === 'income',
    )!.id;
    const expenseCategoryId = typedCategories.find(
      (category) => category.type === 'expense',
    )!.id;

    const destination = await request(app.getHttpServer())
      .post('/accounts')
      .set('Authorization', `Bearer ${firstToken}`)
      .send({ name: `Transfer Target ${suffix}`, type: 'cash' })
      .expect(201);
    const destinationId = (destination.body as IdResponse).id;

    const income = await request(app.getHttpServer())
      .post('/transactions')
      .set('Authorization', `Bearer ${firstToken}`)
      .send({
        account_id: firstAccountId,
        category_id: incomeCategoryId,
        type: 'income',
        amount: 1000,
        transaction_date: '2026-08-04',
      })
      .expect(201);
    const expense = await request(app.getHttpServer())
      .post('/transactions')
      .set('Authorization', `Bearer ${firstToken}`)
      .send({
        account_id: firstAccountId,
        category_id: expenseCategoryId,
        type: 'expense',
        amount: 200,
        transaction_date: '2026-08-04',
      })
      .expect(201);
    const transfer = await request(app.getHttpServer())
      .post('/transactions')
      .set('Authorization', `Bearer ${firstToken}`)
      .send({
        account_id: firstAccountId,
        to_account_id: destinationId,
        type: 'transfer',
        amount: 500,
        transaction_date: '2026-08-04',
      })
      .expect(201);
    const incomeId = (income.body as IdResponse).id;
    const expenseId = (expense.body as IdResponse).id;
    const transferId = (transfer.body as IdResponse).id;

    await request(app.getHttpServer())
      .get(`/accounts/${firstAccountId}`)
      .set('Authorization', `Bearer ${firstToken}`)
      .expect(200)
      .expect(({ body }: { body: { balance: number } }) => {
        expect(body.balance).toBe(50300);
      });
    await request(app.getHttpServer())
      .get(`/accounts/${destinationId}`)
      .set('Authorization', `Bearer ${firstToken}`)
      .expect(200)
      .expect(({ body }: { body: { balance: number } }) => {
        expect(body.balance).toBe(500);
      });

    await request(app.getHttpServer())
      .patch(`/transactions/${expenseId}`)
      .set('Authorization', `Bearer ${firstToken}`)
      .send({ amount: 300 })
      .expect(200);

    await request(app.getHttpServer())
      .delete(`/transactions/${incomeId}`)
      .set('Authorization', `Bearer ${firstToken}`)
      .expect(204);
    await request(app.getHttpServer())
      .delete(`/transactions/${transferId}`)
      .set('Authorization', `Bearer ${firstToken}`)
      .expect(204);
    await request(app.getHttpServer())
      .delete(`/transactions/${expenseId}`)
      .set('Authorization', `Bearer ${firstToken}`)
      .expect(204);

    await request(app.getHttpServer())
      .get(`/accounts/${firstAccountId}`)
      .set('Authorization', `Bearer ${firstToken}`)
      .expect(200)
      .expect(({ body }: { body: { balance: number } }) => {
        expect(body.balance).toBe(50000);
      });
    await request(app.getHttpServer())
      .get(`/accounts/${destinationId}`)
      .set('Authorization', `Bearer ${firstToken}`)
      .expect(200)
      .expect(({ body }: { body: { balance: number } }) => {
        expect(body.balance).toBe(0);
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
