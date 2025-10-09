import express from 'express';
import { prisma } from '../db.js';
const router = express.Router();

router.get('/maps', async (_, res) => {
  const maps = await prisma.map.findMany({
    include: { episode: true },
    orderBy: [{ episodeId: 'asc' }, { level: 'asc' }]
  });
  res.json(maps);
});

router.post('/maps', async (req, res) => {
  const { name, episodeId, level } = req.body;
  if (!name || !episodeId) return res.status(400).json({ error: 'Missing fields' });
  const map = await prisma.map.create({
    data: { name, episodeId: parseInt(episodeId), level: parseInt(level) }
  });
  res.json(map);
});

router.patch('/maps/:id', async (req, res) => {
  const { name, level, favourite } = req.body;
  const updated = await prisma.map.update({
    where: { id: parseInt(req.params.id) },
    data: { name, level, favourite }
  });
  res.json(updated);
});

router.delete('/maps/:id', async (req, res) => {
  await prisma.map.delete({ where: { id: parseInt(req.params.id) } });
  res.json({ message: 'Deleted' });
});

export default router;
