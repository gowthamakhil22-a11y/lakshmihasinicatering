import { useEffect, useRef, useState } from 'react';

export function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
}

let sharedObserver = null;
const callbacks = new WeakMap();

function getObserver() {
  if (sharedObserver || typeof IntersectionObserver === 'undefined') return sharedObserver;
  sharedObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          callbacks.get(entry.target)?.();
          callbacks.delete(entry.target);
          sharedObserver.unobserve(entry.target);
        }
      });
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.12 },
  );
  return sharedObserver;
}

/** Returns [ref, visible]. Becomes visible once, the first time it enters the viewport. */
export function useInView() {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    const io = getObserver();
    if (!el || !io) {
      setVisible(true);
      return undefined;
    }
    callbacks.set(el, () => setVisible(true));
    io.observe(el);
    return () => {
      callbacks.delete(el);
      io.unobserve(el);
    };
  }, []);
  return [ref, visible];
}

/** Lock page scroll while a dialog is open, without layout shift. */
export function useLockBody(locked) {
  useEffect(() => {
    if (!locked) return undefined;
    const scrollbar = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.paddingRight = scrollbar ? `${scrollbar}px` : '';
    document.body.classList.add('is-locked');
    return () => {
      document.body.classList.remove('is-locked');
      document.body.style.paddingRight = '';
    };
  }, [locked]);
}

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** Trap Tab focus inside a container, close on Escape, restore focus on close. */
export function useFocusTrap(active, containerRef, onEscape) {
  const onEscapeRef = useRef(onEscape);
  onEscapeRef.current = onEscape;

  useEffect(() => {
    if (!active) return undefined;
    const container = containerRef.current;
    const previouslyFocused = document.activeElement;
    const focusFirst = () => {
      const target = container?.querySelector('[data-autofocus]') || container?.querySelector(FOCUSABLE);
      target?.focus({ preventScroll: true });
    };
    const t = setTimeout(focusFirst, 60);

    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onEscapeRef.current?.();
        return;
      }
      if (e.key !== 'Tab' || !container) return;
      const nodes = [...container.querySelectorAll(FOCUSABLE)].filter((n) => n.offsetParent !== null);
      if (!nodes.length) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      clearTimeout(t);
      document.removeEventListener('keydown', onKey);
      if (previouslyFocused instanceof HTMLElement) previouslyFocused.focus({ preventScroll: true });
    };
  }, [active, containerRef]);
}

/**
 * Keep an element mounted long enough to play its exit animation.
 * Returns { mounted, visible }.
 */
export function usePresence(open, exitMs = 450) {
  const [mounted, setMounted] = useState(open);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (open) {
      setMounted(true);
      // Two frames so the entering styles apply before transitioning.
      let raf2;
      const raf1 = requestAnimationFrame(() => {
        raf2 = requestAnimationFrame(() => setVisible(true));
      });
      return () => {
        cancelAnimationFrame(raf1);
        cancelAnimationFrame(raf2);
      };
    }
    setVisible(false);
    const t = setTimeout(() => setMounted(false), prefersReducedMotion() ? 0 : exitMs);
    return () => clearTimeout(t);
  }, [open, exitMs]);
  return { mounted, visible };
}

/**
 * Animate a thumbnail from a source element into the cart icon.
 * Uses the Web Animations API with transform and opacity only.
 */
export function flyToCart(sourceEl, targetEl, imageSrc) {
  if (!sourceEl || !targetEl || prefersReducedMotion() || !document.body.animate) return;
  const from = sourceEl.getBoundingClientRect();
  const to = targetEl.getBoundingClientRect();
  if (!from.width || !to.width) return;

  const size = imageSrc ? Math.min(from.width, from.height, 160) : 40;
  const ghost = document.createElement('div');
  ghost.setAttribute('aria-hidden', 'true');
  Object.assign(ghost.style, {
    position: 'fixed',
    left: `${from.left + from.width / 2 - size / 2}px`,
    top: `${from.top + from.height / 2 - size / 2}px`,
    width: `${size}px`,
    height: `${size}px`,
    borderRadius: '999px',
    backgroundColor: imageSrc ? '#EEF0E2' : '#C29A45',
    color: '#FFFFFF',
    display: 'grid',
    placeItems: 'center',
    font: '600 14px/1 "DM Sans", system-ui, sans-serif',
    backgroundImage: imageSrc ? `url("${imageSrc}")` : 'none',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    boxShadow: '0 12px 32px -8px rgba(15, 74, 46,.4)',
    zIndex: '120',
    pointerEvents: 'none',
    willChange: 'transform, opacity',
  });
  if (!imageSrc) ghost.textContent = '+1';
  document.body.appendChild(ghost);

  const dx = to.left + to.width / 2 - (from.left + from.width / 2);
  const dy = to.top + to.height / 2 - (from.top + from.height / 2);
  const endScale = Math.max(0.3, 20 / size);

  const anim = ghost.animate(
    [
      { transform: 'translate(0,0) scale(0.6)', opacity: 0 },
      { transform: 'translate(0,-24px) scale(0.75)', opacity: 1, offset: 0.18 },
      { transform: `translate(${dx * 0.55}px, ${dy * 0.55 - 60}px) scale(${(0.75 + endScale) / 2})`, opacity: 1, offset: 0.6 },
      { transform: `translate(${dx}px, ${dy}px) scale(${endScale})`, opacity: 0.4 },
    ],
    { duration: 820, easing: 'cubic-bezier(0.22, 1, 0.36, 1)', fill: 'forwards' },
  );
  anim.onfinish = () => ghost.remove();
  anim.oncancel = () => ghost.remove();
}
