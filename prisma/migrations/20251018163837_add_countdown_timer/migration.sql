-- AlterTable
-- Only add countdownEndsAt column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'Tracker' AND column_name = 'countdownEndsAt'
    ) THEN
        ALTER TABLE "Tracker" ADD COLUMN "countdownEndsAt" TIMESTAMP(3);
    END IF;
END $$;
