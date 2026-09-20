// Upload pipeline. Never trust the client's filename or Content-Type: the kind of file is decided
// by its magic bytes, images are re-encoded (which also strips EXIF/GPS metadata), and files are
// stored under random names so nothing user-supplied ever becomes part of a path.
import path from 'path';
import fs from 'fs/promises';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';
import { UPLOADS_DIR, LIMITS } from '../config.js';
import { writeFileAtomic } from './fsutil.js';

const starts = (buf, bytes, offset = 0) => bytes.every((b, i) => buf[offset + i] === b);
const ascii = (buf, from, to) => buf.subarray(from, to).toString('latin1');

// SVG and HTML are deliberately not accepted: both can carry script
export function sniff(buf) {
  if (buf.length < 12) return null;
  if (starts(buf, [0xff, 0xd8, 0xff])) return { kind: 'image', ext: 'jpg' };
  if (starts(buf, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return { kind: 'image', ext: 'png' };
  if (ascii(buf, 0, 4) === 'GIF8') return { kind: 'image', ext: 'gif' };
  if (ascii(buf, 0, 4) === 'RIFF' && ascii(buf, 8, 12) === 'WEBP') return { kind: 'image', ext: 'webp' };
  if (ascii(buf, 4, 8) === 'ftyp') return { kind: 'video', ext: 'mp4' };
  if (starts(buf, [0x1a, 0x45, 0xdf, 0xa3])) return { kind: 'video', ext: 'webm' };
  if (ascii(buf, 0, 5) === '%PDF-') return { kind: 'pdf', ext: 'pdf' };
  return null;
}

const MAX_BYTES = { image: LIMITS.imageBytes, video: LIMITS.videoBytes, pdf: LIMITS.pdfBytes };
export const MAX_UPLOAD_BYTES = Math.max(...Object.values(MAX_BYTES));

const fail = (message, status = 400) => Object.assign(new Error(message), { status });

export async function saveUpload(buffer) {
  const type = sniff(buffer);
  if (!type) throw fail('Unsupported file. Upload a JPG, PNG, GIF, WebP, MP4, WebM or PDF.', 415);
  if (buffer.length > MAX_BYTES[type.kind]) {
    throw fail(`That ${type.kind} is too large (limit ${Math.round(MAX_BYTES[type.kind] / 1024 / 1024)} MB).`, 413);
  }
  await fs.mkdir(UPLOADS_DIR, { recursive: true });

  let out = buffer;
  let ext = type.ext;
  let width;
  let height;

  if (type.kind === 'image') {
    try {
      const animated = type.ext === 'gif' || type.ext === 'webp';
      const meta = await sharp(buffer, { animated, limitInputPixels: 60_000_000 }).metadata();
      const isAnimation = (meta.pages ?? 1) > 1;
      // auto-orient (photos) and cap the size; re-encode as WebP, which is much smaller
      let pipeline = sharp(buffer, { animated, limitInputPixels: 60_000_000 });
      if (!isAnimation) pipeline = pipeline.rotate();
      const result = await pipeline
        .resize({ width: 1920, height: 1920, fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 82 })
        .toBuffer({ resolveWithObject: true });
      out = result.data;
      ext = 'webp';
      width = result.info.width;
      height = result.info.pageHeight ?? result.info.height;
    } catch {
      throw fail('That image could not be processed. Try another file.', 422);
    }
  }

  const name = `${uuidv4()}.${ext}`;
  await writeFileAtomic(path.join(UPLOADS_DIR, name), out);
  return { url: `/uploads/${name}`, kind: type.kind, width, height, bytes: out.length };
}
