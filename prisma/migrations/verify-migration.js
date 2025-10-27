import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyMigration() {
  console.log('🔍 Verifying Migration Status...\n');

  try {
    // Check if tables exist
    const tables = [
      'Episode',
      'User',
      'Map',
      'Tracker',
      'MapFavorite',
      'ChatMessage',
      'Channel',
      'ReminderSettings'
    ];

    console.log('📋 Checking tables:');
    for (const table of tables) {
      try {
        const count = await prisma.$queryRawUnsafe(`SELECT COUNT(*) FROM "${table}"`);
        console.log(`  ✅ ${table}: ${count[0].count} rows`);
      } catch (err) {
        console.log(`  ❌ ${table}: Does not exist or error - ${err.message}`);
      }
    }

    // Check migration history
    console.log('\n📜 Migration History:');
    const migrations = await prisma.$queryRaw`
      SELECT migration_name, finished_at, applied_steps_count
      FROM "_prisma_migrations"
      ORDER BY started_at DESC
    `;

    if (migrations.length === 0) {
      console.log('  ⚠️  No migrations found in _prisma_migrations table');
      console.log('  💡 Run: npx prisma migrate resolve --applied 20250127000000_init');
    } else {
      migrations.forEach((m, i) => {
        console.log(`  ${i + 1}. ${m.migration_name} (${m.applied_steps_count} steps) - ${m.finished_at}`);
      });
    }

    // Check Role enum
    console.log('\n🎭 Role Enum Values:');
    try {
      const roles = await prisma.$queryRaw`
        SELECT enumlabel
        FROM pg_enum
        JOIN pg_type ON pg_enum.enumtypid = pg_type.oid
        WHERE pg_type.typname = 'Role'
        ORDER BY enumsortorder
      `;
      roles.forEach(r => console.log(`  - ${r.enumlabel}`));
    } catch (err) {
      console.log('  ❌ Role enum not found');
    }

    // Test basic operations
    console.log('\n🧪 Testing Basic Operations:');

    // Count users
    const userCount = await prisma.user.count();
    console.log(`  ✅ Users: ${userCount}`);

    // Count episodes
    const episodeCount = await prisma.episode.count();
    console.log(`  ✅ Episodes: ${episodeCount}`);

    // Count trackers
    const trackerCount = await prisma.tracker.count();
    console.log(`  ✅ Trackers: ${trackerCount}`);

    console.log('\n✨ Migration verification complete!');
    console.log('🎉 Database is ready to use!\n');

  } catch (err) {
    console.error('\n❌ Verification failed:', err.message);
    console.error('\n💡 Suggestions:');
    console.error('  1. Make sure database is running');
    console.error('  2. Check DATABASE_URL in .env');
    console.error('  3. Run: npx prisma migrate deploy');
    console.error('  4. Or run: npx prisma migrate resolve --applied 20250127000000_init\n');
  } finally {
    await prisma.$disconnect();
  }
}

verifyMigration();
