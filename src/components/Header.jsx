import { useEffect, useRef, useState } from 'react';
import { ShoppingBag } from 'lucide-react';
import { useCart } from '../hooks/useCart.js';
import { useFocusTrap, useLockBody } from '../hooks/useMotion.js';
import { BrandMark } from './BrandMark.jsx';
import styles from './Header.module.css';

export const NAV_LINKS = [
  { id: 'menu', label: 'Menu' },
  { id: 'packages', label: 'Packages' },
  { id: 'how-it-works', label: 'How it works' },
  { id: 'contact', label: 'Contact' },
];

function useScrollDirection() {
  const [state, setState] = useState({ hidden: false, scrolled: false });
  useEffect(() => {
    let lastY = window.scrollY;
    let ticking = false;
    const update = () => {
      const y = window.scrollY;
      const delta = y - lastY;
      setState((s) => {
        const scrolled = y > 24;
        let hidden = s.hidden;
        if (y < 120) hidden = false;
        else if (delta > 6) hidden = true;
        else if (delta < -6) hidden = false;
        return s.hidden === hidden && s.scrolled === scrolled ? s : { hidden, scrolled };
      });
      lastY = y;
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
  }, []);
  return state;
}

function useActiveSection(ids) {
  const [active, setActive] = useState('');
  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return undefined;
    const visible = new Map();
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => visible.set(e.target.id, e.isIntersecting));
        const current = ids.find((id) => visible.get(id));
        setActive(current || '');
      },
      { rootMargin: '-40% 0px -55% 0px' },
    );
    const els = ids.map((id) => document.getElementById(id)).filter(Boolean);
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [ids]);
  return active;
}

const SECTION_IDS = NAV_LINKS.map((l) => l.id);

export default function Header({ businessName }) {
  const { count, open, cartIconRef, isOpen: cartOpen } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);
  const { hidden, scrolled } = useScrollDirection();
  const active = useActiveSection(SECTION_IDS);
  const panelRef = useRef(null);
  const [bump, setBump] = useState(0);
  const prevCount = useRef(count);

  useEffect(() => {
    if (count > prevCount.current) setBump((b) => b + 1);
    prevCount.current = count;
  }, [count]);

  useLockBody(menuOpen);
  useFocusTrap(menuOpen, panelRef, () => setMenuOpen(false));

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 900px)');
    const onChange = () => mq.matches && setMenuOpen(false);
    mq.addEventListener?.('change', onChange);
    return () => mq.removeEventListener?.('change', onChange);
  }, []);

  const isHidden = hidden && !menuOpen && !cartOpen;

  useEffect(() => {
    document.body.classList.toggle('header-hidden', isHidden);
  }, [isHidden]);

  return (
    <>
      <header
        ref={panelRef}
        className={`${styles.header} ${isHidden ? styles.hidden : ''} ${scrolled || menuOpen ? styles.scrolled : ''}`}
      >
        <div className={styles.bar}>
          <a href="#top" className={styles.brand} onClick={() => setMenuOpen(false)} aria-label={`${businessName}, back to top`}>
            <span className={styles.mark}>
              <BrandMark size={34} />
            </span>
            <span className={styles.wordmark}>
              <span className={styles.wordTop}>Lakshmi Hasini</span>
              <span className={styles.wordBottom}>Catering</span>
            </span>
          </a>

          <nav className={styles.nav} aria-label="Main">
            {NAV_LINKS.map((link) => (
              <a
                key={link.id}
                href={`#${link.id}`}
                className={`${styles.link} ${active === link.id ? styles.active : ''}`}
                aria-current={active === link.id ? 'location' : undefined}
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className={styles.actions}>
            <button
              ref={cartIconRef}
              type="button"
              className={styles.cart}
              onClick={() => {
                setMenuOpen(false);
                open(0);
              }}
              aria-label={`Open enquiry, ${count} ${count === 1 ? 'item' : 'items'} selected`}
            >
              <ShoppingBag size={20} strokeWidth={1.75} aria-hidden="true" />
              <span className={styles.cartLabel}>Enquiry</span>
              <span
                key={bump}
                className={`${styles.badge} ${count ? styles.badgeOn : ''} ${bump ? styles.badgeBump : ''}`}
                aria-hidden="true"
              >
                {count}
              </span>
            </button>

            <button
              type="button"
              className={`${styles.toggle} ${menuOpen ? styles.toggleOpen : ''}`}
              onClick={() => setMenuOpen((o) => !o)}
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            >
              <span className={styles.line} />
              <span className={styles.line} />
            </button>
          </div>
        </div>

          <div
            id="mobile-menu"
            className={`${styles.panel} ${menuOpen ? styles.panelOpen : ''}`}
            aria-hidden={!menuOpen}
            inert={menuOpen ? undefined : ''}
          >
            <nav aria-label="Mobile">
              <ol className={styles.panelList}>
                {NAV_LINKS.map((link, i) => (
                  <li key={link.id} style={{ '--i': i }}>
                    <a
                      href={`#${link.id}`}
                      className={`${styles.panelLink} ${active === link.id ? styles.panelActive : ''}`}
                      onClick={() => setMenuOpen(false)}
                    >
                      <span className={styles.panelIndex}>0{i + 1}</span>
                      {link.label}
                    </a>
                  </li>
                ))}
              </ol>
            </nav>
            <div className={styles.panelFoot} style={{ '--i': NAV_LINKS.length }}>
              <button
                type="button"
                className="btn btn-primary btn-block"
                onClick={() => {
                  setMenuOpen(false);
                  open(count ? 0 : 1);
                }}
              >
                Send enquiry
              </button>
            </div>
          </div>
      </header>
    </>
  );
}
