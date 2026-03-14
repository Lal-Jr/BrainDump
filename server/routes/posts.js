import { Router } from 'express';
import multer from 'multer';
import { transcribeAudio, generateFromVoice, generateFromText, generateImage } from '../services/ai.js';
import {
  createPost,
  getAllPosts,
  getPostBySlug,
  getPostById,
  updatePost,
  deletePost,
  togglePublish,
  saveImage,
  getRawMarkdown,
  saveRawMarkdown,
} from '../services/markdown.js';
import { requireAuth } from '../middleware/auth.js';
import { recordView } from '../services/analytics.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024 } });

// Helper: detect OpenAI quota/billing errors
function isQuotaError(e) {
  const msg = (e?.message || '') + (e?.error?.code || '') + (e?.code || '') + (e?.type || '');
  return msg.includes('insufficient_quota') || msg.includes('billing') || msg.includes('exceeded your current quota');
}
function quotaMsg() {
  return 'OpenAI API credits exhausted. Add credits at platform.openai.com/settings/organization/billing';
}

// GET /api/posts — list all posts (published=true is public, all posts requires auth)
router.get('/', async (req, res) => {
  try {
    const posts = await getAllPosts();
    // Public: only published posts
    if (req.query.published === 'true') {
      return res.json(posts.filter(p => p.published));
    }
    // All posts requires auth
    requireAuth(req, res, () => {
      res.json(posts);
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/posts/:slug — get single post by slug (public, tracks views)
router.get('/view/:slug', async (req, res) => {
  try {
    const post = await getPostBySlug(req.params.slug);
    if (!post) return res.status(404).json({ error: 'Post not found' });
    // Track view asynchronously
    recordView(post.id).catch(() => {});
    res.json(post);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/posts/:id — get single post by id (admin only)
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const post = await getPostById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found' });
    res.json(post);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/posts/:id/raw — get raw markdown (admin only)
router.get('/:id/raw', requireAuth, async (req, res) => {
  try {
    const raw = await getRawMarkdown(req.params.id);
    res.json({ raw });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/posts/from-voice — create post from voice recording (admin only)
router.post('/from-voice', requireAuth, upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No audio file uploaded' });

    // 1. Transcribe audio
    let transcript;
    try {
      transcript = await transcribeAudio(req.file.buffer, req.file.mimetype);
    } catch (e) {
      console.error('Transcription failed:', e);
      if (isQuotaError(e)) return res.status(402).json({ error: quotaMsg(), stage: 'quota' });
      return res.status(502).json({ error: 'Transcription failed — could not process audio. Try again or check your recording.', stage: 'transcription' });
    }

    if (!transcript || !transcript.trim()) {
      return res.status(400).json({ error: 'No speech detected in recording. Try speaking louder or recording in a quieter environment.', stage: 'transcription' });
    }

    // 2. Generate blog post from transcript (voice-specific prompt)
    let blogData;
    try {
      blogData = await generateFromVoice(transcript);
    } catch (e) {
      console.error('Voice post generation failed:', e);
      if (isQuotaError(e)) return res.status(402).json({ error: quotaMsg(), stage: 'quota' });
      return res.status(502).json({ error: 'AI post generation failed. Please try again.', stage: 'generation' });
    }

    // 3. Generate image only if AI explicitly says the content needs one (rare)
    let content = blogData.content;
    if (blogData.needsImage && blogData.imagePrompt) {
      try {
        const imageUrl = await generateImage(blogData.imagePrompt);
        if (imageUrl) {
          const response = await fetch(imageUrl);
          const buffer = Buffer.from(await response.arrayBuffer());
          const localUrl = await saveImage(buffer, 'generated.png');
          content = `![Cover](${localUrl})\n\n${content}`;
        }
      } catch (e) {
        console.warn('Image generation failed (non-critical):', e.message);
      }
    }

    // 4. Save as markdown
    const post = await createPost({
      title: blogData.title,
      summary: blogData.summary,
      content,
      tags: blogData.tags,
      published: false,
    });

    res.json({ post, transcript });
  } catch (e) {
    console.error('Voice post creation failed:', e);
    if (isQuotaError(e)) return res.status(402).json({ error: quotaMsg(), stage: 'quota' });
    res.status(500).json({ error: e.message || 'An unexpected error occurred', stage: 'unknown' });
  }
});

// POST /api/posts/from-text — create post from text input (admin only)
router.post('/from-text', requireAuth, async (req, res) => {
  try {
    const { text, style, tone } = req.body;
    if (!text) return res.status(400).json({ error: 'No text provided' });
    if (text.trim().length < 10) return res.status(400).json({ error: 'Please write at least a few words to generate a post from.' });

    let blogData;
    try {
      blogData = await generateFromText(text, { style, tone });
    } catch (e) {
      console.error('Text post generation failed:', e);
      return res.status(502).json({ error: 'AI post generation failed. Please try again.', stage: 'generation' });
    }

    let content = blogData.content;

    // Generate image only if AI explicitly says the content needs one (rare)
    if (blogData.needsImage && blogData.imagePrompt) {
      try {
        const imageUrl = await generateImage(blogData.imagePrompt);
        if (imageUrl) {
          const response = await fetch(imageUrl);
          const buffer = Buffer.from(await response.arrayBuffer());
          const localUrl = await saveImage(buffer, 'generated.png');
          content = `![Cover](${localUrl})\n\n${content}`;
        }
      } catch (e) {
        console.warn('Image generation failed (non-critical):', e.message);
      }
    }

    const post = await createPost({
      title: blogData.title,
      summary: blogData.summary,
      content,
      tags: blogData.tags,
      published: false,
    });

    res.json({ post });
  } catch (e) {
    console.error('Text post creation failed:', e);
    if (isQuotaError(e)) return res.status(402).json({ error: quotaMsg(), stage: 'quota' });
    res.status(500).json({ error: e.message || 'An unexpected error occurred', stage: 'unknown' });
  }
});

// PUT /api/posts/:id — update post (admin only)
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const updated = await updatePost(req.params.id, req.body);
    res.json(updated);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// PUT /api/posts/:id/raw — save raw markdown (admin only)
router.put('/:id/raw', requireAuth, async (req, res) => {
  try {
    const updated = await saveRawMarkdown(req.params.id, req.body.raw);
    res.json(updated);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/posts/:id/publish — toggle publish (admin only)
router.post('/:id/publish', requireAuth, async (req, res) => {
  try {
    const updated = await togglePublish(req.params.id);
    res.json(updated);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// DELETE /api/posts/:id — delete post (admin only)
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    await deletePost(req.params.id);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
