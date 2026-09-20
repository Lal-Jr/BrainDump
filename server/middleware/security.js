import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

// Content Security Policy: scripts only from this origin (no inline script), styles/fonts from
// Google Fonts, images from here plus data:/blob: (editor previews), media embeds only from the
// video hosts the markdown renderer allows.
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    useDefaults: false,
    directives: {
      'default-src': ["'self'"],
      'script-src': ["'self'"],
      'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      'font-src': ["'self'", 'https://fonts.gstatic.com'],
      'img-src': ["'self'", 'data:', 'blob:'],
      'media-src': ["'self'", 'blob:'],
      'connect-src': ["'self'"],
      'frame-src': ["'self'", 'https://www.youtube-nocookie.com', 'https://player.vimeo.com'],
      'worker-src': ["'self'"],
      'manifest-src': ["'self'"],
      'object-src': ["'none'"],
      'base-uri': ["'self'"],
      'form-action': ["'self'"],
      'frame-ancestors': ["'none'"],
    },
  },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  crossOriginEmbedderPolicy: false, // would block the cross-origin fonts/video embeds
});

// The voice recorder needs the microphone; nothing else needs a sensitive capability
export const permissionsPolicy = (_req, res, next) => {
  res.setHeader('Permissions-Policy', 'microphone=(self), camera=(), geolocation=(), payment=(), usb=()');
  next();
};

const limiter = ({ windowMs, max, message, skipSuccessfulRequests = false }) =>
  rateLimit({
    windowMs,
    limit: max,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    skipSuccessfulRequests,
    message: { error: message },
  });

const minutes = (n) => n * 60 * 1000;

export const limits = {
  // everything under /api: a broad ceiling against scraping and floods
  api: limiter({ windowMs: minutes(1), max: 300, message: 'Too many requests. Slow down a little.' }),
  // wrong passwords only: successful logins don't count against you
  login: limiter({ windowMs: minutes(15), max: 8, skipSuccessfulRequests: true, message: 'Too many login attempts. Try again in a few minutes.' }),
  comment: limiter({ windowMs: minutes(10), max: 6, message: 'Too many comments. Please wait a few minutes.' }),
  react: limiter({ windowMs: minutes(10), max: 40, message: 'Too many reactions. Please wait a moment.' }),
  hit: limiter({ windowMs: minutes(10), max: 120, message: 'Too many requests.' }),
  upload: limiter({ windowMs: minutes(10), max: 40, message: 'Too many uploads. Please wait a few minutes.' }),
  ai: limiter({ windowMs: minutes(10), max: 20, message: 'Too many AI requests. Please wait a few minutes.' }),
};
