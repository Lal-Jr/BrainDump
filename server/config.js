// Single source of truth for environment, paths and limits.
// Fails fast in production if the secrets that protect the admin are missing.
import 'dotenv/config';
import crypto from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';

const here = path.dirname(fileURLToPath(import.meta.url));

export const IS_PROD = process.env.NODE_ENV === 'production';
export const PORT = Number(process.env.PORT) || 3001;

// Everything the app writes lives under DATA_DIR (a mounted volume in production)
export const DATA_DIR = process.env.DATA_DIR || here;
export const POSTS_DIR = path.join(DATA_DIR, 'posts');
export const UPLOADS_DIR = path.join(DATA_DIR, 'uploads');
export const COMMENTS_DIR = path.join(DATA_DIR, 'comments');
export const REACTIONS_DIR = path.join(DATA_DIR, 'reactions');
export const ANALYTICS_DIR = path.join(DATA_DIR, 'analytics');
export const CLIENT_DIST = path.join(here, '..', 'client', 'dist');

// Public origin of the portfolio (used for RSS/sitemap links), e.g. https://harishlal.dev
export const SITE_URL = (process.env.SITE_URL || '').replace(/\/$/, '');

// How many reverse proxies sit in front of this server (Fly's edge, plus the portfolio's
// rewrite when the blog is reached through it). Controls how req.ip is derived, and so
// the rate limits. Override with TRUST_PROXY if the topology changes.
export const TRUST_PROXY = Number(process.env.TRUST_PROXY ?? 2);

function requireSecret(name, { minLength = 1, ephemeral } = {}) {
  const value = process.env[name];
  if (value && value.length >= minLength) return value;
  if (IS_PROD) {
    console.error(`FATAL: ${name} must be set in production${minLength > 1 ? ` (at least ${minLength} characters)` : ''}.`);
    process.exit(1);
  }
  if (ephemeral) {
    console.warn(`WARN: ${name} is not set; using a random one for this run only.`);
    return ephemeral();
  }
  return null;
}

export const JWT_SECRET = requireSecret('JWT_SECRET', { minLength: 32, ephemeral: () => crypto.randomBytes(48).toString('hex') });
// null in dev when unset: login is then disabled rather than defaulting to "admin"
export const ADMIN_PASSWORD = requireSecret('ADMIN_PASSWORD', { minLength: 8 });
export const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

export const CATEGORIES = {
  thoughts: 'Thoughts',
  'how-i-work': 'How I work',
  engineering: 'Engineering',
  research: 'Research',
};
export const DEFAULT_CATEGORY = 'thoughts';

export const LIMITS = {
  title: 140,
  summary: 300,
  tags: 8,
  tagLength: 30,
  contentChars: 200_000,
  commentName: 50,
  commentText: 2000,
  imageBytes: 12 * 1024 * 1024,
  videoBytes: 25 * 1024 * 1024,
  pdfBytes: 15 * 1024 * 1024,
};
