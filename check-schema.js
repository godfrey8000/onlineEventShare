// Check database schema against current schema.prisma
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkSchema() {
  try {
    console.log('🔍 Checking database schema...\n');

    // Try to query with all expected fields
    const result = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'Tracker'
      ORDER BY ordinal_position
    `;

    console.log('📋 Tracker table columns:');
    console.log('─────────────────────────────────────────────');
    result.forEach(col => {
      console.log(`  ${col.column_name.padEnd(20)} ${col.data_type.padEnd(20)} ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
    });
    console.log('─────────────────────────────────────────────\n');

    // Check specific columns
    const hasReminderEnabled = result.some(col => col.column_name === 'reminderEnabled');
    const hasCountdownEndsAt = result.some(col => col.column_name === 'countdownEndsAt');
    const hasIsFull = result.some(col => col.column_name === 'isFull');

    console.log('✅ Status:');
    console.log(`  reminderEnabled: ${hasReminderEnabled ? '✓ EXISTS' : '✗ MISSING'}`);
    console.log(`  countdownEndsAt: ${hasCountdownEndsAt ? '✓ EXISTS' : '✗ MISSING'}`);
    console.log(`  isFull:          ${hasIsFull ? '✓ EXISTS' : '✗ MISSING'}`);
    console.log('');

    // Check migration status
    const migrations = await prisma.$queryRaw`
      SELECT migration_name, finished_at
      FROM "_prisma_migrations"
      ORDER BY finished_at DESC
      LIMIT 10
    `;

    console.log('📝 Recent migrations:');
    console.log('─────────────────────────────────────────────');
    migrations.forEach(mig => {
      console.log(`  ${mig.migration_name}`);
    });
    console.log('─────────────────────────────────────────────\n');

    // Recommendations
    console.log('💡 Recommendations:');
    if (!hasReminderEnabled) {
      console.log('  ⚠️  reminderEnabled column is missing!');
      console.log('     Run: ALTER TABLE "Tracker" ADD COLUMN "reminderEnabled" BOOLEAN NOT NULL DEFAULT false;');
    }
    if (!hasCountdownEndsAt) {
      console.log('  ⚠️  countdownEndsAt column is missing!');
      console.log('     Run: ALTER TABLE "Tracker" ADD COLUMN "countdownEndsAt" TIMESTAMP(3);');
    }
    if (!hasIsFull) {
      console.log('  ⚠️  isFull column is missing!');
      console.log('     Run: ALTER TABLE "Tracker" ADD COLUMN "isFull" BOOLEAN NOT NULL DEFAULT false;');
    }
    if (hasReminderEnabled && hasCountdownEndsAt && hasIsFull) {
      console.log('  ✅ All required columns exist! Schema is up to date.');
    }

  } catch (err) {
    console.error('❌ Error checking schema:', err.message);

    if (err.message.includes('does not exist')) {
      console.log('\n💡 Database might not be initialized. Try running:');
      console.log('   npx prisma db push');
    }
  } finally {
    await prisma.$disconnect();
  }
}

checkSchema();
