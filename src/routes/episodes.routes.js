import express from 'express';
import { prisma } from '../db.js';
import { authOptional, authRequired, authorizeRole } from '../middleware/auth.js';

const router = express.Router();

// ✅ Public: list all episodes (visitors can view)
router.get('/episodes', authOptional, async (_req, res) => {
  try {
    const episodes = await prisma.episode.findMany({
      orderBy: { id: 'asc' },
    });
    res.json(episodes);
  } catch (err) {
    console.error('Error fetching episodes:', err);
    res.status(500).json({ error: 'Failed to fetch episodes' });
  }
});

// ✅ Restricted: create new episode (EDITOR, ADMIN)
router.post('/episodes', authRequired, authorizeRole('EDITOR', 'ADMIN'), async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'Missing name' });

    const ep = await prisma.episode.create({ data: { name } });
    res.json(ep);
  } catch (err) {
    console.error('Error creating episode:', err);
    res.status(500).json({ error: 'Failed to create episode' });
  }
});

// ✅ Restricted: update episode (EDITOR, ADMIN)
router.patch('/episodes/:id', authRequired, authorizeRole('EDITOR', 'ADMIN'), async (req, res) => {
  try {
    const { name } = req.body;
    const ep = await prisma.episode.update({
      where: { id: parseInt(req.params.id) },
      data: { name },
    });
    res.json(ep);
  } catch (err) {
    console.error('Error updating episode:', err);
    res.status(500).json({ error: 'Failed to update episode' });
  }
});

// ✅ Restricted: delete episode (ADMIN only)
router.delete('/episodes/:id', authRequired, authorizeRole('ADMIN'), async (req, res) => {
  try {
    await prisma.episode.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ message: 'Deleted' });
  } catch (err) {
    console.error('Error deleting episode:', err);
    res.status(500).json({ error: 'Failed to delete episode' });
  }
});

export default router;