import express from 'express';
import { prisma } from '../db.js';
import { authOptional, authRequired, authorizeRole } from '../middleware/auth.js';

const router = express.Router();

// ✅ Public: list all maps (sorted by episode & level)
router.get('/maps', authOptional, async (_req, res) => {
  try {
    const maps = await prisma.map.findMany({
      include: { episode: true },
      orderBy: [{ episodeId: 'asc' }, { level: 'asc' }],
    });
    res.json(maps);
  } catch (err) {
    console.error('Error fetching maps:', err);
    res.status(500).json({ error: 'Failed to fetch maps' });
  }
});

// ✅ Restricted: create map (EDITOR, ADMIN)
router.post('/maps', authRequired, authorizeRole('EDITOR', 'ADMIN'), async (req, res) => {
  try {
    const { name, episodeId, level } = req.body;
    if (!name || !episodeId) return res.status(400).json({ error: 'Missing fields' });

    const map = await prisma.map.create({
      data: { name, episodeId: parseInt(episodeId), level: parseInt(level) },
    });
    res.json(map);
  } catch (err) {
    console.error('Error creating map:', err);
    res.status(500).json({ error: 'Failed to create map' });
  }
});

// ✅ Restricted: update map (EDITOR, ADMIN)
router.patch('/maps/:id', authRequired, authorizeRole('EDITOR', 'ADMIN'), async (req, res) => {
  try {
    const { name, level, favourite } = req.body;
    const updated = await prisma.map.update({
      where: { id: parseInt(req.params.id) },
      data: { name, level, favourite },
    });
    res.json(updated);
  } catch (err) {
    console.error('Error updating map:', err);
    res.status(500).json({ error: 'Failed to update map' });
  }
});

// ✅ Restricted: delete map (ADMIN only)
router.delete('/maps/:id', authRequired, authorizeRole('ADMIN'), async (req, res) => {
  try {
    await prisma.map.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ message: 'Deleted' });
  } catch (err) {
    console.error('Error deleting map:', err);
    res.status(500).json({ error: 'Failed to delete map' });
  }
});

export default router;