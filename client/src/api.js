const API = '/api/posts';

async function handleRes(res) {
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

export async function fetchPosts() {
  return handleRes(await fetch(API));
}

export async function fetchPublishedPosts() {
  return handleRes(await fetch(`${API}?published=true`));
}

export async function fetchPost(id) {
  return handleRes(await fetch(`${API}/${id}`));
}

export async function fetchPostBySlug(slug) {
  return handleRes(await fetch(`${API}/view/${slug}`));
}

export async function fetchRawMarkdown(id) {
  const data = await handleRes(await fetch(`${API}/${id}/raw`));
  return data.raw;
}

export async function createPostFromVoice(audioBlob) {
  const form = new FormData();
  form.append('audio', audioBlob, 'recording.webm');
  return handleRes(await fetch(`${API}/from-voice`, { method: 'POST', body: form }));
}

export async function createPostFromText(text) {
  return handleRes(await fetch(`${API}/from-text`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  }));
}

export async function updatePost(id, data) {
  return handleRes(await fetch(`${API}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }));
}

export async function saveRawMarkdown(id, raw) {
  return handleRes(await fetch(`${API}/${id}/raw`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ raw }),
  }));
}

export async function togglePublish(id) {
  return handleRes(await fetch(`${API}/${id}/publish`, { method: 'POST' }));
}

export async function deletePost(id) {
  return handleRes(await fetch(`${API}/${id}`, { method: 'DELETE' }));
}
