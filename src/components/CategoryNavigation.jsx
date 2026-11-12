import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import styles from './CategoryNavigation.module.css';

/**
 * Horizontally scrollable category chips with a sliding active indicator.
 * Uses roving tabindex and arrow keys, following the tablist pattern.
 */
export default function CategoryNavigation({ categories, active, onChange, counts }) {
  const listRef = useRef(null);
  const [indicator, setIndicator] = useState({ x: 0, w: 0, ready: false });
  const all = [{ id: 'all', name: 'All items' }, ...categories];

  const measure = () => {
    const list = listRef.current;
    const btn = active ? list?.querySelector(`[data-id="${CSS.escape(active)}"]`) : null;
    if (!btn) {
      setIndicator((s) => ({ ...s, ready: false }));
      return;
    }
    setIndicator({ x: btn.offsetLeft, w: btn.offsetWidth, ready: true });
  };

  useLayoutEffect(measure, [active, categories]);

  useEffect(() => {
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(measure) : null;
    if (ro && listRef.current) ro.observe(listRef.current);
    document.fonts?.ready.then(measure);
    return () => ro?.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  // Keep the active chip in view.
  useEffect(() => {
    const list = listRef.current;
    const btn = active ? list?.querySelector(`[data-id="${CSS.escape(active)}"]`) : null;
    if (!list || !btn) return;
    const target = btn.offsetLeft - list.clientWidth / 2 + btn.offsetWidth / 2;
    list.scrollTo({ left: Math.max(0, target), behavior: 'smooth' });
  }, [active]);

  const onKeyDown = (e) => {
    const idx = Math.max(0, all.findIndex((c) => c.id === active));
    let next = null;
    if (e.key === 'ArrowRight') next = all[(idx + 1) % all.length];
    if (e.key === 'ArrowLeft') next = all[(idx - 1 + all.length) % all.length];
    if (e.key === 'Home') next = all[0];
    if (e.key === 'End') next = all[all.length - 1];
    if (next) {
      e.preventDefault();
      onChange(next.id);
      requestAnimationFrame(() => listRef.current?.querySelector(`[data-id="${CSS.escape(next.id)}"]`)?.focus());
    }
  };

  return (
    <div className={styles.wrap}>
      <div className={styles.scroller} ref={listRef} role="tablist" aria-label="Menu categories" onKeyDown={onKeyDown}>
        <span
          className={`${styles.indicator} ${indicator.ready ? styles.ready : ''}`}
          style={{ transform: `translateX(${indicator.x}px)`, width: indicator.w }}
          aria-hidden="true"
        />
        {all.map((c) => {
          const selected = c.id === active;
          return (
            <button
              key={c.id}
              type="button"
              role="tab"
              data-id={c.id}
              aria-selected={selected}
              aria-controls="menu-results"
              tabIndex={selected || (!active && c.id === 'all') ? 0 : -1}
              className={`${styles.chip} ${selected ? styles.selected : ''}`}
              onClick={() => onChange(c.id)}
            >
              {c.name}
              {counts?.[c.id] !== undefined && <span className={styles.count}>{counts[c.id]}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
