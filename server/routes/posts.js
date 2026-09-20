import { Router } from 'express';
import multer from 'multer';
import { transcribeAudio, generateFromVoice, generateFromText, generateImage } from '../services/ai.js';
import { createPost, getAllPosts, getPostBySlug, getPostById, updatePost, deletePost, togglePublish, toListItem } from '../services/postStore.js';
import { getCommentCounts } from '../services/comments.js';
import { recordView } from '../services/analytics.js';
import { saveUpload } from '../services/media.js';
import { requireAuth, optionalAuth } from '../middleware/auth.js';
import { limits } from '../middleware/security.js';
import { uuidParam, isSlug, cleanText, cleanTags, cleanCover, pickPostUpdate } from '../middleware/validate.js';
import { LIMITS } from '../config.js';

const router = Router();
const audioUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024, files: 1, fields: 2 } });

const isQuotaError = (e) => /insufficient_quota|billing|exceeded your current quota/.test(`${e?.message ?? ''}${e?.error?.code ?? ''}${e?.code ?? ''}${e?.type ?? ''}`);
const QUOTA_MSG = 'OpenAI API credits exhausted. Add credits at platform.openai.com/settings/organization/billing';

// Whatever the model returns is untrusted input: bound and clean it like anything else
const fromAI = (data, content) => ({
  title: cleanText(data.title, LIMITS.title) || 'Untitled draft',
  summary: cleanText(data.summary, LIMITS.summary),
  tags: cleanTags(data.tags),
  content: cleanText(content, LIMITS.contentChars, { multiline: true }),
});

// If the model asked for an image, generate it and run it through the same upload pipeline.
// It becomes the post's cover, which renders above the body, rather than a line inside it.
async function generateCover(blogData) {
  if (!blogData.needsImage || !blogData.imagePrompt) return '';
  try {
    const imageUrl = await generateImage(blogData.imagePrompt);
    if (!imageUrl) return '';
    const buffer = Buffer.from(await (await fetch(imageUrl)).arrayBuffer());
    const { url } = await saveUpload(buffer);
    return url;
  } catch (e) {
    console.warn('Image generation failed (non-critical):', e.message);
    return '';
  }
}

// GET /api/posts?published=true (public; `no-cache` = always revalidate via ETag, so a deleted or unpublished
// post disappears at once while unchanged lists still cost only a 304) or /api/posts (admin): summaries only, no body
router.get('/', optionalAuth, async (req, res, next) => {
  try {
    const publicOnly = req.query.published === 'true';
    if (!publicOnly && !req.user) return res.status(401).json({ error: 'Authentication required' });
    const [posts, counts] = await Promise.all([getAllPosts(), getCommentCounts()]);
    const items = (publicOnly ? posts.filter((p) => p.published) : posts).map((p) => ({ ...toListItem(p), commentCount: counts.get(p.id) ?? 0 }));
    res.set('Cache-Control', publicOnly ? 'public, no-cache' : 'private, no-store');
    res.set('Vary', 'Authorization');
    res.json(items);
  } catch (e) {
    next(e);
  }
});

// GET /api/posts/view/:slug: a published post (drafts only for the signed-in admin). Read-only and
// cacheable; views are counted separately by POST /hit/:id.
router.get('/view/:slug', optionalAuth, async (req, res, next) => {
  try {
    if (!isSlug(req.params.slug)) return res.status(404).json({ error: 'Post not found' });
    const post = await getPostBySlug(req.params.slug);
    if (!post || (!post.published && !req.user)) return res.status(404).json({ error: 'Post not found' });
    const counts = await getCommentCounts();
    res.set('Cache-Control', post.published ? 'public, no-cache' : 'private, no-store');
    res.set('Vary', 'Authorization');
    const { filename, ...rest } = post;
    res.json({ ...rest, commentCount: counts.get(post.id) ?? 0 });
  } catch (e) {
    next(e);
  }
});

// POST /api/posts/hit/:id: count one view (skips the admin, only published posts)
router.post('/hit/:id', uuidParam('id'), limits.hit, optionalAuth, async (req, res, next) => {
  try {
    if (!req.user) {
      const post = await getPostById(req.params.id);
      if (post?.published) await recordView(post.id);
    }
    res.status(204).end();
  } catch (e) {
    next(e);
  }
});

// GET /api/posts/:id (admin)
router.get('/:id', requireAuth, uuidParam('id'), async (req, res, next) => {
  try {
    const post = await getPostById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found' });
    res.set('Cache-Control', 'no-store');
    res.json(post);
  } catch (e) {
    next(e);
  }
});

// POST /api/posts/from-voice: transcribe a recording and draft a post from it (admin)
router.post('/from-voice', requireAuth, limits.ai, audioUpload.single('audio'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No audio file uploaded' });

    let transcript;
    try {
      transcript = await transcribeAudio(req.file.buffer, req.file.mimetype);
    } catch (e) {
      console.error('Transcription failed:', e.message);
      if (isQuotaError(e)) return res.status(402).json({ error: QUOTA_MSG, stage: 'quota' });
      return res.status(502).json({ error: 'Transcription failed. Try again or check your recording.', stage: 'transcription' });
    }
    if (!transcript?.trim()) {
      return res.status(400).json({ error: 'No speech detected in the recording. Try speaking louder or somewhere quieter.', stage: 'transcription' });
    }

    let blogData;
    try {
      blogData = await generateFromVoice(transcript);
    } catch (e) {
      console.error('Voice post generation failed:', e.message);
      if (isQuotaError(e)) return res.status(402).json({ error: QUOTA_MSG, stage: 'quota' });
      return res.status(502).json({ error: 'AI post generation failed. Please try again.', stage: 'generation' });
    }

    const post = await createPost({ ...fromAI(blogData, blogData.content), cover: cleanCover(await generateCover(blogData)), published: false });
    res.json({ post, transcript });
  } catch (e) {
    console.error('Voice post creation failed:', e);
    if (isQuotaError(e)) return res.status(402).json({ error: QUOTA_MSG, stage: 'quota' });
    res.status(500).json({ error: 'Something went wrong creating the post.', stage: 'unknown' });
  }
});

// POST /api/posts/from-text: draft a post from rough notes (admin)
router.post('/from-text', requireAuth, limits.ai, async (req, res) => {
  try {
    const text = cleanText(req.body?.text, 20_000, { multiline: true });
    if (text.length < 10) return res.status(400).json({ error: 'Write at least a few words to generate a post from.' });

    let blogData;
    try {
      blogData = await generateFromText(text, { style: req.body?.style, tone: req.body?.tone });
    } catch (e) {
      console.error('Text post generation failed:', e.message);
      if (isQuotaError(e)) return res.status(402).json({ error: QUOTA_MSG, stage: 'quota' });
      return res.status(502).json({ error: 'AI post generation failed. Please try again.', stage: 'generation' });
    }

    const post = await createPost({ ...fromAI(blogData, blogData.content), cover: cleanCover(await generateCover(blogData)), published: false });
    res.json({ post });
  } catch (e) {
    console.error('Text post creation failed:', e);
    if (isQuotaError(e)) return res.status(402).json({ error: QUOTA_MSG, stage: 'quota' });
    res.status(500).json({ error: 'Something went wrong creating the post.', stage: 'unknown' });
  }
});

// POST /api/posts/manual: a draft without AI (a blank draft to write by hand) (admin)
router.post('/manual', requireAuth, async (req, res, next) => {
  try {
    const fields = pickPostUpdate(req.body);
    if (!fields.title) return res.status(400).json({ error: 'Title is required.' });
    res.json({ post: await createPost({ ...fields, published: false }) });
  } catch (e) {
    next(e);
  }
});

// PUT /api/posts/:id: only whitelisted fields can change (id, slug, dates and published are the server's)
router.put('/:id', requireAuth, uuidParam('id'), async (req, res, next) => {
  try {
    const fields = pickPostUpdate(req.body);
    if ('title' in fields && !fields.title) return res.status(400).json({ error: 'Title is required.' });
    res.json(await updatePost(req.params.id, fields));
  } catch (e) {
    next(e);
  }
});

router.post('/:id/publish', requireAuth, uuidParam('id'), async (req, res, next) => {
  try {
    res.json(await togglePublish(req.params.id));
  } catch (e) {
    next(e);
  }
});

router.delete('/:id', requireAuth, uuidParam('id'), async (req, res, next) => {
  try {
    await deletePost(req.params.id);
    res.json({ success: true });
  } catch (e) {
    next(e);
  }
});

export default router;
