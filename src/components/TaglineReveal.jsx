import { useEffect, useRef, useState } from 'react';
import { prefersReducedMotion } from '../hooks/useMotion.js';
import styles from './TaglineReveal.module.css';

const TEXT =
  'We cook every dish with the care we would give our own family, so you can be present for every moment of your celebration.';
const WORDS = TEXT.split(' ');

/** Large statement whose words light up one by one as it scrolls through the viewport. */
export default function TaglineReveal() {
  const ref = useRef(null);
  const [lit, setLit] = useState(() => (prefersReducedMotion() ? WORDS.length : 0));

  useEffect(() => {
    if (prefersReducedMotion()) return undefined;
    const el = ref.current;
    let ticking = false;
    let active = false;
    const update = () => {
      ticking = false;
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight;
      // Starts lighting when the block's top passes 85% of the viewport, completes at 35%.
      const start = vh * 0.85;
      const end = vh * 0.35 - rect.height * 0.5;
      const progress = Math.min(1, Math.max(0, (start - rect.top) / (start - end)));
      setLit(Math.round(progress * WORDS.length));
    };
    const onScroll = () => {
      if (active && !ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    };
    // Only listen while the section is near the viewport.
    const io = new IntersectionObserver(
      ([entry]) => {
        active = entry.isIntersecting;
        if (active) update();
      },
      { rootMargin: '20% 0px 20% 0px' },
    );
    io.observe(el);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      io.disconnect();
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  return (
    <section className={`section ${styles.section}`} aria-label="Our promise">
      <div className="container">
        <p className={styles.eyebrow}>Our promise</p>
        <p ref={ref} className={styles.text} aria-label={TEXT}>
          {WORDS.map((w, i) => (
            <span key={i} aria-hidden="true" className={`${styles.word} ${i < lit ? styles.on : ''}`}>
              {w}{' '}
            </span>
          ))}
        </p>
      </div>
    </section>
  );
}
