-- Check Tracker table columns
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns
WHERE table_name = 'Tracker'
ORDER BY ordinal_position;

-- Check if reminderEnabled exists
SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'Tracker' AND column_name = 'reminderEnabled'
) AS reminder_enabled_exists;

-- Check if countdownEndsAt exists
SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'Tracker' AND column_name = 'countdownEndsAt'
) AS countdown_ends_at_exists;

-- Check if isFull exists
SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'Tracker' AND column_name = 'isFull'
) AS is_full_exists;

-- Show current migration status
SELECT migration_name, finished_at, applied_steps_count
FROM "_prisma_migrations"
ORDER BY finished_at DESC;
