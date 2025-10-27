import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Check all trackers with active countdowns and update status to 1 when countdown expires
 * Also set phaseOneTime when transition occurs
 */
export async function checkExpiredCountdowns(io) {
  try {
    const now = new Date();

    // Find all trackers with expired countdowns
    const expiredTrackers = await prisma.tracker.findMany({
      where: {
        countdownEndsAt: {
          lte: now
        },
        status: {
          lt: 1 // Only update trackers in phase 0
        }
      },
      include: {
        episode: true,
        map: true,
        user: true
      }
    });

    if (expiredTrackers.length === 0) {
      return { updated: 0 };
    }

    console.log(`[CountdownChecker] Found ${expiredTrackers.length} expired countdowns`);

    // Update all expired trackers
    const updates = expiredTrackers.map(async (tracker) => {
      const updated = await prisma.tracker.update({
        where: { id: tracker.id },
        data: {
          status: 1, // Move to phase 1
          // Keep countdownEndsAt as the phase 1 start time (when countdown ended)
        },
        include: {
          episode: true,
          map: true,
          user: true
        }
      });

      // Broadcast the update via Socket.io
      if (io) {
        console.log(`[CountdownChecker] Broadcasting tracker:changed:global for tracker ${tracker.id}`);
        io.emit('tracker:changed:global', updated);

        // ✅ Emit reminder event for phase 0→1 transition
        console.log('[CountdownChecker] Emitting phase transition reminder:', updated.id);
        io.emit('tracker:reminder', {
          id: updated.id,
          level: updated.level,
          channelId: updated.channelId,
          mapName: updated.map?.name
        });
      }

      return updated;
    });

    await Promise.all(updates);

    console.log(`[CountdownChecker] Updated ${expiredTrackers.length} trackers to phase 1`);

    return { updated: expiredTrackers.length };
  } catch (err) {
    console.error('[CountdownChecker] Error checking expired countdowns:', err);
    throw err;
  }
}

/**
 * Start the countdown checker interval
 * Runs every 5 seconds to check for expired countdowns
 * 5 seconds is a good balance between responsiveness and server load:
 * - Quick enough for near-instant updates (max 5s delay)
 * - Light database load (12 queries/minute)
 * - Minimal resource usage
 */
export function startCountdownChecker(io) {
  console.log('[CountdownChecker] Starting countdown checker (every 5 seconds)');

  // Run immediately on start
  checkExpiredCountdowns(io).catch(err => {
    console.error('[CountdownChecker] Initial check failed:', err);
  });

  // Then run every 5 seconds
  const interval = setInterval(async () => {
    try {
      await checkExpiredCountdowns(io);
    } catch (err) {
      console.error('[CountdownChecker] Interval check failed:', err);
    }
  }, 5000); // 5 seconds - balanced for responsiveness vs. load

  return interval;
}
