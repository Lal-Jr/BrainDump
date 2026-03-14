import { Link } from 'react-router-dom';

export default function PostCard({ post, onPublish, onDelete }) {
  const date = new Date(post.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="card-glow group p-0 overflow-hidden animate-fade-in-up">
      <div className="p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <Link to={`/preview/${post.id}`} className="block">
              <h3 className="font-semibold text-zinc-100 group-hover:text-brand-400 transition-colors duration-300 truncate text-[15px]">
                {post.title}
              </h3>
            </Link>
            {post.summary && (
              <p className="text-sm text-zinc-500 mt-1.5 line-clamp-2 leading-relaxed">{post.summary}</p>
            )}
            <div className="flex items-center gap-3 mt-3 flex-wrap">
              <span className="text-xs text-zinc-600 font-medium">{date}</span>
              {post.tags?.map(tag => (
                <span key={tag} className="badge-tag text-[11px]">
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Status & actions */}
          <div className="flex flex-col items-end gap-2.5 shrink-0">
            <span className={post.published ? 'badge-live' : 'badge-draft'}>
              {post.published ? 'Live' : 'Draft'}
            </span>

            <div className="flex items-center gap-0.5 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-300">
              <ActionButton
                to={`/edit/${post.id}`}
                title="Edit"
                icon={<path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />}
              />
              <button
                onClick={() => onPublish(post.id)}
                className="p-2 rounded-lg text-zinc-600 hover:text-emerald-400 hover:bg-emerald-400/10 transition-all duration-200"
                title={post.published ? 'Unpublish' : 'Publish'}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                </svg>
              </button>
              <button
                onClick={() => onDelete(post.id)}
                className="p-2 rounded-lg text-zinc-600 hover:text-red-400 hover:bg-red-400/10 transition-all duration-200"
                title="Delete"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom shimmer line on hover */}
      <div className="h-px bg-gradient-to-r from-transparent via-brand-500/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
    </div>
  );
}

function ActionButton({ to, title, icon }) {
  return (
    <Link
      to={to}
      className="p-2 rounded-lg text-zinc-600 hover:text-zinc-200 hover:bg-white/[0.06] transition-all duration-200"
      title={title}
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        {icon}
      </svg>
    </Link>
  );
}
