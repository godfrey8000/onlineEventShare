import express from 'express';
import { prisma } from '../db.js';
import { authOptional, authRequired, authorizeRole } from '../middleware/auth.js';
import { CreateTracker, UpdateTracker } from '../utils/validators.js';

const router = express.Router();

// ✅ Public: List trackers (visitors can also see)
router.get('/trackers', authOptional, async (req, res) => {
  try {
    const { sortBy = 'updatedAt', order = 'desc' } = req.query;
    const allowed = ['status', 'level', 'nickname', 'createdAt', 'updatedAt'];
    const sort = allowed.includes(sortBy) ? sortBy : 'updatedAt';
    const asc = order === 'asc';

    const trackers = await prisma.tracker.findMany({
      orderBy: { [sort]: asc ? 'asc' : 'desc' },
      include: { episode: true, map: true },
    });

    res.json(trackers);
  } catch (err) {
    console.error('Error fetching trackers:', err);
    res.status(500).json({ error: 'Failed to fetch trackers' });
  }
});

// ✅ Restricted: Create tracker (EDITOR, ADMIN)
router.post('/trackers', authRequired, authorizeRole('EDITOR', 'ADMIN'), async (req, res) => {
  const parsed = CreateTracker.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error);

  try {
    const data = parsed.data;
    const tracker = await prisma.tracker.create({
      data: { ...data, userId: req.user.id },
      include: { episode: true, map: true, user: true }
    });

    // ✅ Emit Socket.io event for real-time updates
    if (req.io) {
      console.log('[REST API] Broadcasting tracker:created:global event:', tracker.id);
      req.io.emit('tracker:created:global', tracker);
    }

    res.json(tracker);
  } catch (err) {
    console.error('Error creating tracker:', err);
    res.status(500).json({ error: 'Failed to create tracker' });
  }
});

// ✅ Restricted: Update tracker (EDITOR, ADMIN)
router.patch('/trackers/:id', authRequired, authorizeRole('EDITOR', 'ADMIN'), async (req, res) => {
  const id = Number(req.params.id);
  const parsed = UpdateTracker.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error);

  try {
    const tracker = await prisma.tracker.update({
      where: { id },
      data: parsed.data,
      include: { episode: true, map: true, user: true }
    });

    // ✅ Emit Socket.io event for real-time updates
    if (req.io) {
      console.log('[REST API] Broadcasting tracker:changed:global event:', tracker.id);
      req.io.emit('tracker:changed:global', tracker);
    }

    res.json(tracker);
  } catch (err) {
    console.error('Error updating tracker:', err);
    res.status(500).json({ error: 'Failed to update tracker' });
  }
});

// ✅ Restricted: Delete tracker (ADMIN only)
router.delete('/trackers/:id', authRequired, authorizeRole('ADMIN'), async (req, res) => {
  const id = Number(req.params.id);
  try {
    await prisma.tracker.delete({ where: { id } });

    // ✅ Emit Socket.io event for real-time updates
    if (req.io) {
      console.log('[REST API] Broadcasting tracker:deleted:global event:', id);
      req.io.emit('tracker:deleted:global', { id });
    }

    res.json({ ok: true });
  } catch (err) {
    console.error('Error deleting tracker:', err);
    res.status(500).json({ error: 'Failed to delete tracker' });
  }
});

export default router;