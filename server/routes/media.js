import { Router } from 'express';
import multer from 'multer';
import { requireAuth } from '../middleware/auth.js';
import { limits } from '../middleware/security.js';
import { saveUpload, MAX_UPLOAD_BYTES } from '../services/media.js';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_UPLOAD_BYTES, files: 1, fields: 4, parts: 6 },
});

// POST /api/media: admin only. multipart field "file". Returns { url, kind, width, height, bytes }.
router.post('/', requireAuth, limits.upload, upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    res.status(201).json(await saveUpload(req.file.buffer));
  } catch (e) {
    next(e);
  }
});

export default router;
