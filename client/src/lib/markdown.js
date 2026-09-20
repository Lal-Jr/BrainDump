// Markdown -> sanitized HTML (+ a heading outline for the table of contents).
// Post bodies can contain raw HTML (and some are AI-generated), so the output is ALWAYS passed
// through DOMPurify before it reaches the page, on top of the server's CSP.
import MarkdownIt from 'markdown-it';
import taskLists from 'markdown-it-task-lists';
import DOMPurify from 'dompurify';
import hljs from 'highlight.js/lib/core';
import javascript from 'highlight.js/lib/languages/javascript';
import typescript from 'highlight.js/lib/languages/typescript';
import css from 'highlight.js/lib/languages/css';
import xml from 'highlight.js/lib/languages/xml';
import json from 'highlight.js/lib/languages/json';
import bash from 'highlight.js/lib/languages/bash';
import python from 'highlight.js/lib/languages/python';
import go from 'highlight.js/lib/languages/go';
import sql from 'highlight.js/lib/languages/sql';
import markdown from 'highlight.js/lib/languages/markdown';
import yaml from 'highlight.js/lib/languages/yaml';
import diff from 'highlight.js/lib/languages/diff';
import 'highlight.js/styles/atom-one-dark.css';
import { withBase } from '../base';

const LANGS = { javascript, js: javascript, jsx: javascript, typescript, ts: typescript, tsx: typescript, css, xml, html: xml, json, bash, sh: bash, shell: bash, python, py: python, go, sql, markdown, md: markdown, yaml, yml: yaml, diff };
for (const [name, def] of Object.entries(LANGS)) hljs.registerLanguage(name, def);

const UPLOADS = withBase('uploads/');
const esc = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const slugify = (s) => s.toLowerCase().replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-').slice(0, 60) || 'section';

const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
  breaks: true,
  highlight(code, lang) {
    let value;
    try {
      value = lang && hljs.getLanguage(lang) ? hljs.highlight(code, { language: lang, ignoreIllegals: true }).value : esc(code);
    } catch {
      value = esc(code);
    }
    return `<pre><code class="hljs${lang ? ` language-${esc(lang)}` : ''}">${value}</code></pre>`;
  },
}).use(taskLists, { enabled: true });

// Headings get ids (deep links) and a "#" anchor, and are collected for the outline
md.renderer.rules.heading_open = (tokens, idx, options, env, self) => {
  const token = tokens[idx];
  const text = (tokens[idx + 1].children ?? []).filter((c) => c.type === 'text' || c.type === 'code_inline').map((c) => c.content).join('');
  let id = slugify(text);
  for (let n = 2; env.ids.has(id); n++) id = `${slugify(text)}-${n}`;
  env.ids.add(id);
  token.attrSet('id', id);
  env.headings.push({ level: Number(token.tag.slice(1)), text, id });
  return `${self.renderToken(tokens, idx, options)}<a class="anchor" href="#${id}" aria-label="Link to this section">#</a>`;
};

const defaultImage = md.renderer.rules.image;
md.renderer.rules.image = (tokens, idx, options, env, self) => {
  tokens[idx].attrSet('loading', 'lazy');
  tokens[idx].attrSet('decoding', 'async');
  return defaultImage(tokens, idx, options, env, self);
};

// ---------- embeds: {{video:...}} / {{pdf:...}} ----------

const frame = (src, title) => `<div class="embed-shell"><iframe src="${esc(src)}" title="${title}" loading="lazy" allowfullscreen></iframe></div>`;

function embed(kind, raw) {
  const src = raw.startsWith('/uploads/') ? UPLOADS + raw.slice('/uploads/'.length) : raw;
  if (kind === 'pdf') return src.startsWith(UPLOADS) ? frame(src, 'Embedded PDF') : `<a href="${esc(src)}">${esc(src)}</a>`;
  const yt = src.match(/^https?:\/\/(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]{6,})/i);
  if (yt) return frame(`https://www.youtube-nocookie.com/embed/${yt[1]}`, 'YouTube video');
  const vimeo = src.match(/^https?:\/\/(?:www\.)?vimeo\.com\/(\d+)/i);
  if (vimeo) return frame(`https://player.vimeo.com/video/${vimeo[1]}`, 'Vimeo video');
  if (src.startsWith(UPLOADS)) return `<div class="embed-shell"><video controls preload="metadata" playsinline src="${esc(src)}"></video></div>`;
  return `<a href="${esc(src)}">${esc(src)}</a>`; // anything else is just a link (the CSP would block a remote <video> anyway)
}

// Stored posts reference uploads as /uploads/…; the blog lives under a base path, so rewrite them
const withUploadBase = (text) => text.replace(/(["'(])\/uploads\//g, `$1${UPLOADS}`);
const withEmbeds = (text) => text.replace(/\{\{(video|pdf):([^\s}]+)\}\}/gi, (_m, kind, src) => embed(kind.toLowerCase(), src));

// ---------- sanitizer ----------

const FRAME_OK = [/^https:\/\/www\.youtube-nocookie\.com\/embed\//, /^https:\/\/player\.vimeo\.com\/video\//];

DOMPurify.addHook('afterSanitizeAttributes', (node) => {
  if (node.tagName === 'A') {
    const href = node.getAttribute('href') || '';
    if (/^https?:/i.test(href)) {
      node.setAttribute('target', '_blank');
      node.setAttribute('rel', 'noopener noreferrer');
    }
  }
  if (node.tagName === 'IFRAME') {
    const src = node.getAttribute('src') || '';
    if (FRAME_OK.some((re) => re.test(src)) || src.startsWith(UPLOADS)) {
      node.setAttribute('referrerpolicy', 'no-referrer');
      node.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-presentation');
    } else {
      node.remove();
    }
  }
});

const clean = (html) =>
  DOMPurify.sanitize(html, {
    ADD_TAGS: ['iframe'],
    ADD_ATTR: ['allowfullscreen', 'controls', 'preload', 'loading', 'decoding', 'referrerpolicy', 'sandbox', 'playsinline'],
    FORBID_TAGS: ['style', 'form', 'input', 'textarea', 'select', 'button', 'object', 'embed', 'link', 'meta', 'base'],
    FORBID_ATTR: ['style'],
  });

// ---------- public API ----------

const cache = new Map();

export function renderMarkdown(source = '') {
  const hit = cache.get(source);
  if (hit) return hit;
  const env = { headings: [], ids: new Set() };
  const html = clean(md.render(withEmbeds(withUploadBase(source)), env));
  const result = { html, headings: env.headings.filter((h) => h.level === 2 || h.level === 3) };
  cache.set(source, result);
  if (cache.size > 30) cache.delete(cache.keys().next().value); // tiny LRU
  return result;
}
