// API client + a tiny stale-while-revalidate cache.
// Reads return instantly from cache (memory, and sessionStorage for the post list so a reload is
// instant too) and refresh in the background; hovering a link prefetches its post.
import { withBase } from '../base';

const API = withBase('api');
const TOKEN_KEY = 'bd_token';

export const getToken = () => {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};
export const setToken = (t) => {
  try {
    t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* storage blocked */
  }
};

export class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

async function request(path, { method = 'GET', body, form, auth = false, signal } = {}) {
  const headers = {};
  if (auth && getToken()) headers.Authorization = `Bearer ${getToken()}`;
  let payload;
  if (form) payload = form;
  else if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
    payload = JSON.stringify(body);
  }
  const res = await fetch(`${API}${path}`, { method, headers, body: payload, signal });
  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    /* non-JSON error page */
  }
  if (!res.ok) {
    if (res.status === 401 && auth) window.dispatchEvent(new Event('bd:unauthorized'));
    throw new ApiError(data?.error || `Request failed (${res.status})`, res.status, data);
  }
  return data;
}

// ---------- stale-while-revalidate cache ----------

const store = new Map(); // key -> { data, at }
const inflight = new Map();
const PERSISTED = new Set(['posts']);

function readSession(key) {
  if (!PERSISTED.has(key)) return null;
  try {
    return JSON.parse(sessionStorage.getItem(`bd:${key}`));
  } catch {
    return null;
  }
}

export function peek(key) {
  return store.get(key) ?? readSession(key) ?? undefined;
}

export function load(key, fetcher) {
  if (inflight.has(key)) return inflight.get(key);
  const p = fetcher()
    .then((data) => {
      const entry = { data, at: Date.now() };
      store.set(key, entry);
      if (PERSISTED.has(key)) {
        try {
          sessionStorage.setItem(`bd:${key}`, JSON.stringify(entry));
        } catch {
          /* quota / blocked */
        }
      }
      return data;
    })
    .finally(() => inflight.delete(key));
  inflight.set(key, p);
  return p;
}

// Anything an admin write changes must not be served stale
export function invalidate(prefix = '') {
  for (const key of [...store.keys()]) if (key.startsWith(prefix)) store.delete(key);
  try {
    if (!prefix || 'posts'.startsWith(prefix)) sessionStorage.removeItem('bd:posts');
  } catch {
    /* ignore */
  }
}

// ---------- public reads ----------

export const fetchPublishedPosts = () => load('posts', () => request('/posts?published=true'));
export const fetchPostBySlug = (slug) => load(`post:${slug}`, () => request(`/posts/view/${encodeURIComponent(slug)}`, { auth: !!getToken() }));
export const prefetchPost = (slug) => fetchPostBySlug(slug).catch(() => {});
export const recordHit = (id) => request(`/posts/hit/${id}`, { method: 'POST', auth: !!getToken() }).catch(() => {});

export const fetchComments = (postId) => request(`/comments/${postId}`);
export const addComment = (postId, payload) => request(`/comments/${postId}`, { method: 'POST', body: payload });
export const removeComment = (postId, commentId) => request(`/comments/${postId}/${commentId}`, { method: 'DELETE', auth: true });

export const fetchReactions = (postId) => request(`/reactions/${postId}`);
export const setReaction = (postId, type, on) => request(`/reactions/${postId}`, { method: 'POST', body: { type, on } });

// ---------- admin ----------

const write = (fn) => async (...args) => {
  const result = await fn(...args);
  invalidate();
  return result;
};

export const login = (password) => request('/auth/login', { method: 'POST', body: { password } });
export const verifyToken = () => request('/auth/verify', { auth: true });
export const fetchPosts = () => request('/posts', { auth: true });
export const fetchPost = (id) => request(`/posts/${id}`, { auth: true });
export const fetchAnalytics = () => request('/analytics', { auth: true });

export const updatePost = write((id, data) => request(`/posts/${id}`, { method: 'PUT', body: data, auth: true }));
export const togglePublish = write((id) => request(`/posts/${id}/publish`, { method: 'POST', auth: true }));
export const deletePost = write((id) => request(`/posts/${id}`, { method: 'DELETE', auth: true }));
export const createPostManually = write((data) => request('/posts/manual', { method: 'POST', body: data, auth: true }));
export const createPostFromText = write((text) => request('/posts/from-text', { method: 'POST', body: { text }, auth: true }));
export const createPostFromVoice = write((audioBlob) => {
  const form = new FormData();
  form.append('audio', audioBlob, 'recording.webm');
  return request('/posts/from-voice', { method: 'POST', form, auth: true });
});

// Upload one image/video/PDF, with progress (fetch can't report upload progress, XHR can)
export function uploadMedia(file, onProgress) {
  return new Promise((resolve, reject) => {
    const form = new FormData();
    form.append('file', file, file.name);
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${API}/media`);
    if (getToken()) xhr.setRequestHeader('Authorization', `Bearer ${getToken()}`);
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress?.(e.loaded / e.total);
    xhr.onerror = () => reject(new ApiError('Upload failed. Check your connection and try again.', 0));
    xhr.onload = () => {
      let data = null;
      try {
        data = JSON.parse(xhr.responseText);
      } catch {
        /* ignore */
      }
      if (xhr.status >= 200 && xhr.status < 300) resolve(data);
      else {
        if (xhr.status === 401) window.dispatchEvent(new Event('bd:unauthorized'));
        reject(new ApiError(data?.error || `Upload failed (${xhr.status})`, xhr.status, data));
      }
    };
    xhr.send(form);
  });
}
