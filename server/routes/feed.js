// RSS and sitemap, generated from the cached post list
import { Router } from 'express';
import { SITE_URL } from '../config.js';
import { getAllPosts } from '../services/postStore.js';

const router = Router();
const esc = (s = '') => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// Public origin of the blog: SITE_URL (the portfolio) when configured, else whatever host reached us
const blogUrl = (req) => {
  if (SITE_URL) return `${SITE_URL}/blog`;
  const host = req.get('x-forwarded-host') || req.get('host');
  const proto = req.get('x-forwarded-proto') || req.protocol;
  return `${proto}://${host}/blog`;
};

router.get('/rss.xml', async (req, res, next) => {
  try {
    const base = blogUrl(req);
    const posts = (await getAllPosts()).filter((p) => p.published).slice(0, 30);
    const items = posts
      .map(
        (p) => `    <item>
      <title>${esc(p.title)}</title>
      <link>${base}/${p.slug}</link>
      <guid isPermaLink="true">${base}/${p.slug}</guid>
      <pubDate>${new Date(p.createdAt).toUTCString()}</pubDate>
      <description>${esc(p.summary)}</description>
      ${p.tags.map((t) => `<category>${esc(t)}</category>`).join('')}
    </item>`
      )
      .join('\n');
    res.type('application/rss+xml').set('Cache-Control', 'public, max-age=600').send(`<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Brain Dump</title>
    <link>${base}</link>
    <description>Thoughts, how I work, engineering notes and research.</description>
    <atom:link href="${base}/rss.xml" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>`);
  } catch (e) {
    next(e);
  }
});

router.get('/sitemap.xml', async (req, res, next) => {
  try {
    const base = blogUrl(req);
    const posts = (await getAllPosts()).filter((p) => p.published);
    const urls = [`  <url><loc>${base}</loc></url>`, ...posts.map((p) => `  <url><loc>${base}/${p.slug}</loc><lastmod>${new Date(p.updatedAt).toISOString().slice(0, 10)}</lastmod></url>`)];
    res.type('application/xml').set('Cache-Control', 'public, max-age=600').send(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`);
  } catch (e) {
    next(e);
  }
});

export default router;
