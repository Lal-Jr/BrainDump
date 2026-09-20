import { Router } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { ADMIN_PASSWORD } from '../config.js';
import { limits } from '../middleware/security.js';
import { signToken, optionalAuth } from '../middleware/auth.js';

const router = Router();

// Hash once at boot, then compare with bcrypt on every attempt (constant-time)
const passwordHash = ADMIN_PASSWORD ? bcrypt.hashSync(ADMIN_PASSWORD, 12) : null;
// Compared against when the password is wrong-shaped, so response time doesn't leak anything
const decoyHash = bcrypt.hashSync(crypto.randomBytes(16).toString('hex'), 12);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

router.post('/login', limits.login, async (req, res, next) => {
  try {
    if (!passwordHash) return res.status(503).json({ error: 'Admin login is not configured' });
    const { password } = req.body ?? {};
    const ok = await bcrypt.compare(typeof password === 'string' ? password.slice(0, 200) : '', typeof password === 'string' ? passwordHash : decoyHash);
    if (!ok) {
      await sleep(400); // slows guessing on top of the rate limit
      return res.status(401).json({ error: 'Wrong password' });
    }
    res.json({ token: signToken() });
  } catch (e) {
    next(e);
  }
});

router.get('/verify', optionalAuth, (req, res) => {
  res.set('Cache-Control', 'no-store');
  res.status(req.user ? 200 : 401).json({ valid: !!req.user });
});

export default router;
