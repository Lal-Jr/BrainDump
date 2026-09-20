import { categoryOf } from '../../lib/categories';

// A category: a small coloured dot and its name (see .cat in index.css)
export function CategoryLabel({ category, className = '' }) {
  const { label, color } = categoryOf(category);
  return (
    <span className={`cat ${className}`} style={{ '--cat': color }}>
      {label}
    </span>
  );
}
