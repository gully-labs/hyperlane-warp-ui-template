// Kit toasts: bottom-right stack, night surface, 22px radius, Lucide icon, cyan progress bar.
import { useEffect, useSyncExternalStore } from 'react';

import { Icon } from './icons';

export interface ToastMsg {
  id?: number;
  kind: 'success' | 'error' | 'info';
  title: string;
  body?: string;
  ms?: number;
}

let items: (ToastMsg & { id: number })[] = [];
let seq = 0;
const subs = new Set<() => void>();
const emit = () => subs.forEach((f) => f());

export function toast(t: ToastMsg) {
  const id = ++seq;
  items = [...items.slice(-3), { ms: 5200, ...t, id }];
  emit();
  return id;
}
function dismiss(id: number) {
  items = items.filter((t) => t.id !== id);
  emit();
}

function Toast({ t }: { t: ToastMsg & { id: number } }) {
  useEffect(() => {
    const h = setTimeout(() => dismiss(t.id), t.ms);
    return () => clearTimeout(h);
  }, [t.id, t.ms]);
  return (
    <div className={`toast toast-${t.kind}`} role={t.kind === 'error' ? 'alert' : 'status'}>
      <span className="toast-ic">
        <Icon name={t.kind === 'success' ? 'check' : t.kind === 'error' ? 'alert' : 'info'} size={18} />
      </span>
      <div className="toast-txt">
        <b>{t.title}</b>
        {t.body && <span>{t.body}</span>}
      </div>
      <button className="toast-x" aria-label="Dismiss" onClick={() => dismiss(t.id)}>
        <Icon name="x" size={16} />
      </button>
      <i className="toast-bar" style={{ animationDuration: `${t.ms}ms` }} />
    </div>
  );
}

export function Toaster() {
  const ts = useSyncExternalStore(
    (f) => {
      subs.add(f);
      return () => {
        subs.delete(f);
      };
    },
    () => items,
    () => items,
  );
  return (
    <div className="toasts" aria-live="polite">
      {ts.map((t) => (
        <Toast key={t.id} t={t} />
      ))}
    </div>
  );
}
