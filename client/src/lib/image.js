// Shrink a photo in the browser before uploading it. A phone photo is often 5-10 MB; capped to
// 2000px and re-encoded it's typically well under 1 MB, which makes the upload fast (and keeps it
// under the proxy's request-size limit). The server re-encodes again, so this is only a speed-up.
export async function downscaleImage(file, maxSide = 2000) {
  if (!file.type.startsWith('image/') || file.type === 'image/gif') return file; // keep animations
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
    const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
    if (scale === 1 && file.size < 400 * 1024) return file; // already small
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/webp', 0.85));
    if (!blob || blob.size >= file.size) return file;
    return new File([blob], file.name.replace(/\.[^.]+$/, '') + '.webp', { type: 'image/webp' });
  } catch {
    return file; // the server can still handle it
  }
}
