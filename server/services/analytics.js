import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '..');
const ANALYTICS_DIR = path.join(DATA_DIR, 'analytics');
const VIEWS_FILE = path.join(ANALYTICS_DIR, 'views.json');

async function ensureDir() {
  await fs.mkdir(ANALYTICS_DIR, { recursive: true });
}

async function readViews() {
  await ensureDir();
  try {
    const data = await fs.readFile(VIEWS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return {};
  }
}

async function writeViews(views) {
  await ensureDir();
  await fs.writeFile(VIEWS_FILE, JSON.stringify(views, null, 2));
}

/**
 * Record a page view for a post
 */
export async function recordView(postId) {
  const views = await readViews();
  if (!views[postId]) {
    views[postId] = { total: 0, daily: {} };
  }
  views[postId].total += 1;

  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  views[postId].daily[today] = (views[postId].daily[today] || 0) + 1;

  await writeViews(views);
  return views[postId].total;
}

/**
 * Get view count for a single post
 */
export async function getViewCount(postId) {
  const views = await readViews();
  return views[postId]?.total || 0;
}

/**
 * Get all view data (for analytics dashboard)
 */
export async function getAllViews() {
  return readViews();
}

/**
 * Get aggregate analytics data
 */
export async function getAnalytics() {
  const views = await readViews();

  let totalViews = 0;
  let todayViews = 0;
  let weekViews = 0;
  const today = new Date().toISOString().slice(0, 10);
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);

  const postViews = {};

  for (const [postId, data] of Object.entries(views)) {
    totalViews += data.total;
    postViews[postId] = data.total;

    if (data.daily[today]) {
      todayViews += data.daily[today];
    }

    // Sum last 7 days
    for (const [date, count] of Object.entries(data.daily)) {
      if (date >= weekAgo) {
        weekViews += count;
      }
    }
  }

  // Daily views for chart (last 30 days)
  const dailyTotals = {};
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
  for (const data of Object.values(views)) {
    for (const [date, count] of Object.entries(data.daily)) {
      if (date >= thirtyDaysAgo) {
        dailyTotals[date] = (dailyTotals[date] || 0) + count;
      }
    }
  }

  // Fill in missing days
  const chart = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
    chart.push({ date: d, views: dailyTotals[d] || 0 });
  }

  return {
    totalViews,
    todayViews,
    weekViews,
    postViews,
    chart,
  };
}
