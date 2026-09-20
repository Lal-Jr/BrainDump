import express from 'express';
import compression from 'compression';
import path from 'path';
import fs from 'fs/promises';
import { PORT, TRUST_PROXY, CLIENT_DIST, UPLOADS_DIR, IS_PROD } from './config.js';
import { securityHeaders, permissionsPolicy, limits } from './middleware/security.js';
import authRouter from './routes/auth.js';
import postsRouter from './routes/posts.js';
import commentsRouter from './routes/comments.js';
import reactionsRouter from './routes/reactions.js';
import analyticsRouter from './routes/analytics.js';
import mediaRouter from './routes/media.js';
import feedRouter from './routes/feed.js';
import { getPostBySlug } from './services/postStore.js';
import { isSlug } from './middleware/validate.js';
import { flushViews } from './services/analytics.js';

const app = express();
app.disable('x-powered-by');
app.set('trust proxy', TRUST_PROXY);

app.use(securityHeaders, permissionsPolicy, compression());
app.use(express.json({ limit: '1mb' }));

app.get('/healthz', (_req, res) => res.type('text').send('ok'));

// ---------- uploads: random names, never change, so they can be cached forever ----------
app.use(
  '/uploads',
  express.static(UPLOADS_DIR, {
    index: false,
    dotfiles: 'deny',
    maxAge: '365d',
    immutable: true,
    setHeaders: (res) => {
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
    },
  })
);

// ---------- API ----------
app.use('/api', limits.api);
app.use('/api/auth', authRouter);
app.use('/api/posts', postsRouter);
app.use('/api/comments', commentsRouter);
app.use('/api/reactions', reactionsRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/media', mediaRouter);
app.use('/api', (_req, res) => res.status(404).json({ error: 'Not found' })); // never the SPA shell
app.use(feedRouter);

// ---------- client build ----------
// Hashed files under /assets never change, so they cache for a year. HTML, the service worker and
// the manifest are always revalidated so a deploy is picked up immediately.
app.use(
  express.static(CLIENT_DIST, {
    index: false,
    setHeaders: (res, file) => {
      if (file.includes(`${path.sep}assets${path.sep}`)) res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      else if (/\.(html|webmanifest)$|sw\.js$|workbox-/.test(file)) res.setHeader('Cache-Control', 'no-cache');
      else res.setHeader('Cache-Control', 'public, max-age=604800');
    },
  })
);

const BASE = '/blog/'; // must match `base` in client/vite.config.js
const esc = (v = '') => String(v).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

let indexCache = null; // re-read only when the build changes
async function indexHtml() {
  const file = path.join(CLIENT_DIST, 'index.html');
  const { mtimeMs } = await fs.stat(file);
  if (indexCache?.mtimeMs !== mtimeMs) indexCache = { mtimeMs, html: await fs.readFile(file, 'utf-8') };
  return indexCache.html;
}

// The client is a SPA, so a link preview (Slack, X, iMessage) would show the generic page for every
// URL. For a published post, inject its own title/description; also start fetching its data while
// the browser is still parsing the page.
app.get('*', async (req, res, next) => {
  try {
    let html = await indexHtml();
    const slug = req.path.match(/^\/([a-z0-9][a-z0-9-]*)$/)?.[1];
    const head = [];

    if (req.path === '/' || req.path === '') {
      head.push(`<link rel="preload" href="${BASE}api/posts?published=true" as="fetch" crossorigin="anonymous" />`);
    } else if (req.path.startsWith('/admin')) {
      head.push('<meta name="robots" content="noindex, nofollow" />');
    } else if (slug && isSlug(slug)) {
      const post = await getPostBySlug(slug);
      if (post?.published) {
        const title = `${post.title} · Brain Dump`;
        html = html.replace(/<title>.*?<\/title>/, `<title>${esc(title)}</title>`);
        head.push(
          `<meta name="description" content="${esc(post.summary)}" />`,
          '<meta property="og:type" content="article" />',
          `<meta property="og:title" content="${esc(post.title)}" />`,
          `<meta property="og:description" content="${esc(post.summary)}" />`,
          '<meta name="twitter:card" content="summary" />',
          `<link rel="preload" href="${BASE}api/posts/view/${slug}" as="fetch" crossorigin="anonymous" />`
        );
      }
    }
    if (head.length) html = html.replace('</head>', `    ${head.join('\n    ')}\n  </head>`);

    res.set('Cache-Control', 'no-cache').type('html').send(html);
  } catch (e) {
    next(e);
  }
});

// ---------- errors: log the detail, tell the client only what it needs ----------
app.use((err, _req, res, _next) => {
  const status = err.status || (err.code === 'LIMIT_FILE_SIZE' || err.type === 'entity.too.large' ? 413 : err.type === 'entity.parse.failed' ? 400 : 500);
  if (status >= 500) console.error(err);
  const messages = { 400: 'Bad request', 413: 'That file or request is too large' };
  res.status(status).json({ error: status >= 500 ? 'Something went wrong' : err.expose === false ? messages[status] ?? 'Request failed' : err.message || messages[status] || 'Request failed' });
});

const server = app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT} (${IS_PROD ? 'production' : 'development'})`));

// Flush buffered view counts before Fly stops the machine
for (const signal of ['SIGTERM', 'SIGINT']) {
  process.on(signal, async () => {
    await flushViews().catch(() => {});
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(0), 5000).unref();
  });
}
