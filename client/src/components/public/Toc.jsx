// "On this page": the post's h2/h3 outline as a plain list of anchors.
export default function Toc({ headings }) {
  return (
    <nav aria-label="On this page">
      <ul className="space-y-2 text-[13px] leading-snug">
        {headings.map((h) => (
          <li key={h.id} style={{ paddingLeft: h.level === 3 ? '1rem' : 0 }}>
            <a href={`#${h.id}`} className="text-zinc-400 transition-colors hover:text-brand-300">
              {h.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
