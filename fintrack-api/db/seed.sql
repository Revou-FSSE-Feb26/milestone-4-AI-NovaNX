BEGIN;
TRUNCATE TABLE transactions,
accounts,
categories,
users RESTART IDENTITY CASCADE;
INSERT INTO users (name, email, password, role, created_at)
VALUES (
        'Alya Putri',
        'alya@example.com',
        '$2b$10$mockhash.alya',
        'user',
        '2026-05-01 08:00:00'
    ),
    (
        'Bima Santoso',
        'bima@example.com',
        '$2b$10$mockhash.bima',
        'user',
        '2026-05-03 09:15:00'
    ),
    (
        'Citra Lestari',
        'citra@example.com',
        '$2b$10$mockhash.citra',
        'user',
        '2026-05-08 10:30:00'
    ),
    (
        'Danu Prasetyo',
        'danu@example.com',
        '$2b$10$mockhash.danu',
        'user',
        '2026-05-10 11:00:00'
    ),
    (
        'Eka Rahmawati',
        'eka@example.com',
        '$2b$10$mockhash.eka',
        'user',
        '2026-05-12 13:45:00'
    );
INSERT INTO accounts (user_id, name, type, balance, created_at)
VALUES (
        1,
        'BCA Utama',
        'bank',
        10250000.00,
        '2026-05-01 08:30:00'
    ),
    (
        1,
        'Dompet Harian',
        'cash',
        815000.00,
        '2026-05-01 08:35:00'
    ),
    (
        2,
        'Mandiri Payroll',
        'bank',
        8350000.00,
        '2026-05-03 09:30:00'
    ),
    (
        2,
        'GoPay',
        'e-wallet',
        460000.00,
        '2026-05-03 09:35:00'
    ),
    (
        3,
        'BNI Tabungan',
        'bank',
        12400000.00,
        '2026-05-08 10:45:00'
    ),
    (
        3,
        'OVO',
        'e-wallet',
        695000.00,
        '2026-05-08 10:50:00'
    );
INSERT INTO categories (name, type)
VALUES ('Salary', 'income'),
    ('Freelance', 'income'),
    ('Food & Dining', 'expense'),
    ('Transportation', 'expense'),
    ('Bills & Utilities', 'expense'),
    ('Shopping', 'expense'),
    ('Healthcare', 'expense');
INSERT INTO transactions (
        account_id,
        category_id,
        type,
        amount,
        description,
        transaction_date,
        created_at
    )
VALUES (
        1,
        1,
        'income',
        9000000.00,
        'June salary',
        '2026-06-01',
        '2026-06-01 08:00:00'
    ),
    (
        1,
        5,
        'expense',
        650000.00,
        'Electricity and internet',
        '2026-06-03',
        '2026-06-03 19:20:00'
    ),
    (
        1,
        3,
        'expense',
        185000.00,
        'Family dinner',
        '2026-06-08',
        '2026-06-08 20:15:00'
    ),
    (
        2,
        3,
        'expense',
        45000.00,
        'Office lunch',
        '2026-06-10',
        '2026-06-10 12:25:00'
    ),
    (
        2,
        4,
        'expense',
        30000.00,
        'Bus and MRT',
        '2026-06-12',
        '2026-06-12 18:10:00'
    ),
    (
        1,
        2,
        'income',
        1500000.00,
        'Website freelance project',
        '2026-06-20',
        '2026-06-20 14:00:00'
    ),
    (
        1,
        1,
        'income',
        9000000.00,
        'July salary',
        '2026-07-01',
        '2026-07-01 08:00:00'
    ),
    (
        2,
        6,
        'expense',
        275000.00,
        'Household supplies',
        '2026-07-05',
        '2026-07-05 16:40:00'
    ),
    (
        3,
        1,
        'income',
        8500000.00,
        'June salary',
        '2026-06-01',
        '2026-06-01 08:05:00'
    ),
    (
        3,
        5,
        'expense',
        725000.00,
        'Rent and utilities',
        '2026-06-04',
        '2026-06-04 09:10:00'
    ),
    (
        4,
        4,
        'expense',
        52000.00,
        'Ride-hailing',
        '2026-06-07',
        '2026-06-07 22:00:00'
    ),
    (
        4,
        3,
        'expense',
        68000.00,
        'Coffee with client',
        '2026-06-11',
        '2026-06-11 15:30:00'
    ),
    (
        3,
        2,
        'income',
        1200000.00,
        'Photography project',
        '2026-06-18',
        '2026-06-18 17:45:00'
    ),
    (
        3,
        6,
        'expense',
        480000.00,
        'New work shoes',
        '2026-06-23',
        '2026-06-23 19:00:00'
    ),
    (
        3,
        1,
        'income',
        8500000.00,
        'July salary',
        '2026-07-01',
        '2026-07-01 08:05:00'
    ),
    (
        4,
        3,
        'expense',
        95000.00,
        'Weekend meals',
        '2026-07-06',
        '2026-07-06 20:20:00'
    ),
    (
        5,
        1,
        'income',
        10500000.00,
        'June salary',
        '2026-06-01',
        '2026-06-01 08:10:00'
    ),
    (
        5,
        5,
        'expense',
        900000.00,
        'Apartment utilities',
        '2026-06-05',
        '2026-06-05 10:25:00'
    ),
    (
        6,
        4,
        'expense',
        76000.00,
        'Commuter rides',
        '2026-06-09',
        '2026-06-09 18:45:00'
    ),
    (
        6,
        3,
        'expense',
        125000.00,
        'Groceries',
        '2026-06-14',
        '2026-06-14 11:30:00'
    ),
    (
        5,
        2,
        'income',
        2250000.00,
        'Consulting fee',
        '2026-06-21',
        '2026-06-21 13:15:00'
    ),
    (
        5,
        6,
        'expense',
        620000.00,
        'Desk accessories',
        '2026-06-27',
        '2026-06-27 15:55:00'
    ),
    (
        5,
        1,
        'income',
        10500000.00,
        'July salary',
        '2026-07-01',
        '2026-07-01 08:10:00'
    ),
    (
        6,
        4,
        'expense',
        84000.00,
        'Ride-hailing',
        '2026-07-08',
        '2026-07-08 21:05:00'
    );
COMMIT;