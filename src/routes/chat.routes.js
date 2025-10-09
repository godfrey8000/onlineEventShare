import express from 'express';
import { prisma } from '../db.js';
import { authOptional, authRequired, authorizeRole } from '../middleware/auth.js';

const router = express.Router();

// ✅ Get last 50 messages
router.get('/chat/history', authOptional, async (_req, res) => {
  try {
    const messages = await prisma.chatMessage.findMany({
      take: 50,
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { nickname: true, role: true } } },
    });
    res.json(messages.reverse()); // newest last
  } catch (err) {
    console.error('Error fetching chat history:', err);
    res.status(500).json({ error: 'Failed to fetch chat history' });
  }
});

// ✅ Post new message (requires CHATTER or higher)
router.post('/chat/send', authRequired, authorizeRole('CHATTER', 'EDITOR', 'ADMIN'), async (req, res) => {
  try {
    const { content } = req.body;
    if (!content || !content.trim()) return res.status(400).json({ error: 'Empty message' });

    const msg = await prisma.chatMessage.create({
      data: { content: content.trim(), userId: req.user.id },
      include: { user: { select: { nickname: true, role: true } } },
    });

    // Broadcast handled in socket layer
    res.json(msg);
  } catch (err) {
    console.error('Error sending message:', err);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

export default router;