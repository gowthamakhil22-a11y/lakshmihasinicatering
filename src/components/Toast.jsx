import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { CheckCircle2, X } from 'lucide-react';
import styles from './Toast.module.css';

const ToastContext = createContext(null);
let nextId = 1;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef(new Map());

  const dismiss = useCallback((id) => {
    setToasts((list) => list.map((t) => (t.id === id ? { ...t, leaving: true } : t)));
    setTimeout(() => setToasts((list) => list.filter((t) => t.id !== id)), 320);
    clearTimeout(timers.current.get(id));
    timers.current.delete(id);
  }, []);

  const show = useCallback(
    ({ message, action, duration = 2400 }) => {
      const id = nextId++;
      // Keep at most two toasts so the screen never gets crowded.
      setToasts((list) => [...list.slice(-1), { id, message, action }]);
      timers.current.set(id, setTimeout(() => dismiss(id), duration));
    },
    [dismiss],
  );

  const value = useMemo(() => ({ show }), [show]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className={styles.region} role="status" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`${styles.toast} ${t.leaving ? styles.leaving : ''}`}>
            <CheckCircle2 size={18} className={styles.icon} aria-hidden="true" />
            <span className={styles.message}>{t.message}</span>
            {t.action && (
              <button
                type="button"
                className={styles.action}
                onClick={() => {
                  t.action.onClick();
                  dismiss(t.id);
                }}
              >
                {t.action.label}
              </button>
            )}
            <button type="button" className={styles.close} onClick={() => dismiss(t.id)} aria-label="Dismiss">
              <X size={16} aria-hidden="true" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
