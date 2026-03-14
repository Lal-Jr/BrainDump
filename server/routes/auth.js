import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const router = Router();

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';

// On first startup, hash the admin password from .env
let hashedPassword = null;
async function getHashedPassword() {
  if (!hashedPassword) {
    const raw = process.env.ADMIN_PASSWORD || 'admin';
    hashedPassword = await bcrypt.hash(raw, 10);
  }
  return hashedPassword;
}

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { password } = req.body;
    if (!password) return res.status(400).json({ error: 'Password required' });

    const hash = await getHashedPassword();
    const valid = await bcrypt.compare(password, hash);
    if (!valid) return res.status(401).json({ error: 'Wrong password' });

    const token = jwt.sign({ role: 'admin' }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/auth/verify — check if token is still valid
router.get('/verify', (req, res) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ valid: false });
  }
  try {
    jwt.verify(header.split(' ')[1], JWT_SECRET);
    res.json({ valid: true });
  } catch {
    res.status(401).json({ valid: false });
  }
});

export default router;
