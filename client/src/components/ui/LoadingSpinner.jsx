// Centred on the screen itself (not on the page column), and out of the way of clicks
export default function LoadingSpinner({ text = 'Loading' }) {
  return (
    <div className="pointer-events-none fixed inset-0 z-10 flex flex-col items-center justify-center gap-4" role="status">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/15 border-t-brand-300" aria-hidden />
      <p className="label">{text}</p>
    </div>
  );
}
