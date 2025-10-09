import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../db.js';
import { JWT_SECRET } from '../config.js';
import { verifyToken } from '../middleware/auth.js';
import { RegisterSchema, LoginSchema } from '../utils/validators.js';


const router = express.Router();


// one-time registration (first user)
router.post('/register-once', async (req, res) => {
const body = RegisterSchema.extend({ nickname: z.string().min(2).max(32) }).safeParse(req.body);
if (!body.success) return res.status(400).json(body.error);
const existing = await prisma.user.findFirst();
if (existing) return res.status(403).json({ error: 'Registration locked' });


const { username, password, nickname } = body.data;
const hashed = await bcrypt.hash(password, 10);
const user = await prisma.user.create({ data: { username, password: hashed, nickname } });
const token = jwt.sign({ id: user.id, username, nickname }, JWT_SECRET, { expiresIn: '7d' });
res.json({ token });
});


router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) return res.status(400).json({ error: 'Invalid credentials' });

    // ✅ Compare hashed password
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(400).json({ error: 'Invalid credentials' });

    const token = jwt.sign(
      { id: user.id, username: user.username, nickname: user.nickname },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    res.json({ token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Login failed' });
  }
});

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
      data
    });

    res.json({ message: 'Profile updated', user: updated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});




export default router;