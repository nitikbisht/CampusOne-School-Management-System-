const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS refresh_tokens (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL,
      token_hash TEXT NOT NULL,
      expires_at TIMESTAMPTZ NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      revoked_at TIMESTAMPTZ
    )
  `);
  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id)
  `);
  console.log('Table and index created');
  await prisma.$disconnect();
}

main().catch(console.error);