import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '..');
const COMMENTS_DIR = path.join(DATA_DIR, 'comments');

async function ensureDir() {
  await fs.mkdir(COMMENTS_DIR, { recursive: true });
}

function getFilePath(postId) {
  return path.join(COMMENTS_DIR, `${postId}.json`);
}

async function readComments(postId) {
  await ensureDir();
  const filePath = getFilePath(postId);
  try {
    const data = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

async function writeComments(postId, comments) {
  await ensureDir();
  await fs.writeFile(getFilePath(postId), JSON.stringify(comments, null, 2));
}

/**
 * Get all comments for a post
 */
export async function getComments(postId) {
  return readComments(postId);
}

/**
 * Add a comment to a post
 */
export async function addComment(postId, { name, text }) {
  const comments = await readComments(postId);
  const comment = {
    id: uuidv4(),
    name: name?.trim() || 'Anonymous',
    text: text.trim(),
    createdAt: new Date().toISOString(),
  };
  comments.push(comment);
  await writeComments(postId, comments);
  return comment;
}

/**
 * Delete a comment (admin only)
 */
export async function deleteComment(postId, commentId) {
  const comments = await readComments(postId);
  const filtered = comments.filter(c => c.id !== commentId);
  await writeComments(postId, filtered);
  return filtered;
}
