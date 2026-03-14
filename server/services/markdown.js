import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import matter from 'gray-matter';
import { v4 as uuidv4 } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '..');
const POSTS_DIR = path.join(DATA_DIR, 'posts');
const UPLOADS_DIR = path.join(DATA_DIR, 'uploads');

// Ensure directories exist
async function ensureDirs() {
  await fs.mkdir(POSTS_DIR, { recursive: true });
  await fs.mkdir(UPLOADS_DIR, { recursive: true });
}

/**
 * Create a new markdown post file
 */
export async function createPost({ title, summary, content, tags, published = false }) {
  await ensureDirs();
  const id = uuidv4();
  const date = new Date().toISOString();
  const slug = slugify(title);

  const frontmatter = {
    id,
    title,
    summary,
    tags: tags || [],
    published,
    createdAt: date,
    updatedAt: date,
    slug,
  };

  const fileContent = matter.stringify(content, frontmatter);
  const filename = `${slug}.md`;
  await fs.writeFile(path.join(POSTS_DIR, filename), fileContent, 'utf-8');

  return { id, slug, filename, ...frontmatter };
}

/**
 * Get all posts
 */
export async function getAllPosts() {
  await ensureDirs();
  const files = await fs.readdir(POSTS_DIR);
  const mdFiles = files.filter(f => f.endsWith('.md'));

  const posts = [];
  for (const file of mdFiles) {
    const raw = await fs.readFile(path.join(POSTS_DIR, file), 'utf-8');
    const { data, content } = matter(raw);
    posts.push({ ...data, content, filename: file });
  }

  // Sort by creation date, newest first
  posts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  return posts;
}

/**
 * Get a single post by slug
 */
export async function getPostBySlug(slug) {
  await ensureDirs();
  const files = await fs.readdir(POSTS_DIR);
  for (const file of files) {
    const raw = await fs.readFile(path.join(POSTS_DIR, file), 'utf-8');
    const { data, content } = matter(raw);
    if (data.slug === slug) {
      return { ...data, content, filename: file };
    }
  }
  return null;
}

/**
 * Get a single post by id
 */
export async function getPostById(id) {
  await ensureDirs();
  const files = await fs.readdir(POSTS_DIR);
  for (const file of files) {
    const raw = await fs.readFile(path.join(POSTS_DIR, file), 'utf-8');
    const { data, content } = matter(raw);
    if (data.id === id) {
      return { ...data, content, filename: file };
    }
  }
  return null;
}

/**
 * Update a post
 */
export async function updatePost(id, updates) {
  await ensureDirs();
  const post = await getPostById(id);
  if (!post) throw new Error('Post not found');

  const { filename, content: oldContent, ...oldData } = post;
  const newData = { ...oldData, ...updates, updatedAt: new Date().toISOString() };
  const newContent = updates.content !== undefined ? updates.content : oldContent;

  // If title changed, rename file
  let newFilename = filename;
  if (updates.title && updates.title !== oldData.title) {
    newData.slug = slugify(updates.title);
    newFilename = `${newData.slug}.md`;
    await fs.unlink(path.join(POSTS_DIR, filename));
  }

  const fileContent = matter.stringify(newContent, newData);
  await fs.writeFile(path.join(POSTS_DIR, newFilename), fileContent, 'utf-8');

  return { ...newData, content: newContent, filename: newFilename };
}

/**
 * Delete a post
 */
export async function deletePost(id) {
  await ensureDirs();
  const post = await getPostById(id);
  if (!post) throw new Error('Post not found');
  await fs.unlink(path.join(POSTS_DIR, post.filename));
  return true;
}

/**
 * Toggle post published state
 */
export async function togglePublish(id) {
  const post = await getPostById(id);
  if (!post) throw new Error('Post not found');
  return updatePost(id, { published: !post.published });
}

/**
 * Save an uploaded image
 */
export async function saveImage(buffer, originalName) {
  await ensureDirs();
  const ext = path.extname(originalName) || '.png';
  const filename = `${uuidv4()}${ext}`;
  await fs.writeFile(path.join(UPLOADS_DIR, filename), buffer);
  return `/uploads/${filename}`;
}

/**
 * Get raw markdown content for editing
 */
export async function getRawMarkdown(id) {
  await ensureDirs();
  const post = await getPostById(id);
  if (!post) throw new Error('Post not found');
  const raw = await fs.readFile(path.join(POSTS_DIR, post.filename), 'utf-8');
  return raw;
}

/**
 * Save raw markdown (full file with frontmatter)
 */
export async function saveRawMarkdown(id, rawMarkdown) {
  await ensureDirs();
  const post = await getPostById(id);
  if (!post) throw new Error('Post not found');

  // Parse the new raw markdown to extract updated frontmatter
  const { data, content } = matter(rawMarkdown);
  data.updatedAt = new Date().toISOString();

  const fileContent = matter.stringify(content, data);
  await fs.writeFile(path.join(POSTS_DIR, post.filename), fileContent, 'utf-8');

  return { ...data, content, filename: post.filename };
}

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
    .substring(0, 80);
}
