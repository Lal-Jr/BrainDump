const API = '/api/posts';
const COMMENTS_API = '/api/comments';
const ANALYTICS_API = '/api/analytics';

function getAuthHeaders() {
  const token = localStorage.getItem('bd_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function handleRes(res) {
  let data;
  try {
    const text = await res.text();
    data = text ? JSON.parse(text) : {};
  } catch {
    throw new Error(res.ok ? 'Invalid response from server' : `Request failed (${res.status})`);
  }
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

export async function fetchPosts() {
  return handleRes(await fetch(API, { headers: getAuthHeaders() }));
}

export async function fetchPublishedPosts() {
  return handleRes(await fetch(`${API}?published=true`));
}

export async function fetchPost(id) {
  return handleRes(await fetch(`${API}/${id}`, { headers: getAuthHeaders() }));
}

export async function fetchPostBySlug(slug) {
  return handleRes(await fetch(`${API}/view/${slug}`));
}

export async function fetchRawMarkdown(id) {
  const data = await handleRes(await fetch(`${API}/${id}/raw`, { headers: getAuthHeaders() }));
  return data.raw;
}

export async function createPostFromVoice(audioBlob) {
  const form = new FormData();
  form.append('audio', audioBlob, 'recording.webm');
  return handleRes(await fetch(`${API}/from-voice`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: form,
  }));
}

export async function createPostFromText(text, { style, tone } = {}) {
  return handleRes(await fetch(`${API}/from-text`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify({ text, style, tone }),
  }));
}

export async function updatePost(id, data) {
  return handleRes(await fetch(`${API}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify(data),
  }));
}

export async function saveRawMarkdown(id, raw) {
  return handleRes(await fetch(`${API}/${id}/raw`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify({ raw }),
  }));
}

export async function togglePublish(id) {
  return handleRes(await fetch(`${API}/${id}/publish`, {
    method: 'POST',
    headers: getAuthHeaders(),
  }));
}

export async function deletePost(id) {
  return handleRes(await fetch(`${API}/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  }));
}

// ---- Comments API ----

export async function fetchComments(postId) {
  return handleRes(await fetch(`${COMMENTS_API}/${postId}`));
}

export async function addComment(postId, { name, text }) {
  return handleRes(await fetch(`${COMMENTS_API}/${postId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, text }),
  }));
}

export async function removeComment(postId, commentId) {
  return handleRes(await fetch(`${COMMENTS_API}/${postId}/${commentId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  }));
}

// ---- Analytics API ----

export async function fetchAnalytics() {
  return handleRes(await fetch(ANALYTICS_API, { headers: getAuthHeaders() }));
}
