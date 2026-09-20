// Posts are markdown files with YAML frontmatter (easy to back up and edit by hand). Reading and
// parsing every file per request doesn't scale, so the whole set lives in memory and is rebuilt
// when something is written (or after a short TTL, to notice edits made outside the app).
import fs from 'fs/promises';
import path from 'path';
import matter from 'gray-matter';
import { v4 as uuidv4 } from 'uuid';
import { POSTS_DIR, DEFAULT_CATEGORY } from '../config.js';
import { withLock } from './lock.js';
import { writeFileAtomic } from './fsutil.js';

const TTL_MS = 30_000;
let cache = null; // { at, posts, byId, bySlug }
let loading = null;

const toIso = (v) => (v instanceof Date ? v.toISOString() : v);

export function readingTime(content = '') {
  const words = content.replace(/```[\s\S]*?```/g, ' ').split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 220));
}

async function load() {
  await fs.mkdir(POSTS_DIR, { recursive: true });
  const files = (await fs.readdir(POSTS_DIR)).filter((f) => f.endsWith('.md'));
  const posts = [];
  for (const file of files) {
    try {
      const { data, content } = matter(await fs.readFile(path.join(POSTS_DIR, file), 'utf-8'));
      if (!data.id || !data.slug) continue; // not one of ours
      posts.push({
        ...data,
        createdAt: toIso(data.createdAt),
        updatedAt: toIso(data.updatedAt),
        tags: Array.isArray(data.tags) ? data.tags : [],
        category: data.category || DEFAULT_CATEGORY,
        cover: data.cover || '',
        content,
        filename: file,
        readingTime: readingTime(content),
      });
    } catch (e) {
      console.warn(`Skipping unreadable post ${file}: ${e.message}`);
    }
  }
  posts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  return {
    at: Date.now(),
    posts,
    byId: new Map(posts.map((p) => [p.id, p])),
    bySlug: new Map(posts.map((p) => [p.slug, p])),
  };
}

async function snapshot() {
  if (cache && Date.now() - cache.at < TTL_MS) return cache;
  loading ??= load().then((c) => (cache = c)).finally(() => (loading = null));
  return loading;
}

export const invalidate = () => {
  cache = null;
};

export const getAllPosts = async () => (await snapshot()).posts;
export const getPostById = async (id) => (await snapshot()).byId.get(id) ?? null;
export const getPostBySlug = async (slug) => (await snapshot()).bySlug.get(slug) ?? null;

// Metadata only: the body is fetched separately, and comment counts are merged in by the route
export function toListItem({ content, filename, ...meta }) {
  return meta;
}

const slugify = (text) =>
  text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').slice(0, 80);

// A slug from the title that never collides with another post (so same-titled posts can't
// overwrite each other). `ownFile` is exempt when renaming a post onto itself.
async function uniqueSlug(title, ownFile) {
  const base = slugify(title) || 'untitled';
  const files = new Set(await fs.readdir(POSTS_DIR));
  let slug = base;
  for (let n = 2; files.has(`${slug}.md`) && `${slug}.md` !== ownFile; n++) slug = `${base}-${n}`;
  return slug;
}

function serialize({ content, filename, readingTime: _rt, ...frontmatter }) {
  return matter.stringify(content, frontmatter);
}

export function createPost({ title, summary = '', content = '', tags = [], category = DEFAULT_CATEGORY, cover = '', published = false }) {
  return withLock('posts', async () => {
    await fs.mkdir(POSTS_DIR, { recursive: true });
    const now = new Date().toISOString();
    const slug = await uniqueSlug(title);
    const post = { id: uuidv4(), title, summary, tags, category, cover, published, createdAt: now, updatedAt: now, slug, content };
    const filename = `${slug}.md`;
    await writeFileAtomic(path.join(POSTS_DIR, filename), serialize(post));
    invalidate();
    return { ...post, filename, readingTime: readingTime(content) };
  });
}

export function updatePost(id, updates) {
  return withLock('posts', async () => {
    const post = await getPostById(id);
    if (!post) throw Object.assign(new Error('Post not found'), { status: 404 });

    const next = { ...post, ...updates, updatedAt: new Date().toISOString() };
    let filename = post.filename;
    // A published post's URL is permanent; only a draft's slug follows its title
    if (updates.title && updates.title !== post.title && !post.published) {
      next.slug = await uniqueSlug(updates.title, post.filename);
      filename = `${next.slug}.md`;
    }
    await writeFileAtomic(path.join(POSTS_DIR, filename), serialize(next));
    if (filename !== post.filename) await fs.rm(path.join(POSTS_DIR, post.filename), { force: true });
    invalidate();
    return { ...next, filename, readingTime: readingTime(next.content) };
  });
}

export function togglePublish(id) {
  return withLock('posts', async () => {
    const post = await getPostById(id);
    if (!post) throw Object.assign(new Error('Post not found'), { status: 404 });
    const next = { ...post, published: !post.published, updatedAt: new Date().toISOString() };
    await writeFileAtomic(path.join(POSTS_DIR, post.filename), serialize(next));
    invalidate();
    return next;
  });
}

export function deletePost(id) {
  return withLock('posts', async () => {
    const post = await getPostById(id);
    if (!post) throw Object.assign(new Error('Post not found'), { status: 404 });
    await fs.rm(path.join(POSTS_DIR, post.filename), { force: true });
    invalidate();
  });
}
