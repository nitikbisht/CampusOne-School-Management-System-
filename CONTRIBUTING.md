# Working together on CampusOne

## Branches and pull requests
- Never push to `main`. Turn on branch protection: require a pull request and passing CI.
- One branch per feature: `feature/auth`, `feature/school-masters`, `feature/students`...
- Every PR is reviewed by the other person. Keep PRs small (one module or one slice).
- Before you start a module, tell each other which module you are taking.

## Database rules (most important)
1. **Never change tables by hand.** Change `api/prisma/schema.prisma`, then run
   `npm run db:migrate -- --name <what_changed>` and commit the new folder in `api/prisma/migrations/`.
2. **Pull before you touch the schema.** Two people editing `schema.prisma` at the same time causes
   migration conflicts. Say it in chat first.
3. **Do the migration work on your local Docker DB**, not on the shared database.
4. **Never run `prisma migrate reset` or `prisma db push` against the shared database.**
5. The shared database only receives migrations that are already merged into `main`
   (`prisma migrate deploy`, done by CI or by one person).
6. **Never edit a migration that is already merged.** Add a new one instead.
7. Fake data only. Never put real student data in dev or shared databases.

## Secrets
- `.env` and `.env.local` are never committed. Share real credentials via a password manager.
- If a secret is ever committed, treat it as leaked: rotate it immediately.

## Definition of done for a module
Requirement -> schema + migration -> API (routes, validation, permissions) -> UI -> error handling
-> tests -> short doc note -> PR reviewed and merged.

## Code conventions
- Business rules live in `*.service.ts`. Controllers only handle HTTP. Repositories only talk to Prisma.
- Every tenant query is scoped by `schoolId`. Every route declares the permission it needs.
- Never trust an ID from the request: always look records up together with the caller's `schoolId`
  (and, for students/parents, their allowed relationships).
- Important changes (attendance, marks, fees, permissions...) must write an `AuditLog`.
