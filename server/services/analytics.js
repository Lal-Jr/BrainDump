// Page-view totals per post. Counts are held in memory and flushed to disk every few seconds, so
// a burst of reads is one write instead of hundreds of read-modify-write cycles.
import fs from 'fs/promises';
import path from 'path';
import { ANALYTICS_DIR } from '../config.js';
import { writeFileAtomic, readJson } from './fsutil.js';

const FILE = path.join(ANALYTICS_DIR, 'views.json');
let views = null; // { [postId]: { total } }
let dirty = false;
let timer = null;

async function ensure() {
  if (!views) {
    await fs.mkdir(ANALYTICS_DIR, { recursive: true });
    views = await readJson(FILE, {});
  }
  return views;
}

export async function flushViews() {
  clearTimeout(timer);
  timer = null;
  if (!dirty || !views) return;
  dirty = false;
  await writeFileAtomic(FILE, JSON.stringify(views, null, 2));
}

export async function recordView(postId) {
  const data = await ensure();
  data[postId] = { total: (data[postId]?.total ?? 0) + 1 };
  dirty = true;
  timer ??= setTimeout(() => flushViews().catch(() => {}), 5000);
}

export async function getAnalytics() {
  const data = await ensure();
  const postViews = {};
  let totalViews = 0;
  for (const [id, v] of Object.entries(data)) {
    postViews[id] = v.total;
    totalViews += v.total;
  }
  return { totalViews, postViews };
}
