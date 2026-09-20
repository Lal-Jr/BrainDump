export default function LoadingSpinner({ text = 'Loading' }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-24" role="status">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/15 border-t-brand-300" aria-hidden />
      <p className="label">{text}</p>
    </div>
  );
}
