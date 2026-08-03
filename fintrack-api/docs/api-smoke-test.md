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

for path in / /users /accounts /categories /transactions /docs; do
  curl -sS -o /dev/null -w "$path: %{http_code}\n" "$BASE_URL$path"
done

curl -sS -o /dev/null -w "invalid user: %{http_code}\n" \
  -X POST "$BASE_URL/users" \
  -H "Content-Type: application/json" \
  -d '{"name":"","email":"not-an-email","password":"123"}'

curl -sS -o /dev/null -w "missing route: %{http_code}\n" \
  "$BASE_URL/does-not-exist"

curl -sS -o /dev/null -w "unknown account owner: %{http_code}\n" \
  -X POST "$BASE_URL/accounts" \
  -H "Content-Type: application/json" \
  -d '{"user_id":999999,"name":"Missing Owner Account","type":"bank","balance":0}'

curl -sS -o /dev/null -w "unknown transaction account: %{http_code}\n" \
  -X POST "$BASE_URL/transactions" \
  -H "Content-Type: application/json" \
  -d '{"account_id":999999,"category_id":1,"type":"expense","amount":10000,"transaction_date":"2026-08-04"}'
```

## Verification Result

| Check                                          | Expected | Actual | Result |
| ---------------------------------------------- | -------: | -----: | ------ |
| `GET /`                                        |      200 |    200 | Pass   |
| `GET /users`                                   |      200 |    200 | Pass   |
| `GET /accounts`                                |      200 |    200 | Pass   |
| `GET /categories`                              |      200 |    200 | Pass   |
| `GET /transactions`                            |      200 |    200 | Pass   |
| `GET /docs`                                    |      200 |    200 | Pass   |
| Invalid `POST /users` body                     |      400 |    400 | Pass   |
| `GET /does-not-exist`                          |      404 |    404 | Pass   |
| `POST /accounts` with unknown `user_id`        |      404 |    404 | Pass   |
| `POST /transactions` with unknown `account_id` |      404 |    404 | Pass   |

The invalid user request returned validation messages for the empty name,
invalid email, and password shorter than six characters. Full CRUD success and
error examples for every resource are available in
`docs/fintrack.postman_collection.json`.

## Local Quality Checks

Run from the `fintrack-api` directory:

```bash
npm run build
npm run lint
npm test -- --runInBand
npm run test:e2e -- --runInBand
```

The E2E suite uses the real Prisma-backed application, verifies the canonical
response shape, confirms that user passwords are omitted, and checks that
unknown foreign-key references return `404 Not Found` instead of an internal
server error.
