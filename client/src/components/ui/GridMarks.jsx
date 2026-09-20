import { Doodle } from './Doodles';

// Three faint registration marks in the margins: enough to feel drawn on, not enough to notice.
// Desktop only, behind the content, never take the pointer.
const MARKS = [
  { name: 'plus', pos: { top: '16%', left: '4%' }, size: 18, color: 'text-zinc-700' },
  { name: 'bracket', pos: { top: '60%', right: '3.5%' }, size: 34, color: 'text-zinc-700' },
  { name: 'zigzag', pos: { bottom: '10%', left: '5%' }, size: 40, color: 'text-brand-300/25' },
];

export default function GridMarks() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0 hidden overflow-hidden xl:block">
      {MARKS.map((m, i) => (
        <span key={i} className={`absolute ${m.color}`} style={{ ...m.pos, width: m.size, height: m.size }}>
          <Doodle name={m.name} className="h-full w-full" stroke={3} delay={i * 0.2} />
        </span>
      ))}
    </div>
  );
}
