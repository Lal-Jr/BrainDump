import { Router } from 'express';
import multer from 'multer';
import { transcribeAudio, generateBlogPost, generateImage } from '../services/ai.js';
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

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024 } });

// GET /api/posts — list all posts
router.get('/', async (req, res) => {
  try {
    const posts = await getAllPosts();
    // If ?published=true, filter to only published
    if (req.query.published === 'true') {
      return res.json(posts.filter(p => p.published));
    }
    res.json(posts);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/posts/:slug — get single post by slug
router.get('/view/:slug', async (req, res) => {
  try {
    const post = await getPostBySlug(req.params.slug);
    if (!post) return res.status(404).json({ error: 'Post not found' });
    res.json(post);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/posts/:id — get single post by id
router.get('/:id', async (req, res) => {
  try {
    const post = await getPostById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found' });
    res.json(post);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/posts/:id/raw — get raw markdown
router.get('/:id/raw', async (req, res) => {
  try {
    const raw = await getRawMarkdown(req.params.id);
    res.json({ raw });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/posts/from-voice — create post from voice recording
router.post('/from-voice', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No audio file uploaded' });

    // 1. Transcribe audio
    const transcript = await transcribeAudio(req.file.buffer, req.file.mimetype);

    // 2. Generate blog post from transcript
    const blogData = await generateBlogPost(transcript);

    // 3. Generate images (optional, can be slow)
    let content = blogData.content;
    if (blogData.imagePrompts && blogData.imagePrompts.length > 0) {
      // Generate first image only to keep it fast
      const imageUrl = await generateImage(blogData.imagePrompts[0]);
      if (imageUrl) {
        // Download and save the image
        const response = await fetch(imageUrl);
        const buffer = Buffer.from(await response.arrayBuffer());
        const localUrl = await saveImage(buffer, 'generated.png');
        content = content.replace(/!\[([^\]]*)\]\(PLACEHOLDER_IMAGE\)/, `![$1](${localUrl})`);
      }
    }
    // Remove remaining placeholders
    content = content.replace(/!\[([^\]]*)\]\(PLACEHOLDER_IMAGE\)/g, '');

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
    res.status(500).json({ error: e.message });
  }
});

// POST /api/posts/from-text — create post from text input
router.post('/from-text', async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: 'No text provided' });

    const blogData = await generateBlogPost(text);

    let content = blogData.content;
    // Remove placeholders for text-based (skip image gen for speed)
    content = content.replace(/!\[([^\]]*)\]\(PLACEHOLDER_IMAGE\)/g, '');

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
    res.status(500).json({ error: e.message });
  }
});

// PUT /api/posts/:id — update post
router.put('/:id', async (req, res) => {
  try {
    const updated = await updatePost(req.params.id, req.body);
    res.json(updated);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// PUT /api/posts/:id/raw — save raw markdown
router.put('/:id/raw', async (req, res) => {
  try {
    const updated = await saveRawMarkdown(req.params.id, req.body.raw);
    res.json(updated);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/posts/:id/publish — toggle publish
router.post('/:id/publish', async (req, res) => {
  try {
    const updated = await togglePublish(req.params.id);
    res.json(updated);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// DELETE /api/posts/:id — delete post
router.delete('/:id', async (req, res) => {
  try {
    await deletePost(req.params.id);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
