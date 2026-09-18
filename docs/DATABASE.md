# Database workflow

## Environments

| Environment | Database | Who uses it | How schema changes arrive |
|---|---|---|---|
| Local | Docker Postgres (`docker compose up -d`) | each developer | `prisma migrate dev` (creates migrations) |
| Test | `campusone_test` in the same Docker instance | automated tests | `prisma migrate deploy` |
| Shared dev | Neon `dev` branch | both developers, demos | `prisma migrate deploy` after merge to `main` |
| Production | Neon `production` branch | real school (later) | `prisma migrate deploy` from CI only |

## Connection URLs (api/.env)
- `DATABASE_URL`: pooled URL, used by the running API.
- `DATABASE_URL_UNPOOLED`: direct URL, used by Prisma Migrate (`directUrl` in `schema.prisma`).
- Local Docker: both point to the same local URL.
- Neon: `neon env pull` writes `DATABASE_URL` and `DATABASE_URL_UNPOOLED`; copy them into a
  gitignored file or CI secrets. Do not overwrite your local `api/.env` with them.

To run a command against the shared DB once, without touching your `.env`:

```bash
# macOS / Linux
DATABASE_URL="<pooled>" DATABASE_URL_UNPOOLED="<direct>" npm --prefix api run db:deploy
```

## Before real data: one current academic year per school
Prisma cannot express a partial unique index, so add it as a hand-edited migration:

```bash
npm --prefix api run db:migrate -- --create-only --name one_current_academic_year
```

Then put this in the generated `migration.sql` and run `npm run db:migrate` again:

```sql
CREATE UNIQUE INDEX "academic_years_one_current_per_school"
  ON "academic_years" ("schoolId") WHERE "isCurrent" = true;
```

## Data model rules
- Every tenant table has `schoolId`.
- Academic data belongs to an academic year through enrollments (added in Phase 2).
- Masters (exam types, leave types, grades...) are tables, never enums or hard-coded.
- Promotion creates a new enrollment; old records are never overwritten.
- Prefer soft states (`isActive`, `status`) over deleting business records.
