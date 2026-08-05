// Prisma-native seed script (mirrors db/seed.sql 1:1).
// Runs automatically after `prisma migrate dev` / `prisma migrate reset`,
// and can be triggered manually with `npx prisma db seed`.
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const demoPasswordHash = await bcrypt.hash('Fintrack123', 10);
  // Reset tables and restart identity sequences, same as db/seed.sql.
  await prisma.$executeRawUnsafe(
    'TRUNCATE TABLE transactions, accounts, categories, users RESTART IDENTITY CASCADE',
  );

  await prisma.user.createMany({
    data: [
      {
        name: 'Alya Putri',
        email: 'alya@example.com',
        password: demoPasswordHash,
        role: 'admin',
        created_at: new Date('2026-05-01T08:00:00Z'),
      },
      {
        name: 'Bima Santoso',
        email: 'bima@example.com',
        password: demoPasswordHash,
        role: 'user',
        created_at: new Date('2026-05-03T09:15:00Z'),
      },
      {
        name: 'Citra Lestari',
        email: 'citra@example.com',
        password: demoPasswordHash,
        role: 'user',
        created_at: new Date('2026-05-08T10:30:00Z'),
      },
      {
        name: 'Danu Prasetyo',
        email: 'danu@example.com',
        password: demoPasswordHash,
        role: 'user',
        created_at: new Date('2026-05-10T11:00:00Z'),
      },
      {
        name: 'Eka Rahmawati',
        email: 'eka@example.com',
        password: demoPasswordHash,
        role: 'user',
        created_at: new Date('2026-05-12T13:45:00Z'),
      },
    ],
  });

  await prisma.account.createMany({
    data: [
      {
        user_id: 1,
        name: 'BCA Utama',
        type: 'bank',
        balance: 10250000.0,
        created_at: new Date('2026-05-01T08:30:00Z'),
      },
      {
        user_id: 1,
        name: 'Dompet Harian',
        type: 'cash',
        balance: 815000.0,
        created_at: new Date('2026-05-01T08:35:00Z'),
      },
      {
        user_id: 2,
        name: 'Mandiri Payroll',
        type: 'bank',
        balance: 8350000.0,
        created_at: new Date('2026-05-03T09:30:00Z'),
      },
      {
        user_id: 2,
        name: 'GoPay',
        type: 'e-wallet',
        balance: 460000.0,
        created_at: new Date('2026-05-03T09:35:00Z'),
      },
      {
        user_id: 3,
        name: 'BNI Tabungan',
        type: 'bank',
        balance: 12400000.0,
        created_at: new Date('2026-05-08T10:45:00Z'),
      },
      {
        user_id: 3,
        name: 'OVO',
        type: 'e-wallet',
        balance: 695000.0,
        created_at: new Date('2026-05-08T10:50:00Z'),
      },
      {
        user_id: 4,
        name: 'BRI Simpedes',
        type: 'bank',
        balance: 4250000.0,
        created_at: new Date('2026-05-10T11:15:00Z'),
      },
      {
        user_id: 4,
        name: 'DANA',
        type: 'e-wallet',
        balance: 350000.0,
        created_at: new Date('2026-05-10T11:20:00Z'),
      },
      {
        user_id: 5,
        name: 'BCA Tahapan',
        type: 'bank',
        balance: 6750000.0,
        created_at: new Date('2026-05-12T14:00:00Z'),
      },
      {
        user_id: 5,
        name: 'ShopeePay',
        type: 'e-wallet',
        balance: 525000.0,
        created_at: new Date('2026-05-12T14:05:00Z'),
      },
    ],
  });

  await prisma.category.createMany({
    data: [
      { name: 'Salary', type: 'income' },
      { name: 'Freelance', type: 'income' },
      { name: 'Food & Dining', type: 'expense' },
      { name: 'Transportation', type: 'expense' },
      { name: 'Bills & Utilities', type: 'expense' },
      { name: 'Shopping', type: 'expense' },
      { name: 'Healthcare', type: 'expense' },
    ],
  });

  await prisma.transaction.createMany({
    data: [
      {
        account_id: 1,
        category_id: 1,
        type: 'income',
        amount: 9000000.0,
        description: 'June salary',
        transaction_date: new Date('2026-06-01T00:00:00Z'),
        created_at: new Date('2026-06-01T08:00:00Z'),
      },
      {
        account_id: 1,
        category_id: 5,
        type: 'expense',
        amount: 650000.0,
        description: 'Electricity and internet',
        transaction_date: new Date('2026-06-03T00:00:00Z'),
        created_at: new Date('2026-06-03T19:20:00Z'),
      },
      {
        account_id: 1,
        category_id: 3,
        type: 'expense',
        amount: 185000.0,
        description: 'Family dinner',
        transaction_date: new Date('2026-06-08T00:00:00Z'),
        created_at: new Date('2026-06-08T20:15:00Z'),
      },
      {
        account_id: 2,
        category_id: 3,
        type: 'expense',
        amount: 45000.0,
        description: 'Office lunch',
        transaction_date: new Date('2026-06-10T00:00:00Z'),
        created_at: new Date('2026-06-10T12:25:00Z'),
      },
      {
        account_id: 2,
        category_id: 4,
        type: 'expense',
        amount: 30000.0,
        description: 'Bus and MRT',
        transaction_date: new Date('2026-06-12T00:00:00Z'),
        created_at: new Date('2026-06-12T18:10:00Z'),
      },
      {
        account_id: 1,
        category_id: 2,
        type: 'income',
        amount: 1500000.0,
        description: 'Website freelance project',
        transaction_date: new Date('2026-06-20T00:00:00Z'),
        created_at: new Date('2026-06-20T14:00:00Z'),
      },
      {
        account_id: 1,
        category_id: 1,
        type: 'income',
        amount: 9000000.0,
        description: 'July salary',
        transaction_date: new Date('2026-07-01T00:00:00Z'),
        created_at: new Date('2026-07-01T08:00:00Z'),
      },
      {
        account_id: 2,
        category_id: 6,
        type: 'expense',
        amount: 275000.0,
        description: 'Household supplies',
        transaction_date: new Date('2026-07-05T00:00:00Z'),
        created_at: new Date('2026-07-05T16:40:00Z'),
      },
      {
        account_id: 3,
        category_id: 1,
        type: 'income',
        amount: 8500000.0,
        description: 'June salary',
        transaction_date: new Date('2026-06-01T00:00:00Z'),
        created_at: new Date('2026-06-01T08:05:00Z'),
      },
      {
        account_id: 3,
        category_id: 5,
        type: 'expense',
        amount: 725000.0,
        description: 'Rent and utilities',
        transaction_date: new Date('2026-06-04T00:00:00Z'),
        created_at: new Date('2026-06-04T09:10:00Z'),
      },
      {
        account_id: 4,
        category_id: 4,
        type: 'expense',
        amount: 52000.0,
        description: 'Ride-hailing',
        transaction_date: new Date('2026-06-07T00:00:00Z'),
        created_at: new Date('2026-06-07T22:00:00Z'),
      },
      {
        account_id: 4,
        category_id: 3,
        type: 'expense',
        amount: 68000.0,
        description: 'Coffee with client',
        transaction_date: new Date('2026-06-11T00:00:00Z'),
        created_at: new Date('2026-06-11T15:30:00Z'),
      },
      {
        account_id: 3,
        category_id: 2,
        type: 'income',
        amount: 1200000.0,
        description: 'Photography project',
        transaction_date: new Date('2026-06-18T00:00:00Z'),
        created_at: new Date('2026-06-18T17:45:00Z'),
      },
      {
        account_id: 3,
        category_id: 6,
        type: 'expense',
        amount: 480000.0,
        description: 'New work shoes',
        transaction_date: new Date('2026-06-23T00:00:00Z'),
        created_at: new Date('2026-06-23T19:00:00Z'),
      },
      {
        account_id: 3,
        category_id: 1,
        type: 'income',
        amount: 8500000.0,
        description: 'July salary',
        transaction_date: new Date('2026-07-01T00:00:00Z'),
        created_at: new Date('2026-07-01T08:05:00Z'),
      },
      {
        account_id: 4,
        category_id: 3,
        type: 'expense',
        amount: 95000.0,
        description: 'Weekend meals',
        transaction_date: new Date('2026-07-06T00:00:00Z'),
        created_at: new Date('2026-07-06T20:20:00Z'),
      },
      {
        account_id: 5,
        category_id: 1,
        type: 'income',
        amount: 10500000.0,
        description: 'June salary',
        transaction_date: new Date('2026-06-01T00:00:00Z'),
        created_at: new Date('2026-06-01T08:10:00Z'),
      },
      {
        account_id: 5,
        category_id: 5,
        type: 'expense',
        amount: 900000.0,
        description: 'Apartment utilities',
        transaction_date: new Date('2026-06-05T00:00:00Z'),
        created_at: new Date('2026-06-05T10:25:00Z'),
      },
      {
        account_id: 6,
        category_id: 4,
        type: 'expense',
        amount: 76000.0,
        description: 'Commuter rides',
        transaction_date: new Date('2026-06-09T00:00:00Z'),
        created_at: new Date('2026-06-09T18:45:00Z'),
      },
      {
        account_id: 6,
        category_id: 3,
        type: 'expense',
        amount: 125000.0,
        description: 'Groceries',
        transaction_date: new Date('2026-06-14T00:00:00Z'),
        created_at: new Date('2026-06-14T11:30:00Z'),
      },
      {
        account_id: 5,
        category_id: 2,
        type: 'income',
        amount: 2250000.0,
        description: 'Consulting fee',
        transaction_date: new Date('2026-06-21T00:00:00Z'),
        created_at: new Date('2026-06-21T13:15:00Z'),
      },
      {
        account_id: 5,
        category_id: 6,
        type: 'expense',
        amount: 620000.0,
        description: 'Desk accessories',
        transaction_date: new Date('2026-06-27T00:00:00Z'),
        created_at: new Date('2026-06-27T15:55:00Z'),
      },
      {
        account_id: 5,
        category_id: 1,
        type: 'income',
        amount: 10500000.0,
        description: 'July salary',
        transaction_date: new Date('2026-07-01T00:00:00Z'),
        created_at: new Date('2026-07-01T08:10:00Z'),
      },
      {
        account_id: 6,
        category_id: 4,
        type: 'expense',
        amount: 84000.0,
        description: 'Ride-hailing',
        transaction_date: new Date('2026-07-08T00:00:00Z'),
        created_at: new Date('2026-07-08T21:05:00Z'),
      },
    ],
  });

  console.log(
    'Seed completed: 5 users, 10 accounts, 7 categories, 24 transactions',
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
