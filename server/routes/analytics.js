import { Router } from 'express';
import { getAnalytics, getAllViews } from '../services/analytics.js';
import { getComments } from '../services/comments.js';
import { getAllPosts } from '../services/markdown.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// GET /api/analytics — full dashboard data (admin only)
router.get('/', requireAuth, async (req, res) => {
  try {
    const [analytics, posts] = await Promise.all([
      getAnalytics(),
      getAllPosts(),
    ]);

    // Get comment counts per post
    let totalComments = 0;
    const recentComments = [];

    for (const post of posts) {
      try {
        const comments = await getComments(post.id);
        totalComments += comments.length;
        // Add post title to each comment and collect recent ones
        for (const c of comments) {
          recentComments.push({
            ...c,
            postTitle: post.title,
            postId: post.id,
          });
        }
      } catch {
        // no comments file yet
      }
    }

    // Sort recent comments by date, take latest 10
    recentComments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const totalPosts = posts.length;
    const published = posts.filter(p => p.published).length;
    const drafts = totalPosts - published;

    // Top posts by views
    const topPosts = posts
      .map(p => ({
        id: p.id,
        title: p.title,
        slug: p.slug,
        published: p.published,
        views: analytics.postViews[p.id] || 0,
        createdAt: p.createdAt,
      }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 10);

    res.json({
      stats: {
        totalPosts,
        published,
        drafts,
        totalViews: analytics.totalViews,
        todayViews: analytics.todayViews,
        weekViews: analytics.weekViews,
        totalComments,
      },
      chart: analytics.chart,
      topPosts,
      recentComments: recentComments.slice(0, 10),
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
