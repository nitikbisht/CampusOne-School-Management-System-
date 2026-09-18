# CampusOne

School ERP + Student Information System. Two apps in one repo:

| Folder | What | Stack |
|---|---|---|
| `api/` | REST API (modular monolith) | Node.js 22, TypeScript, Express 5, Prisma 6, PostgreSQL, Zod |
| `web/` | Web app with role-based portals | Next.js, TypeScript, Tailwind CSS |

Docs: [Architecture](docs/ARCHITECTURE.md) · [Database workflow](docs/DATABASE.md) · [Contributing](CONTRIBUTING.md)

## First-time setup (each developer)

Requirements: Node.js 22+, Docker Desktop, Git.

```bash
npm run setup                        # install api + web dependencies
docker compose up -d                 # local PostgreSQL
cp api/.env.example api/.env         # (PowerShell: Copy-Item works too)
cp web/.env.example web/.env.local

# Tables: ONLY if api/prisma/migrations does not exist yet, create the first migration
# (one of you does this once, then commits it). Otherwise this just applies existing ones.
npm run db:migrate -- --name init

npm run db:seed                      # fake demo data
npm run api:dev                      # terminal 1: http://localhost:4000
npm run web:dev                      # terminal 2: http://localhost:3000
```

Open http://localhost:3000. The page shows whether the web app can reach the API and database.
Also try http://localhost:4000/api/v1/health/ready.

## Everyday commands

| Command | Purpose |
|---|---|
| `npm test` | API tests |
| `npm run typecheck` | TypeScript check for the API |
| `npm run db:migrate -- --name <what_changed>` | Create + apply a migration on your local DB |
| `npm --prefix api run db:studio` | Browse the database in the browser |
| `npm run db:down` | Stop local Postgres (data is kept) |
