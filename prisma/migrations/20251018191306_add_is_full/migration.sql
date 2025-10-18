-- AlterTable
-- Only add isFull column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'Tracker' AND column_name = 'isFull'
    ) THEN
        ALTER TABLE "Tracker" ADD COLUMN "isFull" BOOLEAN NOT NULL DEFAULT false;
    END IF;
END $$;
