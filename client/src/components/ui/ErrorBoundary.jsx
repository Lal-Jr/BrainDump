import { Component } from 'react';

export default class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught:', error, info);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="flex min-h-[50vh] items-center justify-center px-5">
        <div className="max-w-sm animate-fade-in text-center">
          <p className="label mb-3 text-red-400">Error</p>
          <h2 className="text-xl font-bold text-zinc-100">Something went wrong</h2>
          <p className="mt-2 text-sm text-zinc-500">The page hit an unexpected problem. Reloading usually fixes it.</p>
          <button className="btn-primary mt-6" onClick={() => window.location.reload()}>
            Reload page
          </button>
        </div>
      </div>
    );
  }
}
