# FinTrack API

FinTrack API adalah backend untuk aplikasi pencatatan keuangan pribadi. Setiap pengguna dapat memiliki beberapa akun, seperti uang tunai, rekening bank, atau dompet digital. Pengguna mencatat pemasukan, pengeluaran, dan transfer pada akun tersebut, lalu mengelompokkannya dengan kategori agar arus kas dan pola pengeluaran lebih mudah dianalisis.

## Live Base URL

> **TODO: isi setelah deployment**
> `https://<your-app>.railway.app` _(ganti dengan URL aktual setelah deploy)_

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

![FinTrack entity-relationship diagram](docs/erd.png)

Source diagram tersedia di `docs/erd.mmd` agar ERD dapat diperbarui bersama schema.

## Requirements

- Node.js 20 atau versi yang lebih baru
- npm
- PostgreSQL

## Menjalankan NestJS

Jalankan perintah berikut dari folder `fintrack-api`:

```bash
npm install
cp .env.example .env
npm run start:dev
```

Server berjalan di `http://localhost:3000` secara default. Nilai port dapat diubah melalui `PORT` di file `.env`.

## API Endpoints

### Users

| Method | Endpoint | Deskripsi            |
| ------ | -------- | -------------------- |
| GET    | `/users` | Daftar semua user    |
| POST   | `/users` | Registrasi user baru |

### Accounts

| Method | Endpoint        | Deskripsi         |
| ------ | --------------- | ----------------- |
| GET    | `/accounts`     | Daftar semua akun |
| GET    | `/accounts/:id` | Detail akun       |
| POST   | `/accounts`     | Buat akun baru    |
| PATCH  | `/accounts/:id` | Update akun       |
| DELETE | `/accounts/:id` | Hapus akun        |

### Categories

| Method | Endpoint          | Deskripsi             |
| ------ | ----------------- | --------------------- |
| GET    | `/categories`     | Daftar semua kategori |
| GET    | `/categories/:id` | Detail kategori       |
| POST   | `/categories`     | Buat kategori baru    |
| PATCH  | `/categories/:id` | Update kategori       |
| DELETE | `/categories/:id` | Hapus kategori        |

### Transactions

| Method | Endpoint            | Deskripsi              |
| ------ | ------------------- | ---------------------- |
| GET    | `/transactions`     | Daftar semua transaksi |
| GET    | `/transactions/:id` | Detail transaksi       |
| POST   | `/transactions`     | Buat transaksi baru    |
| PATCH  | `/transactions/:id` | Update transaksi       |
| DELETE | `/transactions/:id` | Hapus transaksi        |

### Contoh Request Body

**POST /users**

```json
{ "name": "Alya Putri", "email": "alya@example.com", "password": "secret123" }
```

**POST /accounts**

```json
{ "user_id": 1, "name": "BCA Utama", "type": "bank", "balance": 5000000 }
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

> `type` transactions: `income` | `expense` | `transfer`
> `type` categories: `income` | `expense`
> Untuk `type: "transfer"`, `category_id` tidak wajib diisi.

## Validasi

Global `ValidationPipe` aktif dengan:

- `whitelist: true` — field yang tidak ada di DTO otomatis dihapus
- `forbidNonWhitelisted: true` — field asing mengembalikan **400 Bad Request**
- `transform: true` — tipe data otomatis dikonversi (string → number untuk `:id`)

## Menjalankan SQL

Buat database lokal, lalu jalankan file secara berurutan dari folder `fintrack-api`:

```bash
createdb fintrack
psql -d fintrack -f db/schema.sql
psql -d fintrack -f db/seed.sql
psql -d fintrack -f db/queries.sql
```

## Pengujian

```bash
npm run build
npm run lint
npm run test
npm run test:e2e
```

Database belum dihubungkan ke NestJS pada milestone ini. Endpoint berikut mengembalikan static mock data dari service masing-masing:

| Method | Endpoint        | Deskripsi                    |
| ------ | --------------- | ---------------------------- |
| GET    | `/users`        | Menampilkan daftar pengguna  |
| GET    | `/accounts`     | Menampilkan daftar akun      |
| GET    | `/categories`   | Menampilkan daftar kategori  |
| GET    | `/transactions` | Menampilkan daftar transaksi |

## Menjalankan SQL

Buat database lokal, lalu jalankan file secara berurutan dari folder `fintrack-api`:

```bash
createdb fintrack
psql -d fintrack -f db/schema.sql
psql -d fintrack -f db/seed.sql
psql -d fintrack -f db/queries.sql
```

Jika PostgreSQL menggunakan role tertentu, tambahkan opsi `-U`:

```bash
createdb -U postgres fintrack
psql -U postgres -d fintrack -f db/schema.sql
psql -U postgres -d fintrack -f db/seed.sql
psql -U postgres -d fintrack -f db/queries.sql
```

PostgreSQL akan meminta password role tersebut bila password authentication aktif. `schema.sql` dapat dijalankan ulang karena tabel lama dihapus berdasarkan urutan foreign key; setelah itu jalankan kembali `seed.sql`.

## Pengujian

```bash
npm run build
npm run lint
npm run test
npm run test:e2e
```

Tes e2e memeriksa bahwa keempat mock endpoint dapat diakses dan mengembalikan field sesuai canonical schema FinTrack.
