import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config.js';

const ISSUER = 'blog';

export const signToken = () => jwt.sign({ role: 'admin' }, JWT_SECRET, { algorithm: 'HS256', expiresIn: '12h', issuer: ISSUER });

function verify(req) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return null;
  try {
    // pin the algorithm so a token can't pick its own ("alg: none" style attacks)
    const payload = jwt.verify(header.slice(7), JWT_SECRET, { algorithms: ['HS256'], issuer: ISSUER });
    return payload.role === 'admin' ? payload : null;
  } catch {
    return null;
  }
}

export function requireAuth(req, res, next) {
  const user = verify(req);
  if (!user) return res.status(401).json({ error: 'Authentication required' });
  req.user = user;
  next();
}

// Attaches req.user when a valid token is present, never rejects
export function optionalAuth(req, _res, next) {
  req.user = verify(req);
  next();
}
