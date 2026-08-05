# FinTrack API Smoke Test

## Target

- Environment: Railway production
- Base URL: `https://milestone-4-ai-novanx-production.up.railway.app`
- Swagger UI: `https://milestone-4-ai-novanx-production.up.railway.app/docs`
- Database: PostgreSQL on Railway, accessed through Prisma
- Last verified: 2026-08-04

## Request and Response Examples for Every Endpoint

The examples below document every application endpoint, not only the negative
status checks in the automated smoke test. Response IDs and timestamps are
illustrative because they depend on the current database state. Set these
variables first; use the token returned by the corresponding login request.

```bash
BASE_URL="https://milestone-4-ai-novanx-production.up.railway.app"
USER_TOKEN="<JWT for bima@example.com>"
ADMIN_TOKEN="<JWT for alya@example.com>"
```

All protected requests send `Authorization: Bearer <token>`. Mutation examples
use placeholder IDs such as `<userId>` and `<accountId>` so newly created test
resources can be used instead of changing seed records.

### Application and Auth

#### `GET /`

Request:

```bash
curl -i "$BASE_URL/"
```

Response — `200 OK`:

```text
Hello World!
```

#### `POST /auth/register`

Request:

```bash
curl -X POST "$BASE_URL/auth/register" -H "Content-Type: application/json" -d '{"name":"Nadia Putri","email":"nadia.smoke@example.com","password":"Secure123"}'
```

Response — `201 Created` (password is excluded):

```json
{
  "id": 6,
  "name": "Nadia Putri",
  "email": "nadia.smoke@example.com",
  "role": "user",
  "created_at": "2026-08-05T04:00:00.000Z"
}
```

#### `POST /auth/login`

Request:

```bash
curl -X POST "$BASE_URL/auth/login" -H "Content-Type: application/json" -d '{"email":"bima@example.com","password":"Fintrack123"}'
```

Response — `200 OK`:

```json
{
  "access_token": "<signed-jwt>",
  "user": {
    "id": 2,
    "name": "Bima Santoso",
    "email": "bima@example.com",
    "role": "user"
  }
}
```

### Users

#### `GET /users`

Request (admin only):

```bash
curl "$BASE_URL/users" -H "Authorization: Bearer $ADMIN_TOKEN"
```

Response — `200 OK` (array shortened; every user includes their accounts):

```json
[
  {
    "id": 1,
    "name": "Alya Putri",
    "email": "alya@example.com",
    "role": "admin",
    "created_at": "2026-05-01T08:00:00.000Z",
    "accounts": [
      {
        "id": 1,
        "user_id": 1,
        "name": "BCA Utama",
        "type": "bank",
        "balance": 10250000,
        "created_at": "2026-05-01T08:30:00.000Z"
      }
    ]
  }
]
```

#### `GET /users/admin/all-accounts`

Request (admin only):

```bash
curl "$BASE_URL/users/admin/all-accounts" -H "Authorization: Bearer $ADMIN_TOKEN"
```

Response — `200 OK` (array shortened):

```json
[
  {
    "id": 1,
    "user_id": 1,
    "name": "BCA Utama",
    "type": "bank",
    "balance": 10250000,
    "created_at": "2026-05-01T08:30:00.000Z"
  }
]
```

#### `GET /users/:id`

Request (owner or admin):

```bash
curl "$BASE_URL/users/2" -H "Authorization: Bearer $USER_TOKEN"
```

Response — `200 OK` (nested accounts shortened):

```json
{
  "id": 2,
  "name": "Bima Santoso",
  "email": "bima@example.com",
  "role": "user",
  "created_at": "2026-05-03T09:15:00.000Z",
  "accounts": [
    {
      "id": 3,
      "user_id": 2,
      "name": "Mandiri Payroll",
      "type": "bank",
      "balance": 8350000,
      "created_at": "2026-05-03T09:30:00.000Z"
    }
  ]
}
```

#### `POST /users`

Request (admin only):

```bash
curl -X POST "$BASE_URL/users" -H "Authorization: Bearer $ADMIN_TOKEN" -H "Content-Type: application/json" -d '{"name":"Raka Putra","email":"raka.smoke@example.com","password":"Secure123"}'
```

Response — `201 Created` (save the returned `id` as `<userId>`):

```json
{
  "id": 7,
  "name": "Raka Putra",
  "email": "raka.smoke@example.com",
  "role": "user",
  "created_at": "2026-08-05T04:05:00.000Z"
}
```

#### `PATCH /users/:id`

Request (owner or admin):

```bash
curl -X PATCH "$BASE_URL/users/<userId>" -H "Authorization: Bearer $ADMIN_TOKEN" -H "Content-Type: application/json" -d '{"name":"Raka Pratama"}'
```

Response — `200 OK`:

```json
{
  "id": 7,
  "name": "Raka Pratama",
  "email": "raka.smoke@example.com",
  "role": "user",
  "created_at": "2026-08-05T04:05:00.000Z"
}
```

#### `DELETE /users/:id`

Request (owner or admin):

```bash
curl -i -X DELETE "$BASE_URL/users/<userId>" -H "Authorization: Bearer $ADMIN_TOKEN"
```

Response — `204 No Content`: empty response body.

### Accounts

#### `GET /accounts`

Request:

```bash
curl "$BASE_URL/accounts" -H "Authorization: Bearer $USER_TOKEN"
```

Response — `200 OK`:

```json
[
  {
    "id": 3,
    "user_id": 2,
    "name": "Mandiri Payroll",
    "type": "bank",
    "balance": 8350000,
    "created_at": "2026-05-03T09:30:00.000Z"
  },
  {
    "id": 4,
    "user_id": 2,
    "name": "GoPay",
    "type": "e-wallet",
    "balance": 460000,
    "created_at": "2026-05-03T09:35:00.000Z"
  }
]
```

#### `GET /accounts/:id`

Request:

```bash
curl "$BASE_URL/accounts/3" -H "Authorization: Bearer $USER_TOKEN"
```

Response — `200 OK` (nested transactions shortened):

```json
{
  "id": 3,
  "user_id": 2,
  "name": "Mandiri Payroll",
  "type": "bank",
  "balance": 8350000,
  "created_at": "2026-05-03T09:30:00.000Z",
  "transactions": [
    {
      "id": 15,
      "account_id": 3,
      "to_account_id": null,
      "category_id": 1,
      "type": "income",
      "amount": 8500000,
      "description": "July salary",
      "transaction_date": "2026-07-01T00:00:00.000Z",
      "created_at": "2026-07-01T08:05:00.000Z"
    }
  ]
}
```

#### `POST /accounts`

Request (owner is derived from JWT; no `user_id` is accepted):

```bash
curl -X POST "$BASE_URL/accounts" -H "Authorization: Bearer $USER_TOKEN" -H "Content-Type: application/json" -d '{"name":"Smoke Test Cash","type":"cash","balance":100000}'
```

Response — `201 Created` (save `id` as `<accountId>`):

```json
{
  "id": 11,
  "user_id": 2,
  "name": "Smoke Test Cash",
  "type": "cash",
  "balance": 100000,
  "created_at": "2026-08-05T04:10:00.000Z"
}
```

#### `PATCH /accounts/:id`

Request:

```bash
curl -X PATCH "$BASE_URL/accounts/<accountId>" -H "Authorization: Bearer $USER_TOKEN" -H "Content-Type: application/json" -d '{"name":"Smoke Test Wallet","type":"e-wallet"}'
```

Response — `200 OK`:

```json
{
  "id": 11,
  "user_id": 2,
  "name": "Smoke Test Wallet",
  "type": "e-wallet",
  "balance": 100000,
  "created_at": "2026-08-05T04:10:00.000Z"
}
```

#### `DELETE /accounts/:id`

Request:

```bash
curl -i -X DELETE "$BASE_URL/accounts/<accountId>" -H "Authorization: Bearer $USER_TOKEN"
```

Response — `204 No Content`: empty response body.

### Categories

#### `GET /categories`

Request (any authenticated user):

```bash
curl "$BASE_URL/categories" -H "Authorization: Bearer $USER_TOKEN"
```

Response — `200 OK` (array shortened):

```json
[
  { "id": 1, "name": "Salary", "type": "income" },
  { "id": 3, "name": "Food & Dining", "type": "expense" }
]
```

#### `GET /categories/:id`

Request (any authenticated user):

```bash
curl "$BASE_URL/categories/3" -H "Authorization: Bearer $USER_TOKEN"
```

Response — `200 OK`:

```json
{ "id": 3, "name": "Food & Dining", "type": "expense" }
```

#### `POST /categories`

Request (admin only):

```bash
curl -X POST "$BASE_URL/categories" -H "Authorization: Bearer $ADMIN_TOKEN" -H "Content-Type: application/json" -d '{"name":"Smoke Test Expense","type":"expense"}'
```

Response — `201 Created` (save `id` as `<categoryId>`):

```json
{ "id": 8, "name": "Smoke Test Expense", "type": "expense" }
```

#### `PATCH /categories/:id`

Request (admin only):

```bash
curl -X PATCH "$BASE_URL/categories/<categoryId>" -H "Authorization: Bearer $ADMIN_TOKEN" -H "Content-Type: application/json" -d '{"name":"Smoke Test Shopping"}'
```

Response — `200 OK`:

```json
{ "id": 8, "name": "Smoke Test Shopping", "type": "expense" }
```

#### `DELETE /categories/:id`

Request (admin only; delete after dependent test transactions are removed):

```bash
curl -i -X DELETE "$BASE_URL/categories/<categoryId>" -H "Authorization: Bearer $ADMIN_TOKEN"
```

Response — `204 No Content`: empty response body.

### Transactions

#### `GET /transactions`

Request:

```bash
curl "$BASE_URL/transactions" -H "Authorization: Bearer $USER_TOKEN"
```

Response — `200 OK` (array shortened; relations are included):

```json
[
  {
    "id": 9,
    "account_id": 3,
    "to_account_id": null,
    "category_id": 1,
    "type": "income",
    "amount": 8500000,
    "description": "June salary",
    "transaction_date": "2026-06-01T00:00:00.000Z",
    "created_at": "2026-06-01T08:05:00.000Z",
    "account": { "id": 3, "name": "Mandiri Payroll", "type": "bank" },
    "toAccount": null,
    "category": { "id": 1, "name": "Salary", "type": "income" }
  }
]
```

#### `GET /transactions/:id`

Request:

```bash
curl "$BASE_URL/transactions/9" -H "Authorization: Bearer $USER_TOKEN"
```

Response — `200 OK`:

```json
{
  "id": 9,
  "account_id": 3,
  "to_account_id": null,
  "category_id": 1,
  "type": "income",
  "amount": 8500000,
  "description": "June salary",
  "transaction_date": "2026-06-01T00:00:00.000Z",
  "created_at": "2026-06-01T08:05:00.000Z",
  "account": { "id": 3, "name": "Mandiri Payroll", "type": "bank" },
  "toAccount": null,
  "category": { "id": 1, "name": "Salary", "type": "income" }
}
```

#### `POST /transactions`

Request (expense example; account and category must match the JWT owner/type):

```bash
curl -X POST "$BASE_URL/transactions" -H "Authorization: Bearer $USER_TOKEN" -H "Content-Type: application/json" -d '{"account_id":3,"category_id":3,"type":"expense","amount":50000,"description":"Smoke test lunch","transaction_date":"2026-08-05"}'
```

Response — `201 Created` (save `id` as `<transactionId>`):

```json
{
  "id": 25,
  "account_id": 3,
  "to_account_id": null,
  "category_id": 3,
  "type": "expense",
  "amount": 50000,
  "description": "Smoke test lunch",
  "transaction_date": "2026-08-05T00:00:00.000Z",
  "created_at": "2026-08-05T04:15:00.000Z"
}
```

Transfer request variant (both accounts must belong to the JWT user):

```bash
curl -X POST "$BASE_URL/transactions" -H "Authorization: Bearer $USER_TOKEN" -H "Content-Type: application/json" -d '{"account_id":3,"to_account_id":4,"type":"transfer","amount":100000,"description":"Smoke test transfer","transaction_date":"2026-08-05"}'
```

Response — `201 Created`:

```json
{
  "id": 26,
  "account_id": 3,
  "to_account_id": 4,
  "category_id": null,
  "type": "transfer",
  "amount": 100000,
  "description": "Smoke test transfer",
  "transaction_date": "2026-08-05T00:00:00.000Z",
  "created_at": "2026-08-05T04:16:00.000Z"
}
```

#### `PATCH /transactions/:id`

Request:

```bash
curl -X PATCH "$BASE_URL/transactions/<transactionId>" -H "Authorization: Bearer $USER_TOKEN" -H "Content-Type: application/json" -d '{"amount":75000,"description":"Updated smoke test lunch"}'
```

Response — `200 OK`:

```json
{
  "id": 25,
  "account_id": 3,
  "to_account_id": null,
  "category_id": 3,
  "type": "expense",
  "amount": 75000,
  "description": "Updated smoke test lunch",
  "transaction_date": "2026-08-05T00:00:00.000Z",
  "created_at": "2026-08-05T04:15:00.000Z"
}
```

The old balance effect is reversed and the new effect is applied in the same
database transaction.

#### `DELETE /transactions/:id`

Request:

```bash
curl -i -X DELETE "$BASE_URL/transactions/<transactionId>" -H "Authorization: Bearer $USER_TOKEN"
```

Response — `204 No Content`: empty response body. The transaction's balance
effect is reversed atomically.

## Automated Checks

Run these checks from any terminal with `curl` installed:

```bash
BASE_URL="https://milestone-4-ai-novanx-production.up.railway.app"

for path in / /docs; do
  curl -sS -o /dev/null -w "$path: %{http_code}\n" "$BASE_URL$path"
done

for path in /users /accounts /categories /transactions; do
  curl -sS -o /dev/null -w "$path without token: %{http_code}\n" \
    "$BASE_URL$path"
done

curl -sS -o /dev/null -w "invalid registration: %{http_code}\n" \
  -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"name":"","email":"not-an-email","password":"123"}'

curl -sS -o /dev/null -w "missing route: %{http_code}\n" \
  "$BASE_URL/does-not-exist"

curl -sS -o /dev/null -w "invalid bearer token: %{http_code}\n" \
  -H "Authorization: Bearer invalid-token" \
  "$BASE_URL/accounts"
```

## Verification Result

| Check                              | Expected | Actual | Result |
| ---------------------------------- | -------: | -----: | ------ |
| `GET /`                            |      200 |    200 | Pass   |
| `GET /users` without token         |      401 |    401 | Pass   |
| `GET /accounts` without token      |      401 |    401 | Pass   |
| `GET /categories` without token    |      401 |    401 | Pass   |
| `GET /transactions` without token  |      401 |    401 | Pass   |
| `GET /docs`                        |      200 |    200 | Pass   |
| Invalid `POST /auth/register` body |      400 |    400 | Pass   |
| `GET /does-not-exist`              |      404 |    404 | Pass   |
| `GET /accounts` with invalid token |      401 |    401 | Pass   |

The invalid registration request returns validation messages for the empty
name, invalid email, and password shorter than eight characters or missing the
required uppercase, lowercase, and numeric characters. Authenticated owner and
admin flows are covered by the E2E suite and
`docs/fintrack.postman_collection.json`.

## Local Quality Checks

Run from the `fintrack-api` directory:

```bash
npm run build
npm run lint
npm test -- --runInBand
npm run test:e2e -- --runInBand
```

The E2E suite uses the real Prisma-backed application. It covers authentication,
password hashing, ownership, RBAC, 400/401/403/404/409/429 responses, category
type integrity, same-owner transfer validation, and create/update/delete balance
effects for income, expense, and transfer transactions.

## Related Test Evidence

The complete local API regression test report is available in the
[Postman Newman Report](test-evidence/postman-report.html). This report
complements the Railway production smoke test and covers authentication,
authorization, CRUD operations, validation, balance updates, cleanup, and rate
limiting.
