import { createContext, useCallback, useContext, useMemo, useState } from 'react';

const ToastContext = createContext(null);
let nextId = 0;

const TONES = {
  success: 'border-brand-300/60 text-brand-200',
  error: 'border-red-400/60 text-red-300',
  info: 'border-blue-400/60 text-blue-300',
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const push = useCallback((message, type = 'success', ms = 3500) => {
    const id = ++nextId;
    setToasts((t) => [...t, { id, message, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), ms);
  }, []);

  const toast = useMemo(() => {
    const fn = (msg) => push(msg, 'success');
    fn.success = (msg) => push(msg, 'success');
    fn.error = (msg) => push(msg, 'error', 5000);
    fn.info = (msg) => push(msg, 'info');
    return fn;
  }, [push]);

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="pointer-events-none fixed right-4 top-4 z-[200] flex max-w-[calc(100vw-2rem)] flex-col gap-2" role="status" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`toast-enter pointer-events-auto border bg-surface-50 px-4 py-3 text-[13px] shadow-lg shadow-black/40 ${TONES[t.type]}`}>
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
