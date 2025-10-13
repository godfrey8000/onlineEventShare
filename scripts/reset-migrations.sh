#!/bin/bash
# Reset migrations and create fresh schema

echo "⚠️  WARNING: This will delete all migrations!"
echo "Only use this if you want to start completely fresh."
echo ""
read -p "Are you sure? (type 'yes' to continue): " confirm

if [ "$confirm" != "yes" ]; then
    echo "Aborted."
    exit 0
fi

echo ""
echo "🗑️  Deleting old migrations..."
rm -rf prisma/migrations/*

echo "✅ Old migrations deleted"
echo ""
echo "📝 Creating new migration from current schema..."
npx prisma migrate dev --name init --create-only

echo ""
echo "✅ New migration created!"
echo ""
echo "Next steps:"
echo "1. Review the migration in prisma/migrations/"
echo "2. Apply it: npx prisma migrate deploy"
echo "3. Run seed: npm run seed"
