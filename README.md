# FinTrack API

FinTrack API adalah backend untuk aplikasi pencatatan keuangan pribadi. Setiap pengguna dapat memiliki beberapa akun, seperti uang tunai, rekening bank, atau dompet digital. Pengguna mencatat pemasukan, pengeluaran, dan transfer pada akun tersebut, lalu mengelompokkannya dengan kategori agar arus kas dan pola pengeluaran lebih mudah dianalisis.

Source code project ada di folder [`fintrack-api/`](fintrack-api).

## Live Base URL

[https://milestone-4-ai-novanx-production.up.railway.app](https://milestone-4-ai-novanx-production.up.railway.app)

Dokumentasi Swagger tersedia di [https://milestone-4-ai-novanx-production.up.railway.app/docs](https://milestone-4-ai-novanx-production.up.railway.app/docs).

## What's New (Week 22 / Part 4)

- Authentication memakai JWT Bearer (`@nestjs/jwt`, Passport JWT) melalui `POST /auth/register` dan `POST /auth/login`.
- Password wajib minimal 8 karakter dengan huruf besar, kecil, dan angka; selalu di-hash dengan bcrypt sebelum disimpan dan tidak pernah dikirim dalam response API.
- `accounts` dan `transactions` dilindungi `JwtAuthGuard`; query difilter berdasarkan user dari JWT, bukan `user_id` dari request body.
- Categories dapat dibaca user terautentikasi, tetapi create/update/delete hanya untuk role `admin` melalui `RolesGuard` dan decorator `@Roles()`.
- Profil user hanya dapat dibaca/diubah/dihapus oleh pemilik atau admin. Admin dapat melihat seluruh user dan akun lewat `GET /users/admin/all-accounts`.
- Balance calculation diekstrak ke custom injectable provider agar business logic menggunakan dependency injection.
- Security bootstrap mencakup Helmet, CORS allowlist dari environment, Swagger Bearer Auth, request logger middleware, dan limit 5 login per 60 detik.
- E2E test mencakup register/login, bcrypt hash, 401 invalid/missing token, ownership isolation, forged owner payload, 403 RBAC, admin access, dan 429 throttling.

### Demo credentials

Setelah `npm run prisma:seed`, seluruh demo user memakai password `Fintrack123`. `alya@example.com` memiliki role `admin`; user lain, termasuk `bima@example.com`, memiliki role `user`.

### Security configuration

Isi variabel berikut di `.env` (jangan commit secret sebenarnya):

```env
JWT_SECRET=replace-with-a-long-random-secret
JWT_EXPIRES_IN=3600
CORS_ORIGINS=http://localhost:3000,https://your-frontend.example.com
```

Known limitations: token belum memiliki refresh/revocation flow, dan throttler memakai storage in-memory sehingga counter tidak dibagi antar instance deployment. Untuk deployment horizontal, gunakan shared throttler storage seperti Redis.

## What's New (Week 21)

- Dokumentasi API interaktif dengan **Swagger/OpenAPI** (`@nestjs/swagger`), tersedia di `/docs`
- Seluruh controller (`accounts`, `categories`, `transactions`, `users`) dilengkapi `@ApiTags`, `@ApiOperation`, `@ApiParam`, dan dekorator response (`@ApiOkResponse`, `@ApiCreatedResponse`, `@ApiNoContentResponse`, `@ApiNotFoundResponse`, `@ApiBadRequestResponse`)
- Seluruh DTO (`CreateXxxDto`) dilengkapi `@ApiProperty`/`@ApiPropertyOptional` dengan deskripsi dan contoh nilai; `UpdateXxxDto` memakai `PartialType` dari `@nestjs/swagger` agar skema optional-nya terbawa ke dokumentasi

## What's New (Week 20)

Minggu lalu hanya tersedia 4 mock `GET` endpoint tanpa validasi. Minggu ini:

- Full CRUD (`GET`, `GET /:id`, `POST`, `PATCH`, `DELETE`) untuk `accounts`, `categories`, dan `transactions`; `users` mendapat `POST` (registrasi)
- Global `ValidationPipe` dengan `whitelist`, `forbidNonWhitelisted`, dan `transform`
- DTO per resource per operasi (`CreateXxxDto`, `UpdateXxxDto` via `PartialType`)
- Balance-update logic di service layer: `income` menambah, `expense` mengurangi saldo akun; `PATCH` dan `DELETE` otomatis reverse efek lama
- Enum `TransactionType` dipakai konsisten di DTO, interface, dan service
- Schema `transactions.category_id` dibuat nullable dengan CHECK constraint untuk tipe `transfer`
- Data seed dan mock service disinkronkan: 5 users, 6 accounts, 7 categories
- `tsconfig.json` dibersihkan dari opsi deprecated

## Entity-Relationship Diagram

![FinTrack entity-relationship diagram](fintrack-api/docs/erd.png)

Source diagram tersedia di [`fintrack-api/docs/erd.mmd`](fintrack-api/docs/erd.mmd) agar ERD dapat diperbarui bersama schema.

## Requirements

- Node.js 20 atau versi yang lebih baru
- npm
- PostgreSQL

## Menjalankan NestJS

Jalankan perintah berikut dari root repo:

```bash
cd fintrack-api
npm install
cp .env.example .env
# Ganti JWT_SECRET di .env dengan random secret yang kuat.
npm run start:dev
```

Server berjalan di `http://localhost:3000` secara default. Nilai port dapat diubah melalui `PORT` di file `.env`.

## API Documentation (Swagger)

Setelah server berjalan, dokumentasi API interaktif (Swagger UI) tersedia di:

```
http://localhost:3000/docs
```

Dokumentasi ini dihasilkan otomatis dari kode (`DocumentBuilder` + `SwaggerModule` di `fintrack-api/src/main.ts`). Klik **Authorize** dan masukkan JWT dari endpoint login untuk mencoba protected endpoint.

## API Endpoints

### Users

| Method | Endpoint                    | Akses         | Deskripsi            |
| ------ | --------------------------- | ------------- | -------------------- |
| POST   | `/auth/register`            | Public        | Registrasi user baru |
| POST   | `/auth/login`               | Public        | Mendapatkan JWT      |
| GET    | `/users/:id`                | Owner / admin | Detail profil        |
| PATCH  | `/users/:id`                | Owner / admin | Update profil        |
| DELETE | `/users/:id`                | Owner / admin | Hapus profil         |
| GET    | `/users`                    | Admin         | Daftar semua user    |
| GET    | `/users/admin/all-accounts` | Admin         | Daftar seluruh akun  |

### Accounts

Semua endpoint accounts membutuhkan Bearer token dan hanya mengakses akun milik user tersebut.

### Categories

Read membutuhkan Bearer token; create, update, dan delete membutuhkan role `admin`.

### Transactions

Semua endpoint transactions membutuhkan Bearer token dan hanya mengakses transaksi dari akun milik user tersebut.

### Contoh Request Body

**POST /auth/register**

```json
{ "name": "Alya Putri", "email": "alya@example.com", "password": "Secure123" }
```

**POST /accounts**

```json
{ "name": "BCA Utama", "type": "bank", "balance": 5000000 }
```

**POST /categories**

```json
{ "name": "Salary", "type": "income" }
```

**POST /transactions**

```json
{
  "account_id": 1,
  "category_id": 1,
  "type": "income",
  "amount": 9000000,
  "description": "June salary",
  "transaction_date": "2026-06-01"
}
```

**POST /transactions (transfer antar akun sendiri)**

```json
{
  "account_id": 1,
  "to_account_id": 2,
  "type": "transfer",
  "amount": 500000,
  "description": "Top up dompet harian",
  "transaction_date": "2026-06-15"
}
```

> `type` transactions: `income` | `expense` | `transfer`
> `type` categories: `income` | `expense`
> Untuk `type: "transfer"`, `category_id` tidak wajib diisi, tetapi `to_account_id` **wajib** diisi.
> Transfer hanya diperbolehkan **antar akun milik user dari JWT yang sama**; `to_account_id` harus berbeda dari `account_id`. Resource milik user lain disembunyikan dengan **404 Not Found**.

## Validasi

Global `ValidationPipe` aktif dengan:

- `whitelist: true` — field yang tidak ada di DTO otomatis dihapus
- `forbidNonWhitelisted: true` — field asing mengembalikan **400 Bad Request**
- `transform: true` — tipe data otomatis dikonversi (string → number untuk `:id`)

## Database & Prisma

Skema database dikelola lewat **Prisma** (`fintrack-api/prisma/schema.prisma`). Tabel, kolom, index, dan foreign key diselaraskan dengan `fintrack-api/db/schema.sql`. Karena Prisma Schema Language belum mendukung deklarasi `CHECK`, aturan enum, amount positif, category wajib, dan destination transfer diterapkan melalui custom SQL migration `20260804190000_add_business_check_constraints`. Semua service (`users`, `accounts`, `categories`, `transactions`) mengakses PostgreSQL lewat `PrismaService`.

Setup dari folder `fintrack-api`:

```bash
cd fintrack-api
cp .env.example .env          # sesuaikan DATABASE_URL dengan kredensial Postgres lokal
createdb fintrack             # atau: createdb -U <role> fintrack
npx prisma migrate dev --name init   # membuat tabel sesuai prisma/schema.prisma + auto-seed
```

Jika PostgreSQL meminta password role tertentu, sesuaikan `DATABASE_URL` di `.env`:

```
DATABASE_URL=postgresql://<user>:<password>@localhost:5432/fintrack
```

Data contoh (`fintrack-api/prisma/seed.ts`, 5 users, 6 accounts, 7 categories, 24 transactions — identik dengan `fintrack-api/db/seed.sql`) otomatis dijalankan setiap kali `prisma migrate dev` atau `prisma migrate reset` selesai, lewat konfigurasi `"prisma": { "seed": "..." }` di `package.json`. Untuk menjalankannya ulang secara manual (misalnya setelah data berubah saat testing):

```bash
npx prisma db seed
# atau
npm run prisma:seed
```

Perintah lain yang tersedia:

```bash
npm run prisma:generate   # regenerate Prisma Client setelah schema.prisma berubah
npm run prisma:migrate    # buat/terapkan migrasi baru (otomatis re-seed)
npm run prisma:studio     # buka Prisma Studio (GUI) untuk melihat/edit data
npm run prisma:seed       # jalankan ulang prisma/seed.ts secara manual
```

> `fintrack-api/db/schema.sql`, `fintrack-api/db/seed.sql`, dan `fintrack-api/db/queries.sql` tetap disimpan sebagai referensi/dokumentasi skema mentah, tetapi migrasi dan seeding yang sesungguhnya sekarang dijalankan lewat Prisma (`fintrack-api/prisma/migrations/`, `fintrack-api/prisma/seed.ts`).

### Query relasional (nested include)

Beberapa endpoint mengembalikan data relasi bersarang dalam satu response (Prisma `include`), bukan sekadar `findMany`/`findUnique` datar:

- `GET /users` → setiap user disertai `accounts` miliknya (password selalu disembunyikan lewat `omit`)
- `GET /accounts/:id` → akun disertai seluruh `transactions` miliknya
- `GET /transactions` dan `GET /transactions/:id` → transaksi disertai `account`, `toAccount` (tujuan transfer, jika ada), dan `category`

## Pengujian

Dari folder `fintrack-api`:

```bash
npm run build
npm run lint
npm run test
npm run test:e2e
```

Tes e2e membuat dan membersihkan data test sendiri serta memverifikasi authentication, password hashing, ownership, RBAC, validation, conflict handling, throttling, kesesuaian tipe category, transfer ownership, dan perubahan/reversal balance untuk income, expense, serta transfer.
Hasil dan perintah smoke test deployment production didokumentasikan di
[`fintrack-api/docs/api-smoke-test.md`](fintrack-api/docs/api-smoke-test.md).

## Postman Collection

Collection Postman tersedia di [fintrack-api/docs/fintrack.postman_collection.json](https://github.com/Revou-FSSE-Feb26/milestone-4-AI-NovaNX/blob/main/fintrack-api/docs/fintrack.postman_collection.json) (klik untuk melihat isi file di GitHub, lalu download dan import ke Postman lewat `File → Import`). Atur variable `baseUrl` (default `http://localhost:3000`), lalu jalankan. Collection ini mencakup:

- Register → login → simpan token otomatis → protected account request
- Invalid token (401), forged `user_id` (400), dan ownership isolation (404)
- Login user kedua dan admin, admin global account access, serta user-to-admin negative flow (403)
