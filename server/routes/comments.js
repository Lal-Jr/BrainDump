import { Router } from 'express';
import { getComments, addComment, deleteComment } from '../services/comments.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// GET /api/comments/:postId — get comments for a post (public)
router.get('/:postId', async (req, res) => {
  try {
    const comments = await getComments(req.params.postId);
    res.json(comments);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/comments/:postId — add a comment (public)
router.post('/:postId', async (req, res) => {
  try {
    const { name, text } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Comment text is required' });
    }
    if (text.length > 2000) {
      return res.status(400).json({ error: 'Comment too long (max 2000 chars)' });
    }
    const comment = await addComment(req.params.postId, { name, text });
    res.status(201).json(comment);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// DELETE /api/comments/:postId/:commentId — delete a comment (admin only)
router.delete('/:postId/:commentId', requireAuth, async (req, res) => {
  try {
    const remaining = await deleteComment(req.params.postId, req.params.commentId);
    res.json(remaining);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
