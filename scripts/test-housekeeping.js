#!/usr/bin/env node

/**
 * Test script for housekeeping jobs
 * Run with: node scripts/test-housekeeping.js
 */

import { PrismaClient } from '@prisma/client';
import { runHousekeeping } from '../src/jobs/housekeeping.js';

const prisma = new PrismaClient();

async function createTestData() {
  console.log('📝 Creating test data...\n');

  // Create old tracker (2 days ago)
  const oldTracker = await prisma.tracker.create({
    data: {
      episodeNumber: 10,
      mapId: 1,
      channelId: 1,
      level: 70,
      status: 2,
      nickname: 'Old Tracker',
      createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000), // 2 days ago
      updatedAt: new Date(Date.now() - 48 * 60 * 60 * 1000)
    }
  });
  console.log(`✅ Created old tracker (2 days old): ID ${oldTracker.id}`);

  // Create recent tracker (should not be deleted)
  const recentTracker = await prisma.tracker.create({
    data: {
      episodeNumber: 10,
      mapId: 1,
      channelId: 2,
      level: 70,
      status: 3,
      nickname: 'Recent Tracker',
      createdAt: new Date(), // now
      updatedAt: new Date()
    }
  });
  console.log(`✅ Created recent tracker: ID ${recentTracker.id}`);

  // Create old chat message (2 months ago)
  const user = await prisma.user.findFirst();
  if (user) {
    const oldChat = await prisma.chatMessage.create({
      data: {
        userId: user.id,
        content: 'Old message from 2 months ago',
        createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), // 2 months ago
        updatedAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000)
      }
    });
    console.log(`✅ Created old chat message (2 months old): ID ${oldChat.id}`);
  }

  console.log('\n');
}

async function showStats() {
  const trackerCount = await prisma.tracker.count();
  const chatCount = await prisma.chatMessage.count();

  console.log('📊 Current Database Stats:');
  console.log(`   - Trackers: ${trackerCount}`);
  console.log(`   - Chat Messages: ${chatCount}`);
  console.log('');
}

async function main() {
  console.log('🧹 Housekeeping Test Script\n');
  console.log('='.repeat(50));
  console.log('\n');

  // Show initial stats
  console.log('BEFORE CLEANUP:');
  await showStats();

  // Create test data
  await createTestData();
  await showStats();

  // Run housekeeping
  console.log('🚀 Running housekeeping jobs...\n');
  const result = await runHousekeeping();

  console.log('\n' + '='.repeat(50));
  console.log('\n');

  // Show final stats
  console.log('AFTER CLEANUP:');
  await showStats();

  console.log('✅ Test completed successfully!');
  console.log('\nResult:', JSON.stringify(result, null, 2));

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
