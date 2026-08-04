# FinTrack API Smoke Test

## Target

- Environment: Railway production
- Base URL: `https://milestone-4-ai-novanx-production.up.railway.app`
- Swagger UI: `https://milestone-4-ai-novanx-production.up.railway.app/docs`
- Database: PostgreSQL on Railway, accessed through Prisma
- Last verified: 2026-08-04

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
