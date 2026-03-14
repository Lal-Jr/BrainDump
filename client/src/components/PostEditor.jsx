import { useState, useEffect } from 'react';

export default function PostEditor({ initialContent, initialTitle, initialTags, onSave, saving }) {
  const [title, setTitle] = useState(initialTitle || '');
  const [content, setContent] = useState(initialContent || '');
  const [tags, setTags] = useState((initialTags || []).join(', '));

  useEffect(() => {
    if (initialContent !== undefined) setContent(initialContent);
    if (initialTitle !== undefined) setTitle(initialTitle);
    if (initialTags !== undefined) setTags(initialTags.join(', '));
  }, [initialContent, initialTitle, initialTags]);

  const handleSave = () => {
    onSave({
      title,
      content,
      tags: tags.split(',').map(t => t.trim()).filter(Boolean),
    });
  };

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Title */}
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Post title..."
        className="w-full bg-transparent text-2xl sm:text-3xl font-bold text-zinc-50 placeholder:text-zinc-700 outline-none border-none tracking-tight"
      />

      {/* Divider */}
      <div className="h-px bg-gradient-to-r from-zinc-800 via-zinc-700/50 to-transparent" />

      {/* Tags */}
      <div className="relative">
        <div className="absolute left-4 top-1/2 -translate-y-1/2">
          <svg className="w-4 h-4 text-zinc-600" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
          </svg>
        </div>
        <input
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="Tags (comma separated)..."
          className="input pl-10"
        />
      </div>

      {/* Markdown editor */}
      <div className="relative group/editor">
        <div className="absolute top-3.5 right-4 flex items-center gap-1.5 text-[11px] text-zinc-700 font-medium uppercase tracking-wider z-10">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
          </svg>
          Markdown
        </div>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write your markdown here..."
          rows={20}
          className="w-full bg-surface-200 border border-zinc-800/60 rounded-xl px-5 py-4 pr-[100px] text-sm text-zinc-200 font-mono leading-[1.8] placeholder:text-zinc-700 outline-none focus:border-brand-500/40 focus:ring-1 focus:ring-brand-500/20 transition-all duration-200 resize-y min-h-[350px]"
        />
      </div>

      {/* Actions bar */}
      <div className="flex items-center justify-between pt-2">
        <p className="text-xs text-zinc-700">
          {content.split(/\s+/).filter(Boolean).length} words · {content.length} chars
        </p>
        <button onClick={handleSave} disabled={saving || !title} className="btn-primary flex items-center gap-2">
          {saving ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
              Save changes
            </>
          )}
        </button>
      </div>
    </div>
  );
}
