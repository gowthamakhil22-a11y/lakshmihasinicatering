import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { BrandMark } from '../components/BrandMark.jsx';
import EnquirySheet from '../components/EnquirySheet.jsx';
import { WhatsAppIcon } from '../components/WhatsAppButton.jsx';
import { assetUrl } from '../config/appConfig.js';
import { useBusiness } from '../hooks/useBusiness.js';
import { useMenu } from '../hooks/useMenu.js';
import { makeT, pick } from '../i18n.js';
import { playPageTurn } from '../utils/pageSound.js';
import styles from './MenuBook.module.css';

const KEYS = {
  selection: 'lhc.menucard.selection.v1',
  lang: 'lhc.lang.v1',
  veg: 'lhc.vegOnly.v1',
  sound: 'lhc.sound.v1',
  tickHint: 'lhc.tickHintSeen.v1',
};
const FLIP_MS = 1000;
const STAGGER_MS = 120;
const BEND_DEG = 55; // how far the free edge leads the spine edge mid-turn

const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
const easeOut = (t) => 1 - (1 - t) ** 3;

/**
 * Shape of a bending page at progress p (0 = flat on the right, 1 = flat on the left).
 * The sheet is cut into vertical strips; each turns a little more than the one before,
 * so the page curves evenly from top to bottom, with the free edge leading.
 */
function bendShape(p, curve) {
  const theta = -180 * p;
  const bend = -BEND_DEG * Math.sin(Math.PI * p);
  const n = curve.length - 1;
  const rot = [];
  for (let i = 0; i < n; i++) rot.push(i === 0 ? theta : bend * (curve[i] - curve[i - 1]));
  // Darkness at each strip boundary: paper turned away from the light gets darker.
  const shade = curve.map((c) => {
    const a = ((theta + bend * c) * Math.PI) / 180;
    return 0.48 * (1 - Math.abs(Math.cos(a)));
  });
  return { rot, shade };
}

const stripTransform = (i, deg) => (i === 0 ? `rotateY(${deg.toFixed(2)}deg)` : `translateX(100%) rotateY(${deg.toFixed(2)}deg)`);
const shadeFront = (a, b) => `linear-gradient(90deg, rgba(28,18,4,${a.toFixed(3)}), rgba(28,18,4,${b.toFixed(3)}))`;
const reducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/* ---------- storage + url helpers ---------- */

function readJSON(key, fallback) {
  try {
    const v = localStorage.getItem(key);
    return v == null ? fallback : JSON.parse(v);
  } catch {
    return fallback;
  }
}
function usePersistent(key, initial) {
  const [value, setValue] = useState(() => readJSON(key, initial));
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* storage blocked */
    }
  }, [key, value]);
  return [value, setValue];
}

/** ?s=BF02,LU01,~PK01 → selection keys (a family member shared their choices). */
function readSharedSelection() {
  try {
    const s = new URLSearchParams(window.location.search).get('s');
    if (s === null) return null;
    return s
      .split(',')
      .map((x) => x.trim())
      .filter((x) => /^~?[\w-]{1,40}$/.test(x))
      .slice(0, 300)
      .map((x) => (x.startsWith('~') ? `pkg:${x.slice(1)}` : `item:${x}`));
  } catch {
    return null;
  }
}

function buildShareUrl(selected) {
  const ids = [...selected]
    .map((k) => (k.startsWith('pkg:') ? `~${k.slice(4)}` : k.startsWith('item:') ? k.slice(5) : null))
    .filter(Boolean);
  const u = new URL(window.location.href);
  u.search = '';
  u.hash = '';
  return ids.length ? `${u.toString()}?s=${ids.join(',')}` : u.toString();
}

/* ---------- layout ---------- */

function useViewport() {
  const [vp, setVp] = useState(() => ({ w: window.innerWidth, h: window.innerHeight }));
  useEffect(() => {
    let raf = 0;
    const onResize = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => setVp({ w: window.innerWidth, h: window.innerHeight }));
    };
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      cancelAnimationFrame(raf);
    };
  }, []);
  return vp;
}

/** Two-page spread on tablets and laptops, one page at a time on phones. */
function computeLayout({ w, h }) {
  const spread = w >= 760 && h >= 560;
  const dock = 84;
  if (spread) {
    let pageH = Math.min(h - dock - 40, 860);
    let pageW = Math.round(pageH * 0.7);
    const maxW = Math.floor((w - 72) / 2);
    if (pageW > maxW) {
      pageW = maxW;
      pageH = Math.min(pageH, Math.round(pageW / 0.62));
    }
    return { spread, pageW, pageH: Math.round(pageH) };
  }
  const pageW = Math.min(w - 20, 520);
  const pageH = Math.min(h - dock - 16, Math.round(pageW * 1.8));
  return { spread, pageW, pageH };
}

function splitName(name) {
  const m = name.match(/^(.*?)\s+(catering|caterers)$/i);
  return m ? { main: m[1], sub: m[2] } : { main: name, sub: '' };
}

/* ---------- small pieces ---------- */

function FoodMark({ type, label }) {
  if (!type) return <span className={styles.markSpacer} aria-hidden="true" />;
  return (
    <span className={styles.mark} data-type={type} role="img" aria-label={label} title={label}>
      <span />
    </span>
  );
}

function Rule() {
  return (
    <span className={styles.ruleOrn} aria-hidden="true">
      <span />
      <svg width="22" height="10" viewBox="0 0 22 10" fill="currentColor">
        <path d="M11 0.5 13.6 5 11 9.5 8.4 5Z" />
        <circle cx="3" cy="5" r="1.2" />
        <circle cx="19" cy="5" r="1.2" />
      </svg>
      <span />
    </span>
  );
}

function Corner({ className }) {
  return (
    <svg className={className} width="34" height="34" viewBox="0 0 34 34" fill="none" aria-hidden="true">
      <path d="M1 33V9a8 8 0 0 1 8-8h24" stroke="currentColor" strokeWidth="1" />
      <path d="M6 33V12a6 6 0 0 1 6-6h21" stroke="currentColor" strokeWidth=".7" opacity=".7" />
      <path d="M10 10c3 0 5 2 5 5-3 0-5-2-5-5Z" fill="currentColor" />
    </svg>
  );
}

/** Words to choose between; the chosen one gets a pen circle. */
function Picks({ options, value, onChange, label, dark = false }) {
  return (
    <span className={styles.picks} data-dark={dark || undefined} role="radiogroup" aria-label={label}>
      {options.map((o) => (
        <button
          key={String(o.value)}
          type="button"
          role="radio"
          lang={o.lang}
          aria-checked={value === o.value}
          className={styles.pick}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </span>
  );
}

function Block({ block, selected, onToggle, lang, t, hint }) {
  if (block.type === 'head') {
    const s = block.section;
    return (
      <div className={styles.secHead}>
        <h2>{pick(lang, s.title, s.titleTe)}</h2>
        {s.description && <p>{pick(lang, s.description, s.descriptionTe)}</p>}
        <Rule />
      </div>
    );
  }
  if (block.type === 'contd') {
    return (
      <p className={styles.contd}>
        {pick(lang, block.section.title, block.section.titleTe)} <em>{t('contd')}</em>
      </p>
    );
  }
  const { row } = block;
  const checked = selected?.has(row.key) || false;
  const name = pick(lang, row.name, row.nameTe);
  const alt = lang === 'te' ? (row.nameTe ? row.name : '') : row.nameTe;
  const desc = pick(lang, row.description, row.descriptionTe);
  const markLabel = row.foodType === 'veg' ? t('legend.veg') : row.foodType ? t('legend.nonveg') : '';
  return (
    <label className={styles.item} data-checked={checked || undefined} data-img={row.image ? true : undefined}>
      {row.image && <img className={styles.thumb} src={row.image} alt="" loading="lazy" />}
      <input
        type="checkbox"
        className="visually-hidden"
        checked={checked}
        onChange={(e) => onToggle?.(row.key, e.currentTarget)}
        tabIndex={onToggle ? undefined : -1}
      />
      <span className={styles.itemLine}>
        <FoodMark type={row.foodType} label={markLabel} />
        <span className={styles.itemName}>{name}</span>
        <span className={styles.leader} aria-hidden="true" />
        <span className={styles.box} data-box aria-hidden="true">
          <svg viewBox="0 0 20 20" width="20" height="20">
            <path d="M4.5 10.5 8.5 14.5 16 5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </span>
      {(alt || desc) && (
        <span className={styles.itemDesc}>
          {alt && <b className={styles.alt}>{alt}</b>}
          {alt && desc ? ' · ' : ''}
          {desc}
        </span>
      )}
      {row.minGuests > 1 && <span className={styles.itemMeta}>{t('meta.from', row.minGuests)}</span>}
      {hint && (
        <span className={styles.tickHint} aria-hidden="true">
          {t('hint.tick')}
          <svg width="34" height="26" viewBox="0 0 34 26" fill="none">
            <path d="M2 4c10-2 22 2 27 15" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            <path d="M24 16.5 29.5 20 31 13.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      )}
    </label>
  );
}

/** A turning page drawn as nested strips (only while it moves). */
function BentLeaf({ curve, p0, front, back, frontKind, backKind }) {
  const n = curve.length - 1;
  const { rot, shade } = bendShape(p0, curve);
  let child = null;
  for (let i = n - 1; i >= 0; i--) {
    child = (
      <div className={styles.strip} data-strip style={{ transform: stripTransform(i, rot[i]) }}>
        <div className={`${styles.slice} ${styles.sliceF}`}>
          <div className={styles.sliceInner} data-kind={frontKind} style={{ left: `calc(var(--pw) * ${-i} / ${n})` }}>
            {front}
          </div>
          <div className={styles.sliceShade} style={{ background: shadeFront(shade[i], shade[i + 1]) }} />
        </div>
        <div className={`${styles.slice} ${styles.sliceB}`}>
          <div className={styles.sliceInner} data-kind={backKind} style={{ left: `calc(var(--pw) * ${-(n - 1 - i)} / ${n})` }}>
            {back}
          </div>
          <div className={styles.sliceShade} style={{ background: shadeFront(shade[i + 1], shade[i]) }} />
        </div>
        {child}
      </div>
    );
  }
  return (
    <div className={styles.bent} style={{ '--n': n }} aria-hidden="true" inert="">
      {child}
    </div>
  );
}

function PageFrame({ runhead, folio, children, bodyProps }) {
  return (
    <div className={styles.page}>
      <div className={styles.pageRule} aria-hidden="true" />
      <header className={styles.runhead}>{runhead}</header>
      <div className={styles.pageBody} {...bodyProps}>
        {children}
      </div>
      <footer className={styles.folio}>{folio ?? ' '}</footer>
    </div>
  );
}

/* ---------- main ---------- */

export default function MenuBook() {
  const { status, menu, error, retry } = useMenu();
  const business = useBusiness(menu?.settings);
  const vp = useViewport();
  const { spread, pageW, pageH } = useMemo(() => computeLayout(vp), [vp]);

  const shared = useRef(readSharedSelection()).current;
  const [selected, setSelected] = useState(() => (shared ? new Set(shared) : new Set(readJSON(KEYS.selection, []))));
  const [lang, setLang] = usePersistent(KEYS.lang, 'en');
  const [vegOnly, setVegOnly] = usePersistent(KEYS.veg, false);
  const [soundOn, setSoundOn] = usePersistent(KEYS.sound, false);
  const [tickHintSeen, setTickHintSeen] = usePersistent(KEYS.tickHint, false);
  const t = useMemo(() => makeT(lang), [lang]);

  const [sheetOpen, setSheetOpen] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [note, setNote] = useState(shared ? t('shared.note', shared.length) : '');
  const [fontsTick, setFontsTick] = useState(0);
  const [paged, setPaged] = useState({ pages: [], specials: [] });
  const [f, setF] = useState(0); // leaves turned
  const [bent, setBent] = useState({}); // leaves drawn as a bending page: li -> stacking order
  const [turnedOnce, setTurnedOnce] = useState(false);
  const [bump, setBump] = useState(0);

  const fRef = useRef(0);
  const leafRefs = useRef([]);
  const castRRef = useRef(null);
  const castLRef = useRef(null);
  const anims = useRef(new Map()); // li -> { from, to, delay, dur, ease, start, p, cast, castLeft }
  const leafP = useRef({}); // latest progress of each moving leaf
  const rafRef = useRef(0);
  const measureRef = useRef(null);
  const sendRef = useRef(null);
  const selectedRef = useRef(selected);
  selectedRef.current = selected;
  const gesture = useRef(null);
  const suppressClick = useRef(false);
  const soundRef = useRef(soundOn);
  soundRef.current = soundOn;

  /* ---------- effects ---------- */

  useEffect(() => {
    document.title = `${business.name} | Menu`;
    document.documentElement.lang = lang === 'te' ? 'te' : 'en-IN';
  }, [business.name, lang]);

  useEffect(() => {
    document.fonts?.ready.then(() => setFontsTick((n) => n + 1));
    document.documentElement.classList.add(styles.lockRoot);
    return () => document.documentElement.classList.remove(styles.lockRoot);
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(KEYS.selection, JSON.stringify([...selected]));
    } catch {
      /* ignore */
    }
  }, [selected]);

  // A shared link: drop the ?s= from the address bar once read.
  useEffect(() => {
    if (!shared) return undefined;
    try {
      const u = new URL(window.location.href);
      u.searchParams.delete('s');
      window.history.replaceState(null, '', u.toString());
    } catch {
      /* ignore */
    }
    const id = setTimeout(() => setNote(''), 5000);
    return () => clearTimeout(id);
  }, [shared]);

  /* ---------- selection ---------- */

  const flyToDock = useCallback((fromEl) => {
    const target = sendRef.current;
    const box = fromEl?.closest('label')?.querySelector('[data-box]');
    if (!target || !box || reducedMotion()) {
      setBump((n) => n + 1);
      return;
    }
    const a = box.getBoundingClientRect();
    const b = target.getBoundingClientRect();
    const x0 = a.left + a.width / 2 - 6;
    const y0 = a.top + a.height / 2 - 6;
    const x1 = b.left + 22 - 6;
    const y1 = b.top + b.height / 2 - 6;
    const dot = document.createElement('div');
    dot.className = styles.flyDot;
    document.body.appendChild(dot);
    const anim = dot.animate(
      [
        { transform: `translate(${x0}px, ${y0}px) scale(1)`, opacity: 1 },
        { transform: `translate(${(x0 + x1) / 2}px, ${Math.min(y0, y1) - 90}px) scale(1.15)`, opacity: 1, offset: 0.45 },
        { transform: `translate(${x1}px, ${y1}px) scale(0.5)`, opacity: 0.7 },
      ],
      { duration: 650, easing: 'cubic-bezier(0.5, 0, 0.4, 1)' },
    );
    anim.onfinish = () => {
      dot.remove();
      setBump((n) => n + 1);
    };
  }, []);

  const toggle = useCallback(
    (key, el) => {
      const adding = !selectedRef.current.has(key);
      setSelected((prev) => {
        const next = new Set(prev);
        if (next.has(key)) next.delete(key);
        else next.add(key);
        return next;
      });
      if (adding) {
        setTickHintSeen(true);
        if (el) flyToDock(el);
      }
    },
    [flyToDock, setTickHintSeen],
  );

  /* ---------- menu → sections → blocks ---------- */

  const sections = useMemo(() => {
    if (!menu) return [];
    const list = menu.categories
      .map((c) => ({
        id: c.id,
        title: c.name,
        titleTe: c.nameTe,
        description: c.description,
        descriptionTe: c.descriptionTe,
        rows: menu.items
          .filter((i) => i.categoryId === c.id && (!vegOnly || i.foodType === 'veg'))
          .map((i) => ({
            key: `item:${i.id}`,
            name: i.name,
            nameTe: i.nameTe,
            description: i.description,
            descriptionTe: i.descriptionTe,
            foodType: i.foodType,
            image: i.image,
            featured: i.featured,
          })),
      }))
      .filter((s) => s.rows.length);
    if (menu.packages.length) {
      list.push({
        id: 'packages',
        title: makeT('en')('section.packages'),
        titleTe: makeT('te')('section.packages'),
        description: makeT('en')('section.packagesDesc'),
        descriptionTe: makeT('te')('section.packagesDesc'),
        rows: menu.packages.map((p) => ({
          key: `pkg:${p.id}`,
          name: p.name,
          nameTe: p.nameTe,
          description: p.inclusions.length ? p.inclusions.join(', ') : p.description,
          minGuests: p.minGuests,
        })),
      });
    }
    return list;
  }, [menu, vegOnly]);

  const blocks = useMemo(() => {
    const out = [];
    sections.forEach((s) => {
      out.push({ type: 'head', id: `h:${s.id}`, section: s });
      s.rows.forEach((r) => out.push({ type: 'item', id: r.key, row: r, section: s }));
    });
    return out;
  }, [sections]);

  const featured = useMemo(() => blocks.filter((b) => b.type === 'item' && b.row.featured), [blocks]);

  // Everything ticked, grouped, from the full menu so nothing is lost when filtering.
  const groups = useMemo(() => {
    if (!menu) return [];
    const out = menu.categories
      .map((c) => ({
        title: c.name,
        titleTe: c.nameTe,
        items: menu.items
          .filter((i) => i.categoryId === c.id && selected.has(`item:${i.id}`))
          .map((i) => ({ key: `item:${i.id}`, name: i.name, nameTe: i.nameTe })),
      }))
      .filter((g) => g.items.length);
    const pkgs = menu.packages
      .filter((p) => selected.has(`pkg:${p.id}`))
      .map((p) => ({ key: `pkg:${p.id}`, name: p.name, nameTe: p.nameTe }));
    if (pkgs.length) out.push({ title: 'Set Menus', titleTe: makeT('te')('section.packages'), items: pkgs });
    return out;
  }, [menu, selected]);
  const count = groups.reduce((n, g) => n + g.items.length, 0);

  /* ---------- pagination (measures real heights) ---------- */

  const specPhotoH = Math.round(pageH * (spread ? 0.3 : 0.26));

  useLayoutEffect(() => {
    const root = measureRef.current;
    if (!root || !blocks.length) {
      setPaged({ pages: [], specials: [] });
      return;
    }
    const cap = root.querySelector('[data-body]').clientHeight;
    const h = {};
    root.querySelectorAll('[data-mid]').forEach((el) => {
      h[el.dataset.mid] = el.offsetHeight;
    });
    const contdH = h.__contd || 24;

    const pages = [];
    let cur = [];
    let used = 0;
    const flush = () => {
      if (cur.length) pages.push(cur);
      cur = [];
      used = 0;
    };
    blocks.forEach((b, i) => {
      const bh = h[b.id] || 0;
      if (b.type === 'head') {
        const next = blocks[i + 1];
        const need = bh + (next?.type === 'item' ? h[next.id] || 0 : 0);
        if (used && used + need > cap) flush();
        cur.push(b);
        used += bh;
        return;
      }
      if (used && used + bh > cap) flush();
      if (!cur.length) {
        cur.push({ type: 'contd', id: `c:${b.id}`, section: b.section });
        used += contdH;
      }
      cur.push(b);
      used += bh;
    });
    flush();

    // Chef's specials: as many featured dishes as fit under the photo.
    const specCap = cap - specPhotoH - (h.__spechead || 0);
    const specials = [];
    let sUsed = 0;
    for (const b of featured) {
      const bh = h[b.id] || 0;
      if (sUsed + bh > specCap) break;
      specials.push(b);
      sUsed += bh;
    }
    setPaged({ pages, specials: specials.length >= 2 ? specials : [] });
  }, [blocks, featured, pageW, pageH, spread, fontsTick, lang, specPhotoH]);

  /* ---------- pages → leaves (front = right page, back = left page) ---------- */

  const book = useMemo(() => {
    const intro = { kind: 'intro', key: 'intro', folio: 1 };
    let folio = 2;
    const rest = [];
    if (paged.specials.length) rest.push({ kind: 'specials', key: 'specials', blocks: paged.specials, folio: folio++ });
    const menuP = paged.pages.map((p, i) => ({ kind: 'menu', key: `m${i}`, blocks: p, folio: folio++ }));
    rest.push(...menuP);
    const sectionStart = {};
    menuP.forEach((p) =>
      p.blocks.forEach((b) => {
        if (b.type === 'head' && !sectionStart[b.section.id]) sectionStart[b.section.id] = p;
      }),
    );
    // In a spread the closing page must land on the right, so pad with a picture page.
    if (spread && rest.length % 2 === 1) rest.push({ kind: 'plate', key: 'plate', folio: folio++ });
    rest.push({ kind: 'final', key: 'final', folio: folio++ });
    const cover = { kind: 'cover', key: 'cover' };

    const leaves = [];
    const loc = {};
    if (spread) {
      leaves.push({ front: cover, back: intro });
      loc.cover = 0;
      loc.intro = 1;
      for (let k = 0; k < rest.length; k += 2) {
        const li = leaves.length;
        leaves.push({ front: rest[k], back: rest[k + 1] || { kind: 'endpaper', key: 'end' } });
        loc[rest[k].key] = li;
        if (rest[k + 1]) loc[rest[k + 1].key] = li + 1;
      }
    } else {
      [cover, intro, ...rest].forEach((p, i) => {
        leaves.push({ front: p, back: { kind: 'blank', key: `b${i}` } });
        loc[p.key] = i;
      });
    }
    const firstItemPage = rest.find((p) => p.kind === 'specials' || p.kind === 'menu');
    const firstItem = firstItemPage?.blocks.find((b) => b.type === 'item');
    return {
      leaves,
      loc,
      sectionStart,
      lastFolio: folio - 1,
      hint: firstItem ? { page: firstItemPage.key, id: firstItem.id } : null,
    };
  }, [paged, spread]);

  const maxF = book.leaves.length - 1;
  const menuReady = status === 'ready' && paged.pages.length > 0;

  /* ---------- turning ---------- */

  const strips = spread ? 12 : 10;
  const curve = useMemo(
    () => Array.from({ length: strips + 1 }, (_, k) => (k / strips) ** 1.15),
    [strips],
  );
  const curveRef = useRef(curve);
  curveRef.current = curve;

  /** Write the bend for progress p straight to the DOM (no React render per frame). */
  const paintLeaf = useCallback((li, p) => {
    leafP.current[li] = p;
    const el = leafRefs.current[li];
    if (!el) return;
    const { rot, shade } = bendShape(p, curveRef.current);
    el.querySelectorAll('[data-strip]').forEach((st, i) => {
      st.style.transform = stripTransform(i, rot[i]);
      const [front, back] = st.children;
      front.lastChild.style.background = shadeFront(shade[i], shade[i + 1]);
      back.lastChild.style.background = shadeFront(shade[i + 1], shade[i]);
    });
  }, []);

  /** Shadow the turning page throws on the pages beneath it. */
  const paintCast = useCallback((p, withLeft) => {
    const s = Math.sin(Math.PI * p);
    const c = Math.cos(Math.PI * p);
    const r = castRRef.current;
    const l = castLRef.current;
    if (r) {
      r.style.opacity = p < 0.5 ? (0.55 * s).toFixed(3) : '0';
      r.style.transform = `scaleX(${Math.max(0.02, c).toFixed(3)})`;
    }
    if (l) {
      l.style.opacity = withLeft && p >= 0.5 ? (0.55 * s).toFixed(3) : '0';
      l.style.transform = `scaleX(${Math.max(0.02, -c).toFixed(3)})`;
    }
  }, []);

  const run = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    const tick = (now) => {
      let busy = false;
      anims.current.forEach((a, li) => {
        if (a.start == null) a.start = now + a.delay;
        const t = Math.max(0, Math.min(1, (now - a.start) / a.dur));
        const p = a.from + (a.to - a.from) * a.ease(t);
        paintLeaf(li, p);
        if (a.cast) paintCast(p, a.castLeft);
        if (t < 1) busy = true;
      });
      if (busy) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        anims.current.clear();
        paintCast(0, false);
        setBent({});
      }
    };
    rafRef.current = requestAnimationFrame(tick);
  }, [paintLeaf, paintCast]);

  useEffect(() => () => cancelAnimationFrame(rafRef.current), []);

  const go = useCallback(
    (target) => {
      const tgt = Math.max(0, Math.min(maxF, target));
      const from = fRef.current;
      if (tgt === from) return;
      const forward = tgt > from;
      const idxs = [];
      if (forward) for (let i = from; i < tgt; i++) idxs.push(i);
      else for (let i = from - 1; i >= tgt; i--) idxs.push(i);
      fRef.current = tgt;
      setF(tgt);
      if (tgt >= 2) setTurnedOnce(true);
      if (soundRef.current) playPageTurn();
      if (reducedMotion()) return;
      const order = {};
      idxs.forEach((li, k) => {
        order[li] = k;
        const start = forward ? 0 : 1;
        const fromP = anims.current.has(li) ? leafP.current[li] ?? start : start;
        leafP.current[li] = fromP;
        anims.current.set(li, {
          from: fromP,
          to: forward ? 1 : 0,
          delay: k * STAGGER_MS,
          dur: k === 0 ? FLIP_MS : FLIP_MS * 0.8,
          ease: easeInOut,
          start: null,
          cast: k === 0,
          castLeft: spread && from !== 0 && tgt !== 0,
        });
      });
      setBent((b) => ({ ...b, ...order }));
      run();
    },
    [maxF, spread, run],
  );

  useEffect(() => {
    if (fRef.current > maxF) go(maxF);
  }, [maxF, go]);

  const next = useCallback(() => go(fRef.current + 1), [go]);
  const prev = useCallback(() => go(fRef.current - 1), [go]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') setPanelOpen(false);
      if (sheetOpen || panelOpen) return;
      if (e.key === 'ArrowRight') next();
      else if (e.key === 'ArrowLeft') prev();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [next, prev, sheetOpen, panelOpen]);

  /* Drag a page with a finger or the mouse; it bends and follows, then completes or falls back. */
  const onPointerDown = (e) => {
    suppressClick.current = false;
    if (e.button > 0 || sheetOpen || panelOpen || e.target.closest('[data-nodrag]')) return;
    gesture.current = { x: e.clientX, y: e.clientY, id: e.pointerId, active: false, lastX: e.clientX, lastT: e.timeStamp, v: 0 };
  };
  const onPointerMove = (e) => {
    const g = gesture.current;
    if (!g || g.id !== e.pointerId) return;
    const dx = e.clientX - g.x;
    const dy = e.clientY - g.y;
    if (!g.active) {
      if (Math.abs(dx) < 12 || Math.abs(dx) < Math.abs(dy) * 1.2) {
        if (Math.abs(dy) > 16) gesture.current = null; // vertical scroll, not a turn
        return;
      }
      const dir = dx < 0 ? 1 : -1;
      const cur = fRef.current;
      if (dir > 0 && (cur >= maxF || (cur === 0 && !menuReady))) return;
      if (dir < 0 && cur <= 0) return;
      g.active = true;
      g.dir = dir;
      g.li = dir > 0 ? cur : cur - 1;
      anims.current.delete(g.li);
      leafP.current[g.li] = dir > 0 ? 0 : 1;
      setBent((b) => ({ ...b, [g.li]: 50 }));
      suppressClick.current = true;
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
    }
    const width = spread ? pageW * 1.5 : pageW * 0.95;
    const progress = Math.max(0, Math.min(1, (g.dir > 0 ? -dx : dx) / width));
    const dt = Math.max(1, e.timeStamp - g.lastT);
    g.v = (e.clientX - g.lastX) / dt;
    g.lastX = e.clientX;
    g.lastT = e.timeStamp;
    g.p = progress;
    const p = g.dir > 0 ? progress : 1 - progress;
    paintLeaf(g.li, p);
    paintCast(p, spread && g.li > 0);
  };
  const endGesture = (commit) => {
    const g = gesture.current;
    gesture.current = null;
    if (!g?.active) return;
    const fling = g.dir > 0 ? g.v < -0.45 : g.v > 0.45;
    const done = commit && ((g.p || 0) > 0.32 || fling);
    const p = leafP.current[g.li] ?? (g.dir > 0 ? 0 : 1);
    const to = done === g.dir > 0 ? 1 : 0;
    if (done) {
      fRef.current += g.dir;
      setF(fRef.current);
      if (fRef.current >= 2) setTurnedOnce(true);
      if (soundRef.current) playPageTurn();
    }
    anims.current.set(g.li, {
      from: p,
      to,
      delay: 0,
      dur: 260 + 520 * Math.abs(to - p),
      ease: easeOut,
      start: null,
      cast: true,
      castLeft: spread && g.li > 0,
    });
    run();
  };
  const onClickCapture = (e) => {
    if (suppressClick.current) {
      e.preventDefault();
      e.stopPropagation();
      suppressClick.current = false;
    }
  };

  const isVisible = (li, side) => {
    if (spread) return side === 'front' ? li === f : li === f - 1;
    return side === 'front' && li === f;
  };

  const visibleFolios = [];
  if (spread) {
    if (f > 0) {
      const l = book.leaves[f - 1]?.back?.folio;
      const r = book.leaves[f]?.front?.folio;
      if (l) visibleFolios.push(l);
      if (r) visibleFolios.push(r);
    }
  } else if (book.leaves[f]?.front?.folio) {
    visibleFolios.push(book.leaves[f].front.folio);
  }

  const name = splitName(business.name);
  const telHref = `tel:${business.phoneNumber.replace(/[^\d+]/g, '')}`;
  const shareHref = `https://wa.me/?text=${encodeURIComponent(`${t('share.message')}\n${buildShareUrl(selected)}`)}`;
  const showTickHint = !tickHintSeen && count === 0;

  const langPicks = [
    { value: 'en', label: 'English', lang: 'en' },
    { value: 'te', label: 'తెలుగు', lang: 'te' },
  ];
  const vegPicks = [
    { value: false, label: t('filter.all') },
    { value: true, label: t('filter.veg') },
  ];

  const toc = (onJump) => (
    <ol className={styles.toc}>
      {sections.map((s) => {
        const p = book.sectionStart[s.id];
        return (
          <li key={s.id}>
            <button type="button" onClick={() => p && onJump(book.loc[p.key])} disabled={!p}>
              <span>{pick(lang, s.title, s.titleTe)}</span>
              <span className={styles.leader} aria-hidden="true" />
              <span className={styles.tocNum}>{p?.folio ?? ''}</span>
            </button>
          </li>
        );
      })}
    </ol>
  );

  /* ---------- page renderers ---------- */

  const runhead = <span>{business.name}</span>;

  const renderPage = (page, side) => {
    switch (page.kind) {
      case 'cover':
        return (
          <div className={styles.cover}>
            <div className={styles.coverFrame}>
              <Corner className={styles.cTL} />
              <Corner className={styles.cTR} />
              <Corner className={styles.cBL} />
              <Corner className={styles.cBR} />

              <div className={styles.coverTop}>
                <Picks options={langPicks} value={lang} onChange={setLang} label="Language" dark />
                <span className={styles.medal}>
                  <BrandMark size={46} />
                </span>
              </div>

              <div className={styles.coverMid}>
                <p className={styles.coverKicker}>{t('cover.kicker')}</p>
                <h1 className={styles.coverTitle}>
                  {name.main}
                  {name.sub && <span>{name.sub}</span>}
                </h1>
                <p className={styles.coverTag}>{business.tagline}</p>
                <span className={styles.coverRule} aria-hidden="true" />
                <p className={styles.coverDesc}>{business.description}</p>
                {business.trustLine && <p className={styles.trust}>{business.trustLine}</p>}
              </div>

              <div className={styles.coverBottom}>
                {status === 'error' ? (
                  <>
                    <p className={styles.coverNote}>
                      {t('cover.error')} {error}
                    </p>
                    <button type="button" className={styles.coverBtn} onClick={retry}>
                      {t('cover.retry')}
                    </button>
                  </>
                ) : (
                  <button type="button" className={styles.coverBtn} onClick={() => go(1)} disabled={!menuReady}>
                    {menuReady ? t('cover.explore') : t('cover.preparing')}
                  </button>
                )}
                <a className={styles.coverPhone} href={telHref}>
                  {business.phoneNumber}
                </a>
              </div>
            </div>
          </div>
        );

      case 'intro':
        return (
          <PageFrame runhead={runhead} folio={page.folio}>
            <div className={styles.intro}>
              <p className={styles.kicker}>{t('intro.kicker')}</p>
              <h2 className={styles.introTitle}>{t('intro.title')}</h2>
              <p className={styles.introText}>{t('intro.text')}</p>

              <p className={`${styles.kicker} ${styles.tocKicker}`}>{t('intro.contents')}</p>
              {toc(go)}

              <div className={styles.introFoot}>
                <Picks options={vegPicks} value={vegOnly} onChange={setVegOnly} label={t('intro.show')} />
                <p className={styles.legend}>
                  <span>
                    <FoodMark type="veg" /> {t('legend.veg')}
                  </span>
                  <span>
                    <FoodMark type="non-veg" /> {t('legend.nonveg')}
                  </span>
                </p>
              </div>
            </div>
          </PageFrame>
        );

      case 'specials':
        return (
          <PageFrame runhead={runhead} folio={page.folio}>
            <div className={styles.specPhoto} style={{ height: specPhotoH }}>
              <img src={assetUrl('images/curry-spread.webp')} alt="" loading="lazy" />
            </div>
            <div className={styles.specHead}>
              <p className={styles.kicker}>{t('specials.kicker')}</p>
              <h2>{t('specials.title')}</h2>
            </div>
            {page.blocks.map((b) => (
              <Block
                key={`sp:${b.id}`}
                block={b}
                selected={selected}
                onToggle={toggle}
                lang={lang}
                t={t}
                hint={showTickHint && book.hint?.page === page.key && book.hint.id === b.id}
              />
            ))}
          </PageFrame>
        );

      case 'menu':
        return (
          <PageFrame runhead={runhead} folio={page.folio}>
            {page.blocks.map((b) => (
              <Block
                key={b.id}
                block={b}
                selected={selected}
                onToggle={toggle}
                lang={lang}
                t={t}
                hint={showTickHint && book.hint?.page === page.key && book.hint.id === b.id}
              />
            ))}
          </PageFrame>
        );

      case 'plate':
        return (
          <div className={styles.plate}>
            <img src={assetUrl('images/festive-spread.webp')} alt="" loading="lazy" />
            <p>{t('plate.caption')}</p>
          </div>
        );

      case 'final':
        return (
          <PageFrame runhead={runhead} folio={page.folio}>
            <div className={styles.final}>
              <p className={styles.kicker}>{t('final.kicker')}</p>
              <h2 className={styles.introTitle}>{count === 0 ? t('final.none') : t('final.count', count)}</h2>
              {count > 0 ? (
                <ul className={styles.slip}>
                  {groups.map((g) => (
                    <li key={g.title}>
                      <span>{pick(lang, g.title, g.titleTe)}</span>
                      {g.items.map((i) => pick(lang, i.name, i.nameTe)).join(', ')}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className={styles.introText}>{t('final.noneText')}</p>
              )}
              <button type="button" className={styles.inkBtn} onClick={() => setSheetOpen(true)}>
                {t('final.cta')}
              </button>
              <p className={styles.small}>{t('final.small')}</p>
              <a className={styles.shareLink} href={shareHref} target="_blank" rel="noopener noreferrer">
                <WhatsAppIcon size={16} />
                {t('final.share')}
              </a>

              {business.testimonial && (
                <blockquote className={styles.quote}>
                  <p>&ldquo;{business.testimonial}&rdquo;</p>
                  {business.testimonialBy && <cite>{business.testimonialBy}</cite>}
                </blockquote>
              )}

              <div className={styles.sign}>
                <Rule />
                <p className={styles.thanks}>{t('final.thanks')}</p>
                <a href={telHref}>{business.phoneNumber}</a>
                <p>{business.location}</p>
              </div>
            </div>
          </PageFrame>
        );

      case 'endpaper':
      case 'blank':
      default:
        return <div className={side === 'back' && page.kind === 'endpaper' ? styles.endpaper : styles.blank} />;
    }
  };

  const open = f > 0;

  return (
    <div className={styles.app} data-mode={spread ? 'spread' : 'single'} data-lang={lang}>
      <div
        className={styles.stage}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={() => endGesture(true)}
        onPointerCancel={() => endGesture(false)}
        onClickCapture={onClickCapture}
      >
        <div
          className={styles.book}
          data-book
          data-open={open || undefined}
          style={{ width: spread ? pageW * 2 : pageW, height: pageH, '--pw': `${pageW}px`, '--flip': `${FLIP_MS}ms` }}
        >
          <div className={styles.boardL} aria-hidden="true" />
          <div className={styles.boardR} aria-hidden="true" />
          <div className={styles.stack} aria-hidden="true" />

          {book.leaves.map((leaf, i) => {
            const flipped = i < f;
            const isBent = bent[i] !== undefined;
            return (
              <div
                key={i}
                ref={(el) => {
                  leafRefs.current[i] = el;
                }}
                className={styles.leaf}
                data-flipped={flipped || undefined}
                data-bent={isBent || undefined}
                data-cover={leaf.front.kind === 'cover' || undefined}
                style={{ zIndex: isBent ? 200 + bent[i] : flipped ? i + 1 : book.leaves.length - i }}
              >
                {['front', 'back'].map((side) => {
                  const page = leaf[side];
                  const visible = isVisible(i, side);
                  return (
                    <div
                      key={side}
                      className={`${styles.face} ${side === 'front' ? styles.front : styles.back}`}
                      data-kind={page.kind}
                      inert={visible ? undefined : ''}
                      aria-hidden={visible ? undefined : true}
                    >
                      {renderPage(page, side)}
                    </div>
                  );
                })}
                {isBent && (
                  <BentLeaf
                    curve={curve}
                    p0={leafP.current[i] ?? (flipped ? 1 : 0)}
                    front={renderPage(leaf.front, 'front')}
                    back={renderPage(leaf.back, 'back')}
                    frontKind={leaf.front.kind}
                    backKind={leaf.back.kind}
                  />
                )}
              </div>
            );
          })}

          {/* Shadow the turning page casts on the pages beneath it */}
          <div className={styles.castR} ref={castRRef} aria-hidden="true" />
          {spread && <div className={styles.castL} ref={castLRef} aria-hidden="true" />}

          {open && (
            <button
              type="button"
              className={styles.ribbon}
              data-nodrag
              data-sway={Object.keys(bent).length > 0 || undefined}
              onClick={() => setPanelOpen(true)}
              aria-label={t('panel.title')}
              aria-expanded={panelOpen}
            />
          )}
        </div>
      </div>

      {open && (
        <nav className={styles.dock} aria-label="Book navigation">
          <button type="button" className={styles.navBtn} onClick={prev} aria-label={t('dock.prev')}>
            <ChevronLeft size={20} />
          </button>
          <button type="button" className={styles.pageNum} onClick={() => setPanelOpen(true)} title={t('dock.contents')}>
            {visibleFolios.length ? (
              <>
                {visibleFolios.join('–')}
                <span> / {book.lastFolio}</span>
              </>
            ) : (
              t('dock.contents')
            )}
          </button>
          <button type="button" className={styles.navBtn} onClick={next} disabled={f >= maxF} aria-label={t('dock.next')}>
            <ChevronRight size={20} />
          </button>
          <span className={styles.dockSep} aria-hidden="true" />
          <button type="button" className={styles.sendBtn} ref={sendRef} onClick={() => setSheetOpen(true)}>
            {count > 0 && (
              <span key={bump} className={styles.badge}>
                {count}
              </span>
            )}
            {t('dock.send')}
          </button>
          {!spread && !turnedOnce && (
            <p className={styles.hint} aria-hidden="true">
              {t('hint.swipe')}
            </p>
          )}
        </nav>
      )}

      {/* Ribbon menu: contents + settings */}
      <div className={styles.panelRoot} data-open={panelOpen || undefined}>
        <div className={styles.panelScrim} onClick={() => setPanelOpen(false)} />
        <div className={styles.panel} role="dialog" aria-modal="true" aria-label={t('panel.title')} inert={panelOpen ? undefined : ''}>
          <div className={styles.panelHead}>
            <p className={styles.kicker}>{t('panel.title')}</p>
            <button type="button" className={styles.panelClose} onClick={() => setPanelOpen(false)}>
              {t('panel.close')}
            </button>
          </div>
          {toc((li) => {
            setPanelOpen(false);
            go(li);
          })}
          <dl className={styles.settings}>
            <div>
              <dt>{t('panel.menu')}</dt>
              <dd>
                <Picks options={vegPicks} value={vegOnly} onChange={setVegOnly} label={t('panel.menu')} />
              </dd>
            </div>
            <div>
              <dt>{t('panel.language')}</dt>
              <dd>
                <Picks options={langPicks} value={lang} onChange={setLang} label={t('panel.language')} />
              </dd>
            </div>
            <div>
              <dt>{t('panel.sound')}</dt>
              <dd>
                <Picks
                  options={[
                    { value: false, label: t('panel.off') },
                    { value: true, label: t('panel.on') },
                  ]}
                  value={soundOn}
                  onChange={(v) => {
                    setSoundOn(v);
                    if (v) playPageTurn();
                  }}
                  label={t('panel.sound')}
                />
              </dd>
            </div>
          </dl>
          <a className={styles.shareLink} href={shareHref} target="_blank" rel="noopener noreferrer">
            <WhatsAppIcon size={16} />
            {t('panel.share')}
          </a>
        </div>
      </div>

      {note && (
        <p className={styles.note} role="status">
          {note}
        </p>
      )}

      {/* Off-screen copy of a page, used to measure how much fits. */}
      {blocks.length > 0 && (
        <div className={styles.measure} ref={measureRef} aria-hidden="true" inert="">
          <div className={styles.face} style={{ width: pageW, height: pageH }}>
            <PageFrame runhead={runhead} bodyProps={{ 'data-body': true }}>
              <div data-mid="__contd">
                <Block block={{ type: 'contd', section: { title: 'Measure' } }} lang={lang} t={t} />
              </div>
              <div data-mid="__spechead">
                <div className={styles.specHead}>
                  <p className={styles.kicker}>{t('specials.kicker')}</p>
                  <h2>{t('specials.title')}</h2>
                </div>
              </div>
              {blocks.map((b) => (
                <div key={b.id} data-mid={b.id}>
                  <Block block={b} lang={lang} t={t} />
                </div>
              ))}
            </PageFrame>
          </div>
        </div>
      )}

      <EnquirySheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        business={business}
        groups={groups}
        count={count}
        onRemove={toggle}
        lang={lang}
        t={t}
      />
    </div>
  );
}
