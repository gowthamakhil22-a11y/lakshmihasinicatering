import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Leaf, Sparkles } from 'lucide-react';
import { assetUrl } from '../config/appConfig.js';
import { prefersReducedMotion } from '../hooks/useMotion.js';
import { useCart } from '../hooks/useCart.js';
import { BrandMark, Flourish, Lotus } from './BrandMark.jsx';
import styles from './Hero.module.css';

const LINES = [['Good', 'Food.'], ['Beautiful', 'Occasions.']];

function useParallax(ref, strength = 0.08) {
  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion() || !window.matchMedia('(min-width: 1024px)').matches) return undefined;
    let ticking = false;
    const update = () => {
      const y = Math.min(window.scrollY, 900);
      el.style.transform = `translate3d(0, ${y * strength}px, 0)`;
      ticking = false;
    };
    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [ref, strength]);
}

export default function Hero({ description }) {
  const { open, count } = useCart();
  const [ready, setReady] = useState(false);
  const mainRef = useRef(null);
  const sideRef = useRef(null);
  useParallax(mainRef, -0.04);
  useParallax(sideRef, 0.1);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  let wordIndex = 0;

  return (
    <section id="top" className={`${styles.hero} ${ready ? styles.ready : ''}`} aria-labelledby="hero-title">
      <span className={styles.panel} aria-hidden="true" />
      <span className={styles.panelLine} aria-hidden="true" />
      <Lotus className={styles.lotus} />
      <div className={`container ${styles.grid}`}>
        <div className={styles.copy}>
          <p className={`eyebrow ${styles.eyebrow}`}>Lakshmi Hasini Catering</p>
          <h1 id="hero-title" className={`heading-1 ${styles.title}`}>
            {LINES.map((line, li) => (
              <span key={li} className={`${styles.line} ${li === 1 ? styles.accent : ''}`}>
                {line.map((word) => {
                  const i = wordIndex++;
                  return (
                    <span key={word} className={styles.mask}>
                      <span className={styles.word} style={{ '--w': i }}>
                        {word}
                      </span>
                    </span>
                  );
                })}
              </span>
            ))}
          </h1>
          <Flourish className={`${styles.flourish} ${styles.fade}`} />
          <p className={`${styles.lede} ${styles.fade}`} style={{ '--d': '520ms' }}>
            {description}
          </p>
          <div className={`${styles.ctas} ${styles.fade}`} style={{ '--d': '640ms' }}>
            <a href="#menu" className="btn btn-primary">
              Explore our menu
              <ArrowRight size={18} className="btn-arrow" aria-hidden="true" />
            </a>
            <button type="button" className="btn btn-outline" onClick={() => open(count ? 0 : 1)}>
              Send enquiry
            </button>
          </div>
          <ul className={`${styles.points} ${styles.fade}`} style={{ '--d': '760ms' }}>
            <li>
              <Leaf size={16} aria-hidden="true" /> Vegetarian and non vegetarian menus
            </li>
            <li>
              <Sparkles size={16} aria-hidden="true" /> Menus planned around your guests
            </li>
          </ul>
        </div>

        <div className={styles.visual}>
          <div className={styles.mainWrap} ref={mainRef}>
            <div className={styles.main}>
              <img
                src={assetUrl('images/hero-banana-leaf-meal.webp')}
                alt="A traditional South Indian meal served on a banana leaf with rice, curries, poriyal and papad"
                width="960"
                height="1120"
                fetchpriority="high"
                decoding="async"
              />
            </div>
          </div>
          <div className={styles.sideWrap} ref={sideRef}>
            <div className={styles.side}>
              <img
                src={assetUrl('images/hero-spread.webp')}
                alt="A spread of dosa, chutneys and sambar in small bowls"
                width="900"
                height="900"
                loading="lazy"
                decoding="async"
              />
            </div>
          </div>
          <div className={styles.card}>
            <span className={styles.cardEyebrow}>Catering for</span>
            <span className={styles.cardTitle}>Weddings, family functions and corporate events</span>
          </div>
          <span className={styles.seal} aria-hidden="true">
            <svg viewBox="0 0 100 100">
              <defs>
                <path id="seal-path" d="M50,50 m-36,0 a36,36 0 1,1 72,0 a36,36 0 1,1 -72,0" />
              </defs>
              <text>
                <textPath href="#seal-path" textLength="222" lengthAdjust="spacingAndGlyphs">
                  FRESHLY PREPARED • SERVED WITH CARE •
                </textPath>
              </text>
            </svg>
            <span className={styles.sealMark}>
              <BrandMark size={44} />
            </span>
          </span>
        </div>
      </div>
    </section>
  );
}
