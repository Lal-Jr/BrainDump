import { Router } from 'express';
import { limits } from '../middleware/security.js';
import { uuidParam } from '../middleware/validate.js';
import { getPostById } from '../services/postStore.js';
import { getReactions, setReaction, voterId, REACTION_TYPES } from '../services/reactions.js';

const router = Router();
const voter = (req) => voterId(req.ip, req.get('user-agent'));

// GET /api/reactions/:postId: counts, plus which ones this visitor already gave
router.get('/:postId', uuidParam('postId'), async (req, res, next) => {
  try {
    res.set('Cache-Control', 'private, no-cache'); // "mine" is per visitor
    res.json(await getReactions(req.params.postId, voter(req)));
  } catch (e) {
    next(e);
  }
});

// POST /api/reactions/:postId  { type, on }
router.post('/:postId', uuidParam('postId'), limits.react, async (req, res, next) => {
  try {
    const { type, on } = req.body ?? {};
    if (!REACTION_TYPES.includes(type) || typeof on !== 'boolean') return res.status(400).json({ error: 'Invalid reaction' });
    const post = await getPostById(req.params.postId);
    if (!post?.published) return res.status(404).json({ error: 'Post not found' });
    res.json(await setReaction(req.params.postId, voter(req), type, on));
  } catch (e) {
    next(e);
  }
});

export default router;
