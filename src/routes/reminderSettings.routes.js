import express from 'express';
import { prisma } from '../db.js';
import { authRequired } from '../middleware/auth.js';
import { z } from 'zod';

const router = express.Router();

// Validation schema
const ReminderSettingsSchema = z.object({
  enabled: z.boolean(),
  volume: z.number().min(0).max(1),
  rate: z.number().min(0.5).max(2),
  pitch: z.number().min(0.5).max(2)
});

// Get user's reminder settings
router.get('/reminder-settings', authRequired, async (req, res) => {
  try {
    let settings = await prisma.reminderSettings.findUnique({
      where: { userId: req.user.id }
    });

    // Create default settings if none exist
    if (!settings) {
      settings = await prisma.reminderSettings.create({
        data: {
          userId: req.user.id,
          enabled: true,
          volume: 1.0,
          rate: 1.0,
          pitch: 1.0
        }
      });
    }

    res.json(settings);
  } catch (err) {
    console.error('Error fetching reminder settings:', err);
    res.status(500).json({ error: 'Failed to fetch reminder settings' });
  }
});

// Save/update user's reminder settings
router.post('/reminder-settings', authRequired, async (req, res) => {
  const parsed = ReminderSettingsSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error);

  try {
    const settings = await prisma.reminderSettings.upsert({
      where: { userId: req.user.id },
      create: {
        userId: req.user.id,
        ...parsed.data
      },
      update: parsed.data
    });

    res.json(settings);
  } catch (err) {
    console.error('Error saving reminder settings:', err);
    res.status(500).json({ error: 'Failed to save reminder settings' });
  }
});

export default router;
