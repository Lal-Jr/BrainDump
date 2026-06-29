import { useMemo } from 'react';
import MarkdownIt from 'markdown-it';
import hljs from 'highlight.js/lib/core';
import javascript from 'highlight.js/lib/languages/javascript';
import typescript from 'highlight.js/lib/languages/typescript';
import css from 'highlight.js/lib/languages/css';
import json from 'highlight.js/lib/languages/json';
import bash from 'highlight.js/lib/languages/bash';
import python from 'highlight.js/lib/languages/python';
import markdown from 'highlight.js/lib/languages/markdown';
import yaml from 'highlight.js/lib/languages/yaml';
import taskLists from 'markdown-it-task-lists';
import 'highlight.js/styles/atom-one-dark.css';

hljs.registerLanguage('javascript', javascript);
hljs.registerLanguage('js', javascript);
hljs.registerLanguage('jsx', javascript);
hljs.registerLanguage('ts', typescript);
hljs.registerLanguage('tsx', typescript);
hljs.registerLanguage('css', css);
hljs.registerLanguage('json', json);
hljs.registerLanguage('bash', bash);
hljs.registerLanguage('sh', bash);
hljs.registerLanguage('python', python);
hljs.registerLanguage('py', python);
hljs.registerLanguage('markdown', markdown);
hljs.registerLanguage('md', markdown);
hljs.registerLanguage('yaml', yaml);
hljs.registerLanguage('yml', yaml);

const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
  breaks: true,
  highlight(str, lang) {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return hljs.highlight(str, { language: lang, ignoreIllegals: true }).value;
      } catch (error) {
        console.error(error);
      }
    }

    try {
      return hljs.highlightAuto(str).value;
    } catch (error) {
      console.error(error);
      return md.utils.escapeHtml(str);
    }
  },
});

md.use(taskLists, { enabled: true });

function normalizeEmbeds(text = '') {
  return text
    .replace(/\{\{video:(https?:\/\/[^\s]+)\}\}/gi, (_match, src) => {
      return `<div class="embed-shell"><video controls preload="metadata" src="${src}"></video></div>`;
    })
    .replace(/\{\{pdf:(https?:\/\/[^\s]+)\}\}/gi, (_match, src) => {
      return `<div class="embed-shell"><iframe src="${src}" title="Embedded PDF" loading="lazy"></iframe></div>`;
    });
}

export default function MarkdownRenderer({ content }) {
  const html = useMemo(() => md.render(normalizeEmbeds(content || '')), [content]);

  return (
    <div
      className="prose-custom"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
