-- Clean Migration Reset Script
-- This script will reset the _prisma_migrations table to only contain the new init migration

-- Step 1: Clear all old migrations
DELETE FROM "_prisma_migrations";

-- Step 2: Insert the new init migration
INSERT INTO "_prisma_migrations" (
    "id",
    "checksum",
    "finished_at",
    "migration_name",
    "logs",
    "rolled_back_at",
    "started_at",
    "applied_steps_count"
) VALUES (
    '00000000-0000-0000-0000-000000000001',
    'clean_init_migration_checksum',
    NOW(),
    '20250127000000_init',
    NULL,
    NULL,
    NOW(),
    1
);

-- Verification
SELECT * FROM "_prisma_migrations" ORDER BY "started_at" DESC;
