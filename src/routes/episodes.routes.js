import express from 'express';
import { prisma } from '../db.js';
const router = express.Router();

router.get('/episodes', async (_, res) => {
  const episodes = await prisma.episode.findMany({ orderBy: { id: 'asc' } });
  res.json(episodes);
});

router.post('/episodes', async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Missing name' });
  const ep = await prisma.episode.create({ data: { name } });
  res.json(ep);
});

router.patch('/episodes/:id', async (req, res) => {
  const ep = await prisma.episode.update({
    where: { id: parseInt(req.params.id) },
    data: { name: req.body.name }
  });
  res.json(ep);
});

router.delete('/episodes/:id', async (req, res) => {
  await prisma.episode.delete({ where: { id: parseInt(req.params.id) } });
  res.json({ message: 'Deleted' });
});

export default router;
