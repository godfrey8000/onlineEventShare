import express from 'express';
import { prisma } from '../db.js';
import { authRequired } from '../middleware/auth.js';
import { CreateTracker, UpdateTracker } from '../utils/validators.js';

const router = express.Router();

// List trackers with simple sorting (status, level, nickname)
router.get('/trackers', async (req, res) => {
  const { sortBy = 'updatedAt', order = 'desc' } = req.query;
  const allowed = ['status', 'level', 'nickname', 'createdAt', 'updatedAt'];
  const sort = allowed.includes(sortBy) ? sortBy : 'updatedAt';
  const asc = order === 'asc';
  const trackers = await prisma.tracker.findMany({
    orderBy: { [sort]: asc ? 'asc' : 'desc' },
    include: { episode: true, map: true, channel: true, user: true }
  });
  res.json(trackers);
});

router.post('/trackers', authRequired, async (req, res) => {
  const parsed = CreateTracker.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error);
  const data = parsed.data;
  const tracker = await prisma.tracker.create({
    data: { ...data, createdBy: req.user.id }
  });
  res.json(tracker);
});

router.patch('/trackers/:id', authRequired, async (req, res) => {
  const id = Number(req.params.id);
  const parsed = UpdateTracker.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error);
  const tracker = await prisma.tracker.update({ where: { id }, data: parsed.data });
  res.json(tracker);
});

router.delete('/trackers/:id', authRequired, async (req, res) => {
  const id = Number(req.params.id);
  await prisma.tracker.delete({ where: { id } });
  res.json({ ok: true });
});

export default router;