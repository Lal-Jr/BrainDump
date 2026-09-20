// Small, dependency-free input validators. Anything that reaches the filesystem or
// frontmatter must pass through one of these first.
import { CATEGORIES, DEFAULT_CATEGORY, LIMITS } from '../config.js';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SLUG = /^[a-z0-9][a-z0-9-]{0,99}$/;

export const isUuid = (v) => typeof v === 'string' && UUID.test(v);
export const isSlug = (v) => typeof v === 'string' && SLUG.test(v);

// Express param guard: reject anything that isn't a UUID before it can reach a file path
export const uuidParam = (name) => (req, res, next) => {
  if (!isUuid(req.params[name])) return res.status(400).json({ error: 'Invalid id' });
  next();
};

// Trim, drop control characters (keeping newlines/tabs), cap length
export function cleanText(value, max, { multiline = false } = {}) {
  if (typeof value !== 'string') return '';
  // eslint-disable-next-line no-control-regex
  const stripped = value.replace(multiline ? /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g : /[\u0000-\u001F\u007F]/g, '');
  return stripped.trim().slice(0, max);
}

export function cleanTags(value) {
  const list = Array.isArray(value) ? value : typeof value === 'string' ? value.split(',') : [];
  const seen = new Set();
  const out = [];
  for (const raw of list) {
    const tag = cleanText(String(raw), LIMITS.tagLength).toLowerCase();
    if (tag && !seen.has(tag)) {
      seen.add(tag);
      out.push(tag);
    }
    if (out.length >= LIMITS.tags) break;
  }
  return out;
}

export const cleanCategory = (value) => (Object.hasOwn(CATEGORIES, value) ? value : DEFAULT_CATEGORY);

// Only same-origin upload paths are accepted as a cover image
export const cleanCover = (value) => (typeof value === 'string' && /^\/uploads\/[\w-]+\.(webp|jpe?g|png|gif)$/i.test(value) ? value : '');

// The only fields an admin edit may change; everything else (id, slug, dates, published)
// is controlled by the server.
export function pickPostUpdate(body = {}) {
  const out = {};
  if ('title' in body) out.title = cleanText(body.title, LIMITS.title);
  if ('summary' in body) out.summary = cleanText(body.summary, LIMITS.summary);
  if ('content' in body) out.content = cleanText(body.content, LIMITS.contentChars, { multiline: true });
  if ('tags' in body) out.tags = cleanTags(body.tags);
  if ('category' in body) out.category = cleanCategory(body.category);
  if ('cover' in body) out.cover = cleanCover(body.cover);
  return out;
}
