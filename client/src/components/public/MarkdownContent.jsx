import { useEffect, useMemo, useRef } from 'react';
import { renderMarkdown } from '../../lib/markdown';

// Renders sanitized markdown, then adds a "copy" button to each code block.
export default function MarkdownContent({ content, html: prerendered }) {
  const html = useMemo(() => prerendered ?? renderMarkdown(content).html, [content, prerendered]);
  const ref = useRef(null);

  useEffect(() => {
    ref.current?.querySelectorAll('pre').forEach((pre) => {
      if (pre.querySelector('.code-copy')) return;
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'code-copy';
      button.textContent = 'Copy';
      button.setAttribute('aria-label', 'Copy code');
      pre.appendChild(button);
    });
  }, [html]);

  const onClick = (e) => {
    const button = e.target.closest?.('.code-copy');
    if (!button) return;
    const code = button.parentElement.querySelector('code')?.innerText ?? '';
    navigator.clipboard?.writeText(code).then(() => {
      button.textContent = 'Copied';
      setTimeout(() => (button.textContent = 'Copy'), 1500);
    });
  };

  return <div ref={ref} className="prose-custom" onClick={onClick} dangerouslySetInnerHTML={{ __html: html }} />;
}
