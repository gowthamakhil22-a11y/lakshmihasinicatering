import { useEffect, useRef, useState } from 'react';
import { Minus, Plus, Trash2 } from 'lucide-react';
import styles from './QuantityStepper.module.css';

/**
 * − [qty] + control. The number is editable for large orders (e.g. 250 plates).
 * At the minimum, the minus button becomes a remove button when onRemove is given.
 */
export default function QuantityStepper({ value, min = 1, max = 100000, onChange, onRemove, label, size = 'md' }) {
  const [draft, setDraft] = useState(String(value));
  const [dir, setDir] = useState('up');
  const prev = useRef(value);

  useEffect(() => {
    setDir(value >= prev.current ? 'up' : 'down');
    prev.current = value;
    setDraft(String(value));
  }, [value]);

  const commit = () => {
    const n = parseInt(draft, 10);
    if (!Number.isFinite(n) || n < min) {
      setDraft(String(value));
      return;
    }
    onChange(Math.min(max, n));
  };

  const atMin = value <= min;
  const showRemove = atMin && onRemove;

  return (
    <div className={`${styles.stepper} ${styles[size]}`} role="group" aria-label={`Quantity for ${label}`}>
      <button
        type="button"
        className={styles.btn}
        onClick={() => (showRemove ? onRemove() : onChange(value - 1))}
        disabled={atMin && !onRemove}
        aria-label={showRemove ? `Remove ${label}` : `Decrease ${label}`}
      >
        <span className={styles.iconSwap} data-remove={showRemove ? 'true' : 'false'}>
          <Minus size={16} aria-hidden="true" />
          <Trash2 size={15} aria-hidden="true" />
        </span>
      </button>
      <span className={styles.valueWrap}>
        <input
          key={value}
          className={`${styles.value} ${dir === 'up' ? styles.rollUp : styles.rollDown}`}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={draft}
          onChange={(e) => setDraft(e.target.value.replace(/\D/g, '').slice(0, 6))}
          onBlur={commit}
          onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
          onFocus={(e) => e.currentTarget.select()}
          aria-label={`Quantity for ${label}`}
        />
      </span>
      <button
        type="button"
        className={styles.btn}
        onClick={() => onChange(value + 1)}
        disabled={value >= max}
        aria-label={`Increase ${label}`}
      >
        <Plus size={16} aria-hidden="true" />
      </button>
    </div>
  );
}
