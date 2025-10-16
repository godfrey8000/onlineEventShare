import { PrismaClient } from '@prisma/client';
import cron from 'node-cron';

const prisma = new PrismaClient();

/**
 * Clean up tracker records older than 1 day
 */
async function cleanupOldTrackers() {
  try {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const result = await prisma.tracker.deleteMany({
      where: {
        createdAt: {
          lt: oneDayAgo
        }
      }
    });

    console.log(`[Housekeeping] Deleted ${result.count} tracker records older than 1 day`);
    return result.count;
  } catch (err) {
    console.error('[Housekeeping] Error cleaning up trackers:', err);
    throw err;
  }
}

/**
 * Clean up chat messages older than 1 month
 */
async function cleanupOldChatMessages() {
  try {
    const oneMonthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const result = await prisma.chatMessage.deleteMany({
      where: {
        createdAt: {
          lt: oneMonthAgo
        }
      }
    });

    console.log(`[Housekeeping] Deleted ${result.count} chat messages older than 1 month`);
    return result.count;
  } catch (err) {
    console.error('[Housekeeping] Error cleaning up chat messages:', err);
    throw err;
  }
}

/**
 * Keep only the latest 3000 chat messages
 */
async function limitChatMessages() {
  try {
    // Count total messages
    const totalCount = await prisma.chatMessage.count();

    if (totalCount <= 3000) {
      console.log(`[Housekeeping] Chat messages count (${totalCount}) is within limit (3000)`);
      return 0;
    }

    // Get the ID of the 3000th most recent message
    const messagesToKeep = await prisma.chatMessage.findMany({
      select: { id: true },
      orderBy: { createdAt: 'desc' },
      take: 3000
    });

    const oldestKeptId = messagesToKeep[messagesToKeep.length - 1].id;

    // Delete all messages older than the 3000th
    const result = await prisma.chatMessage.deleteMany({
      where: {
        id: {
          lt: oldestKeptId
        }
      }
    });

    console.log(`[Housekeeping] Deleted ${result.count} chat messages to maintain 3000 limit (total was ${totalCount})`);
    return result.count;
  } catch (err) {
    console.error('[Housekeeping] Error limiting chat messages:', err);
    throw err;
  }
}

/**
 * Run all housekeeping tasks
 */
export async function runHousekeeping() {
  console.log('[Housekeeping] Starting housekeeping tasks...');
  const startTime = Date.now();

  try {
    // Run all cleanup tasks
    const [trackersDeleted, oldChatsDeleted, excessChatsDeleted] = await Promise.all([
      cleanupOldTrackers(),
      cleanupOldChatMessages(),
      limitChatMessages()
    ]);

    const duration = Date.now() - startTime;
    console.log(`[Housekeeping] Completed in ${duration}ms. Summary:`);
    console.log(`  - Trackers deleted: ${trackersDeleted}`);
    console.log(`  - Old chats deleted: ${oldChatsDeleted}`);
    console.log(`  - Excess chats deleted: ${excessChatsDeleted}`);

    return {
      success: true,
      duration,
      trackersDeleted,
      oldChatsDeleted,
      excessChatsDeleted
    };
  } catch (err) {
    console.error('[Housekeeping] Failed:', err);
    return {
      success: false,
      error: err.message
    };
  }
}

/**
 * Schedule housekeeping to run daily at 3 AM
 */
export function scheduleHousekeeping() {
  // Run every day at 3:00 AM
  cron.schedule('0 3 * * *', async () => {
    console.log('[Housekeeping] Scheduled task triggered at', new Date().toISOString());
    await runHousekeeping();
  });

  console.log('[Housekeeping] Scheduled to run daily at 3:00 AM');
}

/**
 * Manual trigger endpoint (for testing or manual runs)
 */
export { cleanupOldTrackers, cleanupOldChatMessages, limitChatMessages };
