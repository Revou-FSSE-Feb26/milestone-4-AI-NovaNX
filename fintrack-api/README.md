# FinTrack API

FinTrack API adalah backend untuk aplikasi pencatatan keuangan pribadi. Setiap pengguna dapat memiliki beberapa akun, seperti uang tunai, rekening bank, atau dompet digital. Pengguna mencatat pemasukan, pengeluaran, dan transfer pada akun tersebut, lalu mengelompokkannya dengan kategori agar arus kas dan pola pengeluaran lebih mudah dianalisis.

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

## Mock Endpoints

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
