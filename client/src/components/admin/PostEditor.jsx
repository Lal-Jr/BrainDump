import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CATEGORY_KEYS, CATEGORIES } from '../../lib/categories';
import { uploadMedia } from '../../lib/api';
import { downscaleImage } from '../../lib/image';
import { withBase } from '../../base';
import { useToast } from '../../context/ToastContext';
import MarkdownContent from '../public/MarkdownContent';
import { parseVideoUrl } from '../../lib/markdown';

const ACCEPT = 'image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,application/pdf';
// Mirrors the server's limits, so a too-big file is refused straight away instead of after a long upload
const LIMIT_MB = { image: 12, video: 25, pdf: 15 };
const kindOf = (file) => (file.type.startsWith('image/') ? 'image' : file.type.startsWith('video/') ? 'video' : 'pdf');
const TOO_BIG_HINT = ' For video, a YouTube or Vimeo link works too: {{video:https://…}}.';
let uploadId = 0;

// The markdown to insert for an uploaded file. Videos and PDFs use the {{video:…}} / {{pdf:…}} embeds.
function markdownFor(media, file) {
  if (media.kind === 'video') return `{{video:${media.url}}}`;
  if (media.kind === 'pdf') return `{{pdf:${media.url}}}`;
  const alt = file.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ').replace(/[[\]]/g, '');
  return `![${alt}](${media.url})`;
}

// Title, summary, category, tags, cover image and a markdown body with preview. Media can be added
// by button, drag-and-drop or paste; the parent owns saving.
export default function PostEditor({ initial, onSave, saving }) {
  const toast = useToast();
  const [fields, setFields] = useState(() => ({
    title: initial.title ?? '',
    summary: initial.summary ?? '',
    category: initial.category ?? 'thoughts',
    tags: (initial.tags ?? []).join(', '),
    cover: initial.cover ?? '',
    content: initial.content ?? '',
  }));
  const [preview, setPreview] = useState(false);
  const [videoOpen, setVideoOpen] = useState(false);
  const [videoUrl, setVideoUrl] = useState('');
  const [videoErr, setVideoErr] = useState('');
  const [uploads, setUploads] = useState({}); // id -> { name, progress }
  const [dragging, setDragging] = useState(false);
  const textarea = useRef(null);
  const fileInput = useRef(null);
  const coverInput = useRef(null);
  const imageInput = useRef(null);
  const saved = useRef(JSON.stringify(fields)); // what's on the server, to detect unsaved edits

  const set = (key) => (e) => setFields((f) => ({ ...f, [key]: e.target.value }));
  const dirty = JSON.stringify(fields) !== saved.current;
  const uploading = Object.keys(uploads).length > 0;

  // Warn before closing the tab with unsaved work
  useEffect(() => {
    if (!dirty && !uploading) return undefined;
    const warn = (e) => e.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty, uploading]);

  const payload = useCallback(
    () => ({
      title: fields.title,
      summary: fields.summary,
      category: fields.category,
      cover: fields.cover,
      content: fields.content,
      tags: fields.tags.split(',').map((t) => t.trim()).filter(Boolean),
    }),
    [fields]
  );

  const save = useCallback(async () => {
    if (uploading) return toast.info('Wait for uploads to finish');
    if (!fields.title.trim()) return toast.error('Add a title first');
    if (await onSave(payload())) saved.current = JSON.stringify(fields);
  }, [fields, onSave, payload, toast, uploading]);

  // Ctrl/Cmd + S saves
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        save();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [save]);

  // ---------- inserting text ----------

  const insertAtCursor = (text) => {
    const el = textarea.current;
    setFields((f) => {
      const start = el?.selectionStart ?? f.content.length;
      const end = el?.selectionEnd ?? f.content.length;
      return { ...f, content: f.content.slice(0, start) + text + f.content.slice(end) };
    });
  };

  // Wrap the selection (or drop a placeholder): the toolbar's bold / italic / link / code
  const wrap = (before, after = before, placeholder = 'text') => {
    const el = textarea.current;
    if (!el) return;
    const { selectionStart: s, selectionEnd: e } = el;
    setFields((f) => {
      const chosen = f.content.slice(s, e) || placeholder;
      return { ...f, content: f.content.slice(0, s) + before + chosen + after + f.content.slice(e) };
    });
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(s + before.length, s + before.length + (e > s ? e - s : placeholder.length));
    });
  };

  // ---------- media ----------

  async function uploadFile(file) {
    const id = ++uploadId;
    const placeholder = `![Uploading ${file.name.replace(/[[\]]/g, '')}…](uploading-${id})`;
    insertAtCursor(`\n\n${placeholder}\n\n`);
    setUploads((u) => ({ ...u, [id]: { name: file.name, progress: 0 } }));
    try {
      const prepared = await downscaleImage(file); // photos shrink first, so this only refuses genuinely huge files
      const kind = kindOf(prepared);
      if (prepared.size > LIMIT_MB[kind] * 1024 * 1024) {
        throw new Error(`That ${kind} is ${(prepared.size / 1024 / 1024).toFixed(1)} MB; the limit is ${LIMIT_MB[kind]} MB.${kind === 'video' ? TOO_BIG_HINT : ''}`);
      }
      const media = await uploadMedia(prepared, (p) => setUploads((u) => (u[id] ? { ...u, [id]: { ...u[id], progress: p } } : u)));
      setFields((f) => ({ ...f, content: f.content.replace(placeholder, markdownFor(media, file)) }));
    } catch (e) {
      setFields((f) => ({ ...f, content: f.content.replace(`\n\n${placeholder}\n\n`, '\n\n').replace(placeholder, '') }));
      // status 0 / 5xx on a big file usually means a proxy in front gave up, not that the file is bad
      const proxied = kindOf(file) !== 'image' && (e.status === 0 || e.status >= 500);
      toast.error(`${file.name}: ${e.message}${proxied ? TOO_BIG_HINT : ''}`);
    } finally {
      setUploads((u) => {
        const { [id]: _done, ...rest } = u;
        return rest;
      });
    }
  }

  const uploadFiles = (files) => Array.from(files).forEach(uploadFile);

  async function uploadCover(file) {
    if (!file || !file.type.startsWith('image/')) return toast.error('The cover must be an image');
    const id = ++uploadId;
    setUploads((u) => ({ ...u, [id]: { name: 'cover', progress: 0 } }));
    try {
      const media = await uploadMedia(await downscaleImage(file, 1600), (p) => setUploads((u) => (u[id] ? { ...u, [id]: { ...u[id], progress: p } } : u)));
      setFields((f) => ({ ...f, cover: media.url }));
    } catch (e) {
      toast.error(e.message);
    } finally {
      setUploads((u) => {
        const { [id]: _done, ...rest } = u;
        return rest;
      });
    }
  }

  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files?.length) uploadFiles(e.dataTransfer.files);
  };
  // A YouTube / Vimeo link goes in as a video embed
  const addVideo = (url) => {
    if (!parseVideoUrl(url)) return false;
    insertAtCursor(`\n\n{{video:${url.trim()}}}\n\n`);
    return true;
  };

  const submitVideo = (e) => {
    e.preventDefault();
    if (!addVideo(videoUrl)) return setVideoErr('That is not a YouTube or Vimeo link. Try the address from your browser bar or the Share button.');
    setVideoUrl('');
    setVideoErr('');
    setVideoOpen(false);
  };

  const onPaste = (e) => {
    if (e.clipboardData?.files?.length) {
      e.preventDefault();
      uploadFiles(e.clipboardData.files);
      return;
    }
    // pasting a bare YouTube / Vimeo link embeds it (paste it over selected text to keep it as a plain link)
    const text = e.clipboardData?.getData('text')?.trim();
    const el = textarea.current;
    if (text && !/\s/.test(text) && el && el.selectionStart === el.selectionEnd && addVideo(text)) e.preventDefault();
  };

  const words = useMemo(() => fields.content.split(/\s+/).filter(Boolean).length, [fields.content]);
  const progress = Object.values(uploads);

  return (
    <div className="space-y-5">
      <input value={fields.title} onChange={set('title')} placeholder="Post title" aria-label="Title" maxLength={140} className="w-full border-0 bg-transparent text-3xl font-bold tracking-tight text-zinc-50 outline-none placeholder:text-zinc-700" />

      <div>
        <label htmlFor="summary" className="label mb-2 block">Summary (shown on the feed and in link previews)</label>
        <textarea id="summary" value={fields.summary} onChange={set('summary')} rows={2} maxLength={300} className="input resize-none" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="category" className="label mb-2 block">Category</label>
          <select id="category" value={fields.category} onChange={set('category')} className="input">
            {CATEGORY_KEYS.map((k) => (
              <option key={k} value={k}>
                {CATEGORIES[k].label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="tags" className="label mb-2 block">Tags (comma separated)</label>
          <input id="tags" value={fields.tags} onChange={set('tags')} className="input" />
        </div>
      </div>

      {/* Cover image */}
      <div>
        <span className="label mb-2 block">Cover image (optional, shown above the post and on the feed)</span>
        <div className="flex flex-wrap items-center gap-4">
          {fields.cover ? (
            <img src={withBase(fields.cover.slice(1))} alt="Cover" className="h-20 w-36 border border-white/10 object-cover" />
          ) : (
            <span className="flex h-20 w-36 items-center justify-center border border-dashed border-white/15 text-[11px] text-zinc-600">No cover</span>
          )}
          <div className="flex gap-2">
            <button type="button" className="btn-secondary" onClick={() => coverInput.current?.click()}>
              {fields.cover ? 'Replace' : 'Upload'}
            </button>
            {fields.cover && (
              <button type="button" className="btn-ghost" onClick={() => setFields((f) => ({ ...f, cover: '' }))}>
                Remove
              </button>
            )}
          </div>
          <input ref={coverInput} type="file" accept="image/*" hidden onChange={(e) => (uploadCover(e.target.files?.[0]), (e.target.value = ''))} />
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4">
        <div className="tab-group">
          <button type="button" onClick={() => setPreview(false)} className={!preview ? 'tab-item-active' : 'tab-item'}>Write</button>
          <button type="button" onClick={() => setPreview(true)} className={preview ? 'tab-item-active' : 'tab-item'}>Preview</button>
        </div>
        {!preview && (
          <div className="flex flex-wrap gap-1.5" role="toolbar" aria-label="Formatting">
            <ToolButton onClick={() => wrap('## ', '', 'Heading')} label="H2" />
            <ToolButton onClick={() => wrap('**')} label="B" title="Bold" />
            <ToolButton onClick={() => wrap('_')} label="I" title="Italic" />
            <ToolButton onClick={() => wrap('`')} label="{ }" title="Inline code" />
            <ToolButton onClick={() => wrap('```\n', '\n```', 'code')} label="Code block" />
            <ToolButton onClick={() => wrap('[', '](https://)', 'link text')} label="Link" />
            <ToolButton onClick={() => wrap('> ', '', 'Quote')} label="Quote" />
            <ToolButton onClick={() => setVideoOpen((v) => !v)} label="Video link" title="Embed a YouTube or Vimeo video" />
            <ToolButton onClick={() => imageInput.current?.click()} label="Image" title="Insert an image at the cursor" />
            <ToolButton onClick={() => fileInput.current?.click()} label="+ Media" primary />
          </div>
        )}
      </div>
      {videoOpen && !preview && (
        <form onSubmit={submitVideo} className="space-y-2 border border-white/10 p-3">
          <div className="flex flex-wrap gap-2">
            <input
              type="url"
              autoFocus
              value={videoUrl}
              onChange={(e) => (setVideoUrl(e.target.value), setVideoErr(''))}
              placeholder="Paste a YouTube or Vimeo link"
              aria-label="Video link"
              className="input min-w-0 flex-1"
            />
            <button type="submit" className="btn-primary">Embed</button>
            <button type="button" className="btn-ghost" onClick={() => (setVideoOpen(false), setVideoErr(''))}>Cancel</button>
          </div>
          {videoErr && <p role="alert" className="text-[12px] text-red-300">{videoErr}</p>}
        </form>
      )}
      <input ref={imageInput} type="file" accept="image/*" multiple hidden onChange={(e) => (uploadFiles(e.target.files), (e.target.value = ''))} />
      <input ref={fileInput} type="file" accept={ACCEPT} multiple hidden onChange={(e) => (uploadFiles(e.target.files), (e.target.value = ''))} />

      {/* Body */}
      {preview ? (
        <div className="min-h-[360px] border border-white/10 p-6">
          <MarkdownContent content={fields.content} />
        </div>
      ) : (
        <div className="relative" onDragOver={(e) => (e.preventDefault(), setDragging(true))} onDragLeave={() => setDragging(false)} onDrop={onDrop}>
          <textarea
            ref={textarea}
            value={fields.content}
            onChange={set('content')}
            onPaste={onPaste}
            placeholder="Write in markdown. Drag a photo, video or PDF in, or paste an image."
            aria-label="Post body"
            rows={22}
            className="input min-h-[380px] resize-y leading-[1.75]"
          />
          {dragging && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center border border-dashed border-brand-300 bg-black/70 text-[13px] font-medium text-brand-300">
              Drop to upload
            </div>
          )}
        </div>
      )}

      {progress.length > 0 && (
        <ul className="space-y-2" aria-live="polite">
          {progress.map((u, i) => (
            <li key={i} className="text-[12px] text-zinc-400">
              Uploading {u.name}… {Math.round(u.progress * 100)}%
              <span className="mt-1 block h-1.5 w-full bg-white/10">
                <span className="block h-full bg-brand-300 transition-all" style={{ width: `${u.progress * 100}%` }} />
              </span>
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="text-[12px] text-zinc-600">
          {words} words{dirty ? ' · unsaved changes' : ''}
        </span>
        <button type="button" onClick={save} disabled={saving || uploading || !fields.title.trim()} className="btn-primary">
          {saving ? 'Saving…' : 'Save changes'}
        </button>
      </div>
    </div>
  );
}

function ToolButton({ onClick, label, title, primary }) {
  return (
    <button type="button" onClick={onClick} title={title ?? label} className={`border px-2.5 py-1.5 text-[12px] font-medium transition-colors ${primary ? 'border-brand-300 text-brand-300 hover:bg-brand-300 hover:text-black' : 'border-white/15 text-zinc-400 hover:border-white/50 hover:text-zinc-100'}`}>
      {label}
    </button>
  );
}
