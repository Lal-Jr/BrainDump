import { Link } from 'react-router-dom';

export default function PostCard({ post, onPublish, onDelete }) {
  const date = new Date(post.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="card p-5 hover:border-slate-700 transition-colors group">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <Link to={`/preview/${post.id}`} className="block">
            <h3 className="font-semibold text-slate-100 group-hover:text-brand-400 transition-colors truncate">
              {post.title}
            </h3>
          </Link>
          {post.summary && (
            <p className="text-sm text-slate-400 mt-1 line-clamp-2">{post.summary}</p>
          )}
          <div className="flex items-center gap-3 mt-3">
            <span className="text-xs text-slate-500">{date}</span>
            {post.tags?.map(tag => (
              <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Status & actions */}
        <div className="flex flex-col items-end gap-2 shrink-0">
          <span className={`text-xs px-2 py-1 rounded-full font-medium ${
            post.published
              ? 'bg-emerald-600/20 text-emerald-400'
              : 'bg-amber-600/20 text-amber-400'
          }`}>
            {post.published ? 'Live' : 'Draft'}
          </span>

          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Link
              to={`/edit/${post.id}`}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
              title="Edit"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </Link>
            <button
              onClick={() => onPublish(post.id)}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-emerald-400 transition-colors"
              title={post.published ? 'Unpublish' : 'Publish'}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
            </button>
            <button
              onClick={() => onDelete(post.id)}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-red-400 transition-colors"
              title="Delete"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
