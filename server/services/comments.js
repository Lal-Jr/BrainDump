// Comments: one JSON file per post. Threads are one level deep (a reply targets a top-level
// comment). Counts are kept in memory so the feed can show them without opening every file.
import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { COMMENTS_DIR } from '../config.js';
import { withLock } from './lock.js';
import { writeFileAtomic, readJson } from './fsutil.js';

const MAX_PER_POST = 500;
let counts = null; // Map<postId, number>

const fileFor = (postId) => path.join(COMMENTS_DIR, `${postId}.json`); // postId is validated as a UUID upstream

async function loadCounts() {
  await fs.mkdir(COMMENTS_DIR, { recursive: true });
  const map = new Map();
  for (const f of await fs.readdir(COMMENTS_DIR)) {
    if (!f.endsWith('.json')) continue;
    const list = await readJson(path.join(COMMENTS_DIR, f), []);
    if (Array.isArray(list)) map.set(f.slice(0, -5), list.length);
  }
  return map;
}

export async function getCommentCounts() {
  counts ??= await loadCounts();
  return counts;
}

export async function getComments(postId) {
  await fs.mkdir(COMMENTS_DIR, { recursive: true });
  const list = await readJson(fileFor(postId), []);
  return Array.isArray(list) ? list : [];
}

export function addComment(postId, { name, text, parentId }) {
  return withLock(`comments:${postId}`, async () => {
    const list = await getComments(postId);
    if (list.length >= MAX_PER_POST) throw Object.assign(new Error('This thread is full'), { status: 429 });
    if (parentId) {
      const parent = list.find((c) => c.id === parentId);
      if (!parent || parent.parentId) throw Object.assign(new Error('Reply target not found'), { status: 400 });
    }
    const comment = {
      id: uuidv4(),
      ...(parentId ? { parentId } : {}),
      name: name || 'Anonymous',
      text,
      createdAt: new Date().toISOString(),
    };
    list.push(comment);
    await writeFileAtomic(fileFor(postId), JSON.stringify(list, null, 2));
    (await getCommentCounts()).set(postId, list.length);
    return comment;
  });
}

// Deleting a comment also deletes its replies
export function deleteComment(postId, commentId) {
  return withLock(`comments:${postId}`, async () => {
    const list = await getComments(postId);
    const remaining = list.filter((c) => c.id !== commentId && c.parentId !== commentId);
    await writeFileAtomic(fileFor(postId), JSON.stringify(remaining, null, 2));
    (await getCommentCounts()).set(postId, remaining.length);
    return remaining;
  });
}
