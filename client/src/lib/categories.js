// The four kinds of writing on this blog. Colours come from the portfolio's comic palette.
export const CATEGORIES = {
  thoughts: { label: 'Thoughts', color: '#f472b6', blurb: "Things I'm turning over in my head." },
  'how-i-work': { label: 'How I work', color: '#facc15', blurb: 'Tools, habits and process.' },
  engineering: { label: 'Engineering', color: '#4ade80', blurb: 'Notes from building software.' },
  research: { label: 'Research', color: '#60a5fa', blurb: "Things I'm digging into." },
};
export const CATEGORY_KEYS = Object.keys(CATEGORIES);
export const categoryOf = (key) => CATEGORIES[key] ?? CATEGORIES.thoughts;
