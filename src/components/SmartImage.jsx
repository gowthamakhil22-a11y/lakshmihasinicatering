import { useState } from 'react';
import { UtensilsCrossed } from 'lucide-react';
import styles from './SmartImage.module.css';

/** Lazy image that fades in once decoded and falls back to a branded placeholder. */
export default function SmartImage({ src, alt, className = '', eager = false, sizes, width = 720, height = 540 }) {
  const [state, setState] = useState(src ? 'loading' : 'error');
  return (
    <div className={`${styles.frame} ${className}`} data-state={state}>
      {state !== 'error' && (
        <img
          src={src}
          alt={alt}
          width={width}
          height={height}
          sizes={sizes}
          loading={eager ? 'eager' : 'lazy'}
          decoding="async"
          fetchpriority={eager ? 'high' : 'auto'}
          onLoad={() => setState('loaded')}
          onError={() => setState('error')}
          className={styles.img}
        />
      )}
      {state === 'error' && (
        <div className={styles.fallback} role={alt ? 'img' : undefined} aria-label={alt || undefined}>
          <UtensilsCrossed size={28} strokeWidth={1.25} aria-hidden="true" />
        </div>
      )}
    </div>
  );
}
