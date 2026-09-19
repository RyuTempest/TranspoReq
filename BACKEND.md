# TFT backend

The Vercel backend uses PostgreSQL and serverless API routes. The React UI can continue to run locally with its existing browser fallback while the API is configured.

## Vercel setup

1. Create or link a Vercel project for this repository.
2. Add a Vercel Postgres/Neon database from the Vercel dashboard.
3. Copy the database connection variables into the project environment. `POSTGRES_URL` is required by `@vercel/postgres`.
4. Add `JWT_SECRET` with a long random value. Never commit it.
5. Run `db/schema.sql` once against the connected PostgreSQL database using the Vercel/Neon SQL editor.
6. Deploy with `vercel --prod` or push to the connected Git repository.
7. Check `GET /api/health`; it should return `{ "ok": true, "database": "connected" }`.

## API

- `POST /api/auth/login` — login with `{ username, password }`; returns a user and 8-hour JWT.
- `GET /api/tft` — authenticated TFT list.
- `POST /api/tft` — authenticated TFT creation with validated transportation rows.
- `GET /api/master-data?resource=locations|modes|departments|positions` — authenticated master data list.
- `POST /api/master-data?resource=...` — admin-only master data create.
- `PATCH /api/master-data?resource=...` — admin-only edit.
- `DELETE /api/master-data?resource=...&id=...` — admin-only soft deactivate.
- `GET /api/users` — admin-only user list.
- `POST /api/users` — admin-only user creation with bcrypt password hashing.
- `PATCH /api/users?id=...` — admin-only user edit.
- `DELETE /api/users?id=...` — admin-only soft deactivate.

Send the token returned from login as `Authorization: Bearer <token>`.

## Seed accounts

The schema seeds these development accounts. Change or deactivate them after deployment:

- `admin` / `admin123`
- `user` / `user123`

The frontend currently stores its local fallback data in browser storage. The API is the production persistence layer and should be wired into the form submit/login clients before treating local storage as authoritative.
