import { useEffect } from 'react';

// Per-page <title> and description for the SPA (the server also injects these into
// the initial HTML for post URLs so link previews work).
export function useDocumentMeta(title, description) {
  useEffect(() => {
    if (!title) return;
    const prevTitle = document.title;
    document.title = title;

    let meta = document.querySelector('meta[name="description"]');
    const created = !meta;
    const prevDesc = meta?.getAttribute('content');
    if (description) {
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute('name', 'description');
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', description);
    }

    return () => {
      document.title = prevTitle;
      if (created && meta) meta.remove();
      else if (meta && prevDesc != null) meta.setAttribute('content', prevDesc);
    };
  }, [title, description]);
}
