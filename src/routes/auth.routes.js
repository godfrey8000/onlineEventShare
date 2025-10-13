import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../db.js';
import { JWT_SECRET } from '../config.js';
import { verifyToken } from '../middleware/auth.js';
import { RegisterSchema, LoginSchema } from '../utils/validators.js';

const router = express.Router();

// ✅ Helper: role authorization middleware
function authorizeRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    if (!roles.includes(req.user.role))
      return res.status(403).json({ error: 'Forbidden' });
    next();
  };
}

// ✅ One-time registration (first admin)
router.post('/register-once', async (req, res) => {
  const body = RegisterSchema.extend({ nickname: z.string().min(2).max(32) }).safeParse(req.body);
  if (!body.success) return res.status(400).json(body.error);

  const existing = await prisma.user.findFirst();
  if (existing) return res.status(403).json({ error: 'Registration locked' });

  const { username, password, nickname } = body.data;
  const hashed = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: { username, password: hashed, nickname, role: 'ADMIN' }, // first user = ADMIN
  });

  const token = jwt.sign(
    { id: user.id, username, nickname, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
  res.json({ token, role: user.role });
});

// ✅ Normal registration (default VIEWER)
router.post('/register', async (req, res) => {
  const body = RegisterSchema.extend({ nickname: z.string().min(2).max(32) }).safeParse(req.body);
  if (!body.success) return res.status(400).json(body.error);

  const { username, password, nickname } = body.data;
  const existing = await prisma.user.findUnique({ where: { username } });
  if (existing) return res.status(400).json({ error: 'Username already exists' });

  const hashed = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { username, password: hashed, nickname, role: 'VIEWER' },
  });

  const token = jwt.sign(
    { id: user.id, username, nickname, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.json({ token, role: user.role });
});

// ✅ Login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) return res.status(400).json({ error: 'Invalid credentials' });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(400).json({ error: 'Invalid credentials' });

    const token = jwt.sign(
      { id: user.id, username: user.username, nickname: user.nickname, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    res.json({ token, role: user.role });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// ✅ Profile update
router.patch('/profile', verifyToken, async (req, res) => {
  try {
    const { nickname, password } = req.body;
    const data = {};

    if (nickname) data.nickname = nickname.trim();
    if (password && password.length > 0) {
      data.password = await bcrypt.hash(password, 10);
    }

    const updated = await prisma.user.update({
      where: { id: req.user.id },
      data,
      select: {
        id: true,
        username: true,
        nickname: true,
        role: true
      }
    });

    // ✅ Emit Socket.io event if nickname was updated
    if (nickname && req.io) {
      console.log('[REST API] Broadcasting user:updated event for user:', updated.id);
      req.io.emit('user:updated', updated);
    }

    res.json({ message: 'Profile updated', user: updated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// ✅ Admin: get all users
router.get('/users', verifyToken, authorizeRole('ADMIN'), async (req, res) => {
  const users = await prisma.user.findMany({
    select: { id: true, username: true, nickname: true, role: true, createdAt: true },
  });
  res.json(users);
});

// ✅ Admin: change user role
router.patch('/users/:id/role', verifyToken, authorizeRole('ADMIN'), async (req, res) => {
  const { role } = req.body;
  const validRoles = ['VIEWER', 'CHATTER', 'EDITOR', 'ADMIN'];
  if (!validRoles.includes(role)) return res.status(400).json({ error: 'Invalid role' });

  const updated = await prisma.user.update({
    where: { id: Number(req.params.id) },
    data: { role },
  });

  res.json({ message: 'Role updated', user: updated });
});

export default router;