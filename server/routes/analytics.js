import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { getAnalytics } from '../services/analytics.js';
import { getComments, getCommentCounts } from '../services/comments.js';
import { getAllPosts } from '../services/postStore.js';

const router = Router();

// GET /api/analytics: what the dashboard needs (admin only)
router.get('/', requireAuth, async (_req, res, next) => {
  try {
    res.set('Cache-Control', 'no-store');
    const [analytics, posts, counts] = await Promise.all([getAnalytics(), getAllPosts(), getCommentCounts()]);

    const recentComments = [];
    for (const post of posts) {
      if (!counts.get(post.id)) continue;
      for (const c of await getComments(post.id)) recentComments.push({ ...c, postId: post.id, postTitle: post.title });
    }
    recentComments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json({
      totalViews: analytics.totalViews,
      totalComments: recentComments.length,
      viewsPerPost: analytics.postViews,
      commentsPerPost: Object.fromEntries(counts),
      recentComments: recentComments.slice(0, 20),
    });
  } catch (e) {
    next(e);
  }
});

export default router;
