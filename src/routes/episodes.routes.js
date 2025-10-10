import express from 'express';
import { prisma } from '../db.js';
import { authOptional, authRequired, authorizeRole } from '../middleware/auth.js';
import { UpsertEpisode } from '../utils/validators.js';

const router = express.Router();

// ✅ Public: list all episodes (visitors can view)
router.get('/episodes', authOptional, async (_req, res) => {
  try {
    const episodes = await prisma.episode.findMany({
      orderBy: { episodeId: 'asc' },  // ✅ Sort by logical episodeId
      include: {
        _count: {
          select: { maps: true, trackers: true }  // ✅ Optional: show counts
        }
      }
    });
    res.json(episodes);
  } catch (err) {
    console.error('Error fetching episodes:', err);
    res.status(500).json({ error: 'Failed to fetch episodes' });
  }
});

// ✅ Public: get single episode with maps
router.get('/episodes/:episodeId', authOptional, async (req, res) => {
  try {
    const episodeId = parseInt(req.params.episodeId);
    const episode = await prisma.episode.findUnique({
      where: { episodeId },  // ✅ Use logical episodeId
      include: { 
        maps: {
          orderBy: { level: 'asc' }
        }
      }
    });
    
    if (!episode) return res.status(404).json({ error: 'Episode not found' });
    res.json(episode);
  } catch (err) {
    console.error('Error fetching episode:', err);
    res.status(500).json({ error: 'Failed to fetch episode' });
  }
});

// ✅ Restricted: create new episode (EDITOR, ADMIN)
router.post('/episodes', authRequired, authorizeRole('EDITOR', 'ADMIN'), async (req, res) => {
  const parsed = UpsertEpisode.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error });

  try {
    const { episodeId, name } = parsed.data;
    
    // Check if episodeId already exists
    const existing = await prisma.episode.findUnique({ where: { episodeId } });
    if (existing) {
      return res.status(400).json({ error: 'Episode number already exists' });
    }

    const ep = await prisma.episode.create({ 
      data: { episodeId, name }  // ✅ Include both fields
    });
    res.json(ep);
  } catch (err) {
    console.error('Error creating episode:', err);
    res.status(500).json({ error: 'Failed to create episode' });
  }
});

// ✅ Restricted: update episode (EDITOR, ADMIN)
router.patch('/episodes/:episodeId', authRequired, authorizeRole('EDITOR', 'ADMIN'), async (req, res) => {
  try {
    const episodeId = parseInt(req.params.episodeId);
    const { name } = req.body;
    
    if (!name) return res.status(400).json({ error: 'Missing name' });

    const ep = await prisma.episode.update({
      where: { episodeId },  // ✅ Use logical episodeId
      data: { name },
    });
    res.json(ep);
  } catch (err) {
    console.error('Error updating episode:', err);
    res.status(500).json({ error: 'Failed to update episode' });
  }
});

// ✅ Restricted: delete episode (ADMIN only)
router.delete('/episodes/:episodeId', authRequired, authorizeRole('ADMIN'), async (req, res) => {
  try {
    const episodeId = parseInt(req.params.episodeId);
    
    // Check if episode has maps or trackers
    const episode = await prisma.episode.findUnique({
      where: { episodeId },
      include: {
        _count: {
          select: { maps: true, trackers: true }
        }
      }
    });

    if (!episode) return res.status(404).json({ error: 'Episode not found' });

    if (episode._count.maps > 0 || episode._count.trackers > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete episode with existing maps or trackers' 
      });
    }

    await prisma.episode.delete({ where: { episodeId } });
    res.json({ message: 'Episode deleted successfully' });
  } catch (err) {
    console.error('Error deleting episode:', err);
    res.status(500).json({ error: 'Failed to delete episode' });
  }
});

export default router;