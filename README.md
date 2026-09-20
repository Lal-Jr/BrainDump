# Brain Dump

The blog behind the portfolio: thoughts, how I work, engineering notes and research. It lives at
`/blog` on the portfolio (the portfolio proxies to this app) and can also run on its own.

Write a post by voice, from rough notes, or from a blank page. An AI pass turns voice/notes into a
draft; you edit it, add media, and publish.

## What's in it

**Reading**
- Feed with categories (Thoughts, How I work, Engineering, Research), tag filters, search (press `/`), and "load more"
- Post pages built for reading: one column, an "On this page" outline, heading deep links, copy buttons on code, reading progress
- Threaded comments (with a remembered name), one-tap reactions, share/copy link, related posts
- RSS (`/blog/rss.xml`) and a sitemap; per-post titles/descriptions for link previews

**Writing (admin at `/blog/admin`)**
- Voice or text to draft, blank drafts, and a markdown editor with live preview and shortcuts (Ctrl/Cmd+S)
- Media: upload, drag-and-drop or paste photos, video and PDFs; cover images; YouTube/Vimeo embeds
- Dashboard with views, comment counts, publishing and comment moderation
- Installable as an app (voice notes from a phone)

## Run it

```bash
npm run install:all
cp server/.env.example server/.env    # then fill it in
npm run dev                            # API on :3001, client on :5173 (open /blog/)
```

Production: `npm run build && npm start` (see the `Dockerfile` and `fly.toml`).

## How it's built

```
server/
  index.js              app wiring: headers, compression, caching, SPA fallback with per-post meta
  config.js             env + limits (fails fast in production without real secrets)
  middleware/           security (CSP, rate limits), auth (JWT), validation
  routes/               posts, comments, reactions, media, auth, analytics, feed (RSS/sitemap)
  services/             postStore (cached markdown files), comments, reactions, media, analytics, ai
client/src/
  pages/                Feed, Post, admin/{Dashboard,Create,Edit,Login}
  components/           public/ (reading UI), admin/ (editor, recorder), ui/ (doodles, links, labels)
  lib/                  api (stale-while-revalidate cache), markdown (sanitizing renderer)
```

Posts are markdown files with YAML frontmatter under `DATA_DIR/posts`: easy to back up and edit by hand.

## Performance

- Posts are held in memory (rebuilt on write or after 30 s), not re-parsed per request
- Feed load is ~64 KB of JavaScript; the markdown/highlighting code (~80 KB) loads only on a post page, and is warmed when you hover a link
- API responses carry `Cache-Control` + `ETag` (304s); hashed assets are `immutable` for a year; uploads are immutable
- The client caches the post list (memory + sessionStorage) and revalidates in the background, so navigation and reloads are instant
- gzip everywhere; images are re-encoded to WebP (max 1920 px) on upload; page transitions use the View Transitions API
- View counts are buffered in memory and flushed in batches

## Security

- **Uploads:** file type decided by magic bytes (never the filename or Content-Type); SVG/HTML rejected; images re-encoded (strips EXIF/GPS); random filenames; size limits per type
- **Rendering:** post HTML is sanitized with DOMPurify (allow-list), embeds limited to YouTube/Vimeo and own uploads; comments are rendered as plain text
- **Headers:** strict CSP (no inline script), HSTS, `nosniff`, `frame-ancestors 'none'`, minimal Permissions-Policy
- **Auth:** bcrypt, pinned-algorithm JWTs (12 h), brute-force limit + delay on login; the server won't start in production without `JWT_SECRET` / `ADMIN_PASSWORD`
- **Abuse:** per-route rate limits, honeypot on comments, ID/slug validation on everything that touches the filesystem, field whitelist on post updates, drafts never served to the public
- Errors return generic messages; details stay in the server log

## Configuration notes

- `SITE_URL` is used for RSS/sitemap links (the portfolio's origin, since the blog is served under `/blog`).
- `TRUST_PROXY` must match how many reverse proxies sit in front (default 2: Fly + the portfolio's rewrite); it decides which IP the rate limits see.
- The portfolio's `next.config.ts` raises the proxy's request-body limit so large uploads work through `/blog`.
- Rate limits and view buffering are in-process: fine for one machine (as on Fly); use a shared store if you scale out.
