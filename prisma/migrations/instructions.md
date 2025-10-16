# Production Migration Instructions

## Problem
Local dev created a full schema migration including isFull column,
but production needs only an ALTER TABLE migration.

## Solution for Production

1. Apply this SQL directly to production database:

```sql
ALTER TABLE "Tracker" ADD COLUMN "isFull" BOOLEAN NOT NULL DEFAULT false;
```

2. Mark migration as applied:

```bash
npx prisma migrate resolve --applied 20251015_add_is_full_column
```

3. Verify schema matches:

```bash
npx prisma migrate status
```

## For Future Reference

To avoid this issue in the future:
- Always have a production-like database for generating migrations
- Use `npx prisma migrate dev` for incremental changes
- Test migrations on staging before production
