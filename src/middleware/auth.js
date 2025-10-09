import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config.js';

/**
 * ✅ Allows visitors (unauthenticated) but decodes token if available
 */
export function authOptional(req, _res, next) {
  const hdr = req.headers.authorization || '';
  if (hdr.startsWith('Bearer ')) {
    try {
      req.user = jwt.verify(hdr.slice(7), JWT_SECRET);
    } catch {
      req.user = null;
    }
  } else {
    req.user = null;
  }
  next();
}

/**
 * ✅ Requires valid JWT
 */
export function authRequired(req, res, next) {
  const hdr = req.headers.authorization || '';
  if (!hdr.startsWith('Bearer '))
    return res.status(401).json({ error: 'Missing token' });

  try {
    req.user = jwt.verify(hdr.slice(7), JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

/**
 * ✅ Role-based access control middleware
 * Usage: router.post('/something', authRequired, authorizeRole('ADMIN', 'EDITOR'), handler)
 */
export function authorizeRole(...roles) {
  return (req, res, next) => {
    if (!req.user)
      return res.status(401).json({ error: 'Unauthorized' });
    if (!roles.includes(req.user.role))
      return res.status(403).json({ error: 'Forbidden: insufficient privileges' });
    next();
  };
}

/**
 * ✅ Simple verify middleware (used for profile routes)
 */
export function verifyToken(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer '))
    return res.status(401).json({ error: 'Missing token' });

  const token = header.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}
