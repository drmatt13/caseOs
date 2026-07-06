-- AlterEnum
-- Enum-only migration: the new value must not be used by any statement in the
-- same transaction (PostgreSQL restriction on ALTER TYPE ... ADD VALUE).
ALTER TYPE "AccountTier" ADD VALUE 'solo' BEFORE 'pro';
