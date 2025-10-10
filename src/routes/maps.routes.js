import express from 'express';
import { prisma } from '../db.js';
import { authOptional, authRequired, authorizeRole } from '../middleware/auth.js';
import { UpsertMap } from '../utils/validators.js';

const router = express.Router();

// ✅ Public: list all maps (sorted by episode & level)
router.get('/maps', authOptional, async (req, res) => {
  try {
    const { episodeNumber } = req.query;  // ✅ Optional filter by episode
    
    const where = episodeNumber ? { episodeNumber: parseInt(episodeNumber) } : {};
    
    const maps = await prisma.map.findMany({
      where,
      include: { 
        episode: true,
        _count: {
          select: { trackers: true, favorites: true }  // ✅ Show counts
        }
      },
      orderBy: [
        { episodeNumber: 'asc' },  // ✅ Fixed field name
        { level: 'asc' }
      ],
    });
    res.json(maps);
  } catch (err) {
    console.error('Error fetching maps:', err);
    res.status(500).json({ error: 'Failed to fetch maps' });
  }
});

// ✅ Public: get user's favorite maps (requires auth)
router.get('/maps/favorites', authRequired, async (req, res) => {
  try {
    const favorites = await prisma.mapFavorite.findMany({
      where: { userId: req.user.id },
      include: {
        map: {
          include: { episode: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    res.json(favorites.map(fav => fav.map));  // ✅ Return just the maps
  } catch (err) {
    console.error('Error fetching favorites:', err);
    res.status(500).json({ error: 'Failed to fetch favorites' });
  }
});

// ✅ Restricted: create map (EDITOR, ADMIN)
router.post('/maps', authRequired, authorizeRole('EDITOR', 'ADMIN'), async (req, res) => {
  const parsed = UpsertMap.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error });

  try {
    const { name, episodeNumber, level } = parsed.data;

    // Verify episode exists
    const episode = await prisma.episode.findUnique({ 
      where: { episodeId: episodeNumber } 
    });
    if (!episode) {
      return res.status(400).json({ error: 'Episode not found' });
    }

    const map = await prisma.map.create({
      data: { name, episodeNumber, level },
      include: { episode: true }
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
    const { name, level, episodeNumber } = req.body;
    const data = {};
    
    if (name !== undefined) data.name = name;
    if (level !== undefined) data.level = parseInt(level);
    if (episodeNumber !== undefined) {
      // Verify episode exists
      const episode = await prisma.episode.findUnique({ 
        where: { episodeId: parseInt(episodeNumber) } 
      });
      if (!episode) {
        return res.status(400).json({ error: 'Episode not found' });
      }
      data.episodeNumber = parseInt(episodeNumber);
    }

    const updated = await prisma.map.update({
      where: { id: parseInt(req.params.id) },
      data,
      include: { episode: true }
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
    const mapId = parseInt(req.params.id);
    
    // Check if map has trackers
    const trackerCount = await prisma.tracker.count({ where: { mapId } });
    if (trackerCount > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete map with existing trackers' 
      });
    }

    await prisma.map.delete({ where: { id: mapId } });
    res.json({ message: 'Map deleted successfully' });
  } catch (err) {
    console.error('Error deleting map:', err);
    res.status(500).json({ error: 'Failed to delete map' });
  }
});

// ✅ User: add map to favorites
router.post('/maps/:id/favorite', authRequired, async (req, res) => {
  try {
    const mapId = parseInt(req.params.id);
    const userId = req.user.id;

    // Check if map exists
    const map = await prisma.map.findUnique({ where: { id: mapId } });
    if (!map) return res.status(404).json({ error: 'Map not found' });

    // Check if already favorited
    const existing = await prisma.mapFavorite.findUnique({
      where: {
        userId_mapId: { userId, mapId }
      }
    });

    if (existing) {
      return res.status(400).json({ error: 'Already favorited' });
    }

    const favorite = await prisma.mapFavorite.create({
      data: { userId, mapId },
      include: { map: { include: { episode: true } } }
    });

    res.json(favorite);
  } catch (err) {
    console.error('Error adding favorite:', err);
    res.status(500).json({ error: 'Failed to add favorite' });
  }
});

// ✅ User: remove map from favorites
router.delete('/maps/:id/favorite', authRequired, async (req, res) => {
  try {
    const mapId = parseInt(req.params.id);
    const userId = req.user.id;

    await prisma.mapFavorite.delete({
      where: {
        userId_mapId: { userId, mapId }
      }
    });

    res.json({ message: 'Favorite removed' });
  } catch (err) {
    console.error('Error removing favorite:', err);
    res.status(500).json({ error: 'Failed to remove favorite' });
  }
});

export default router;