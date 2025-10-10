import express from 'express';
import { prisma } from '../db.js';
import { authOptional, authRequired, authorizeRole } from '../middleware/auth.js';

const router = express.Router();

// ✅ Get chat history with pagination
router.get('/chat/history', authOptional, async (req, res) => {
  try {
    const { limit = 100, before } = req.query;
    
    // Limit to last 1000 messages or 7 days (whichever is less)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    const where = {
      createdAt: { gte: sevenDaysAgo }
    };
    
    // Pagination: load messages before a certain timestamp
    if (before) {
      where.createdAt.lt = new Date(before);
    }

    const messages = await prisma.chatMessage.findMany({
      where,
      take: Math.min(parseInt(limit) || 100, 1000),  // Max 1000 per request
      orderBy: { createdAt: 'desc' },
      include: { 
        user: { 
          select: { 
            id: true,      // ✅ Include id
            username: true, // ✅ Include username
            nickname: true, 
            role: true 
          } 
        } 
      },
    });
    
    res.json(messages.reverse()); // ✅ Return oldest first
  } catch (err) {
    console.error('Error fetching chat history:', err);
    res.status(500).json({ error: 'Failed to fetch chat history' });
  }
});

// ✅ Get message count and stats
router.get('/chat/stats', authOptional, async (_req, res) => {
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    const [totalCount, recentCount] = await Promise.all([
      prisma.chatMessage.count(),
      prisma.chatMessage.count({
        where: { createdAt: { gte: sevenDaysAgo } }
      })
    ]);

    res.json({
      total: totalCount,
      recent: recentCount,
      oldestRetained: sevenDaysAgo
    });
  } catch (err) {
    console.error('Error fetching chat stats:', err);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// ✅ Post new message (requires CHATTER or higher)
router.post('/chat/send', authRequired, authorizeRole('CHATTER', 'EDITOR', 'ADMIN'), async (req, res) => {
  try {
    const { content } = req.body;
    
    // Validate content
    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Message cannot be empty' });
    }

    if (content.length > 1000) {
      return res.status(400).json({ error: 'Message too long (max 1000 characters)' });
    }

    const msg = await prisma.chatMessage.create({
      data: { 
        content: content.trim(), 
        userId: req.user.id 
      },
      include: { 
        user: { 
          select: { 
            id: true,
            username: true,
            nickname: true, 
            role: true 
          } 
        } 
      },
    });

    // Note: Real-time broadcast is handled by socket.io
    res.json(msg);
  } catch (err) {
    console.error('Error sending message:', err);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// ✅ Delete message (ADMIN only or message author)
router.delete('/chat/:id', authRequired, async (req, res) => {
  try {
    const messageId = parseInt(req.params.id);
    
    // Get message to check ownership
    const message = await prisma.chatMessage.findUnique({
      where: { id: messageId }
    });

    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    // Check permission: ADMIN or message author
    if (message.userId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Permission denied' });
    }

    await prisma.chatMessage.delete({ where: { id: messageId } });

    // Note: Emit socket event for real-time deletion
    // io.emit('chat:deleted', { id: messageId })

    res.json({ message: 'Message deleted' });
  } catch (err) {
    console.error('Error deleting message:', err);
    res.status(500).json({ error: 'Failed to delete message' });
  }
});

// ✅ Clear old messages (ADMIN only - for maintenance)
router.post('/chat/cleanup', authRequired, authorizeRole('ADMIN'), async (_req, res) => {
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    const result = await prisma.chatMessage.deleteMany({
      where: {
        createdAt: { lt: sevenDaysAgo }
      }
    });

    res.json({ 
      message: 'Cleanup completed', 
      deleted: result.count 
    });
  } catch (err) {
    console.error('Error cleaning up messages:', err);
    res.status(500).json({ error: 'Failed to cleanup' });
  }
});

export default router;