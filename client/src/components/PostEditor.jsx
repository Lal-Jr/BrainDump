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
    <div className="space-y-4">
      {/* Title */}
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Post title..."
        className="w-full bg-transparent text-2xl sm:text-3xl font-bold text-slate-100 placeholder:text-slate-600 outline-none border-none"
      />

      {/* Tags */}
      <input
        value={tags}
        onChange={(e) => setTags(e.target.value)}
        placeholder="Tags (comma separated)..."
        className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-300 placeholder:text-slate-600 outline-none focus:border-brand-600 transition-colors"
      />

      {/* Markdown editor */}
      <div className="relative">
        <div className="absolute top-3 right-3 flex items-center gap-1 text-xs text-slate-600">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
          Markdown
        </div>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write your markdown here..."
          rows={20}
          className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-200 font-mono leading-relaxed placeholder:text-slate-600 outline-none focus:border-brand-600 transition-colors resize-y min-h-[300px]"
        />
      </div>

      {/* Save */}
      <div className="flex justify-end">
        <button onClick={handleSave} disabled={saving || !title} className="btn-primary flex items-center gap-2">
          {saving ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Saving...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Save
            </>
          )}
        </button>
      </div>
    </div>
  );
}
