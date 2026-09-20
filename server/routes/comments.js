import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { limits } from '../middleware/security.js';
import { uuidParam, isUuid, cleanText } from '../middleware/validate.js';
import { LIMITS } from '../config.js';
import { getComments, addComment, deleteComment } from '../services/comments.js';
import { getPostById } from '../services/postStore.js';

const router = Router();

// GET /api/comments/:postId (public)
router.get('/:postId', uuidParam('postId'), async (req, res, next) => {
  try {
    res.set('Cache-Control', 'public, max-age=10, stale-while-revalidate=60');
    res.json(await getComments(req.params.postId));
  } catch (e) {
    next(e);
  }
});

// POST /api/comments/:postId (public). Body: { name?, text, parentId?, website? }
router.post('/:postId', uuidParam('postId'), limits.comment, async (req, res, next) => {
  try {
    const { name, text, parentId, website } = req.body ?? {};
    // Honeypot: real people never see or fill the "website" field
    if (website) return res.status(201).json({ id: 'ignored', name: '', text: '', createdAt: new Date().toISOString() });

    const post = await getPostById(req.params.postId);
    if (!post?.published) return res.status(404).json({ error: 'Post not found' });

    const cleanBody = cleanText(text, LIMITS.commentText, { multiline: true });
    if (!cleanBody) return res.status(400).json({ error: 'Comment text is required' });
    if (typeof text === 'string' && text.length > LIMITS.commentText) return res.status(400).json({ error: `Comment too long (max ${LIMITS.commentText} characters)` });
    if (parentId !== undefined && !isUuid(parentId)) return res.status(400).json({ error: 'Invalid reply target' });

    const comment = await addComment(req.params.postId, {
      name: cleanText(name, LIMITS.commentName),
      text: cleanBody,
      parentId,
    });
    res.status(201).json(comment);
  } catch (e) {
    next(e);
  }
});

// DELETE /api/comments/:postId/:commentId (admin). Also removes replies.
router.delete('/:postId/:commentId', requireAuth, uuidParam('postId'), uuidParam('commentId'), async (req, res, next) => {
  try {
    res.json(await deleteComment(req.params.postId, req.params.commentId));
  } catch (e) {
    next(e);
  }
});

export default router;
