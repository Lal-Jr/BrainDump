// Hand-drawn marks in the portfolio's style (zigzags, sparks, arrows, stress lines). Purely
// decorative, so they're aria-hidden and ignore the pointer. Strokes draw themselves in via CSS.
const SHAPES = {
  zigzag: { d: ['M10 50 L30 20 L50 80 L70 20 L90 50'] },
  wave: { d: ['M8 50 Q29 0 50 50 T92 50'] },
  scribble: { d: ['M30 50 C30 20 70 20 70 50 C70 80 30 80 30 50 C30 30 60 30 60 50 C60 70 40 70 40 50'] },
  spark: { d: ['M50 30 Q52 15 50 0', 'M75 40 Q85 32 100 25', 'M80 65 Q92 72 100 85', 'M50 75 Q48 90 50 100', 'M20 68 Q10 75 0 85', 'M22 35 Q12 28 0 20'] },
  arrow: { d: ['M10 10 Q50 10 80 60', 'M60 50 L80 60 L90 40'] },
  plus: { d: ['M50 18 V82', 'M18 50 H82'] },
  asterisk: { d: ['M50 15 V85', 'M20 32 L80 68', 'M80 32 L20 68'] },
  bracket: { d: ['M18 40 V18 H40', 'M60 18 H82 V40', 'M82 60 V82 H60', 'M40 82 H18 V60'] },
  stress: { d: ['M20 80 Q50 50 90 10', 'M50 90 Q65 60 95 40', 'M10 60 Q40 55 90 50'] },
  squiggle: { box: '0 0 100 14', d: ['M0 7 Q10 2 20 7 T40 7 T60 7 T80 7 T100 7'] },
  underline: { box: '0 0 100 14', d: ['M2 8 C 22 2, 40 12, 60 6 S 90 4, 98 8'] },
};

export function Doodle({ name, className = '', stroke = 3, delay = 0 }) {
  if (name === 'circle') {
    // a static dashed ring: no draw-in
    return (
      <svg viewBox="0 0 100 100" className={`pointer-events-none select-none ${className}`} fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" aria-hidden>
        <circle cx="50" cy="50" r="40" strokeDasharray="3 9" />
      </svg>
    );
  }
  const shape = SHAPES[name];
  if (!shape) return null;
  return (
    <svg
      viewBox={shape.box ?? '0 0 100 100'}
      className={`doodle pointer-events-none select-none ${className}`}
      fill="none"
      stroke="currentColor"
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {shape.d.map((d) => (
        <path key={d} d={d} pathLength="1" style={{ animationDelay: `${0.25 + delay}s` }} />
      ))}
    </svg>
  );
}
