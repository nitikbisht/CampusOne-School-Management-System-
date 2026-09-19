const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Create the refresh_tokens table
  await prisma.$executeRawUnsafe(`
    CREATE TABLE "refresh_tokens" (
        "id" UUID NOT NULL DEFAULT gen_random_uuid(),
        "userId" UUID NOT NULL,
        "tokenHash" TEXT NOT NULL,
        "expiresAt" TIMESTAMP(3) NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "revokedAt" TIMESTAMP(3),
        CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
    )
  `);
  await prisma.$executeRawUnsafe(`
    CREATE INDEX "refresh_tokens_userId_idx" ON "refresh_tokens"("userId")
  `);
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
  `);
  console.log('Table created');

  // Insert migration record
  await prisma.$executeRawUnsafe(`
    INSERT INTO "_prisma_migrations" ("id", "checksum", "finished_at", "migration_name", "logs", "rolled_back_at", "started_at", "applied_steps_count")
    VALUES (
      gen_random_uuid(),
      'abc123',
      NOW(),
      '20260919170000_add_refresh_token',
      '',
      NULL,
      NOW(),
      1
    )
  `);
  console.log('Migration record inserted');

  await prisma.$disconnect();
}

main().catch(console.error);