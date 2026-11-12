import { useCallback, useDeferredValue, useMemo, useState } from 'react';
import { AlertCircle, Leaf, RotateCw, Search, SearchX, X } from 'lucide-react';
import CategoryNavigation from './CategoryNavigation.jsx';
import FoodCard from './FoodCard.jsx';
import Reveal from './Reveal.jsx';
import { itemToLine, lineKey, useCart } from '../hooks/useCart.js';
import { flyToCart } from '../hooks/useMotion.js';
import { useToast } from './Toast.jsx';
import styles from './FoodGrid.module.css';

function normalize(s) {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

function SkeletonGrid() {
  return (
    <div aria-hidden="true">
      <div className={styles.skeletonChips}>
        {[96, 88, 72, 80, 96, 72].map((w, i) => (
          <span key={i} className="skeleton" style={{ width: w, height: 40, borderRadius: 999 }} />
        ))}
      </div>
      <div className={styles.grid}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className={styles.skeletonCard}>
            <span className="skeleton" style={{ width: '40%', height: 12 }} />
            <span className="skeleton" style={{ width: '75%', height: 24 }} />
            <span className="skeleton" style={{ width: '100%', height: 14 }} />
            <span className="skeleton" style={{ width: '85%', height: 14 }} />
            <span className={styles.skeletonFoot}>
              <span className="skeleton" style={{ width: 88, height: 24 }} />
              <span className="skeleton" style={{ width: 80, height: 40, borderRadius: 999 }} />
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function FoodGrid({ status, menu, error, onRetry, whatsappUrl }) {
  const cart = useCart();
  const toast = useToast();
  const [category, setCategory] = useState('all');
  const [query, setQuery] = useState('');
  const [vegOnly, setVegOnly] = useState(false);
  const deferredQuery = useDeferredValue(query);

  const categories = menu?.categories || [];
  const items = menu?.items || [];
  const categoryName = useMemo(() => new Map(categories.map((c) => [c.id, c.name])), [categories]);
  const hasVegInfo = items.some((i) => i.foodType);

  const q = normalize(deferredQuery.trim());
  const filtered = useMemo(
    () =>
      items.filter((i) => {
        if (vegOnly && i.foodType !== 'veg') return false;
        if (q) {
          const hay = normalize(`${i.name} ${i.description} ${categoryName.get(i.categoryId) || ''}`);
          return q.split(/\s+/).every((t) => hay.includes(t));
        }
        return category === 'all' || i.categoryId === category;
      }),
    [items, vegOnly, q, category, categoryName],
  );

  const counts = useMemo(() => {
    const base = items.filter((i) => !vegOnly || i.foodType === 'veg');
    const c = { all: base.length };
    base.forEach((i) => {
      c[i.categoryId] = (c[i.categoryId] || 0) + 1;
    });
    return c;
  }, [items, vegOnly]);

  const groups = useMemo(() => {
    if (q || category !== 'all') return null;
    return categories
      .map((c) => ({ ...c, items: filtered.filter((i) => i.categoryId === c.id) }))
      .filter((g) => g.items.length);
  }, [q, category, categories, filtered]);

  const onAdd = useCallback(
    (item, el) => {
      cart.add(itemToLine(item));
      flyToCart(el, cart.cartIconRef.current);
      toast.show({ message: `${item.name} added to your enquiry`, action: { label: 'View', onClick: () => cart.open(0) } });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [cart.add, cart.open, toast],
  );
  const onQuantity = useCallback((item, qty) => cart.setQuantity(lineKey('item', item.id), qty), [cart.setQuantity]);
  const onRemove = useCallback((item) => cart.remove(lineKey('item', item.id)), [cart.remove]);

  const changeCategory = (id) => {
    setCategory(id);
    setQuery('');
    const top = document.getElementById('menu-results');
    if (top && top.getBoundingClientRect().top < 0) {
      window.scrollTo({ top: window.scrollY + top.getBoundingClientRect().top - 180, behavior: 'smooth' });
    }
  };

  const renderCards = (list, showCategory) =>
    list.map((item, i) => (
      <FoodCard
        key={item.id}
        item={item}
        index={i}
        categoryName={showCategory ? categoryName.get(item.categoryId) : undefined}
        quantity={cart.quantityOf(lineKey('item', item.id))}
        onAdd={onAdd}
        onQuantity={onQuantity}
        onRemove={onRemove}
      />
    ));

  const activeName = category === 'all' ? 'all categories' : categoryName.get(category);
  const resultText = q
    ? `${filtered.length} ${filtered.length === 1 ? 'dish matches' : 'dishes match'} “${deferredQuery.trim()}”`
    : `${filtered.length} ${filtered.length === 1 ? 'dish' : 'dishes'} in ${activeName}`;

  return (
    <section id="menu" className={`section ${styles.section}`} aria-labelledby="menu-title">
      <div className="container">
        <Reveal className={`section-head ${styles.head}`}>
          <p className="eyebrow">Our menu</p>
          <h2 id="menu-title" className="heading-2">
            Choose the dishes for your occasion
          </h2>
          <p className="body-3">
            Add the dishes you like and set quantities. Prices are indicative, and we confirm the final quotation with you
            on WhatsApp.
          </p>
        </Reveal>

        {status === 'loading' && <SkeletonGrid />}

        {status === 'error' && (
          <div className={styles.state} role="alert">
            <span className={`${styles.stateIcon} ${styles.stateError}`}>
              <AlertCircle size={28} strokeWidth={1.5} aria-hidden="true" />
            </span>
            <h3 className="heading-3">We could not load the menu</h3>
            <p className="body-3">{error} Check your internet connection and try again.</p>
            <div className={styles.stateActions}>
              <button type="button" className="btn btn-primary" onClick={onRetry}>
                <RotateCw size={18} aria-hidden="true" /> Try again
              </button>
              {whatsappUrl && (
                <a className="btn btn-outline" href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                  Ask us on WhatsApp
                </a>
              )}
            </div>
          </div>
        )}

        {status === 'ready' && (
          <>
            <div className={styles.toolbar}>
              <div className={styles.toolbarInner}>
                <div className={styles.searchRow}>
                  <label className={styles.search}>
                    <Search size={18} className={styles.searchIcon} aria-hidden="true" />
                    <span className="visually-hidden">Search dishes</span>
                    <input
                      type="search"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Search dishes, e.g. biryani"
                      autoComplete="off"
                      enterKeyHint="search"
                    />
                    <button
                      type="button"
                      className={`${styles.clear} ${query ? styles.clearOn : ''}`}
                      onClick={() => setQuery('')}
                      aria-label="Clear search"
                      tabIndex={query ? 0 : -1}
                    >
                      <X size={16} aria-hidden="true" />
                    </button>
                  </label>
                  {hasVegInfo && (
                    <button
                      type="button"
                      className={`${styles.vegToggle} ${vegOnly ? styles.vegOn : ''}`}
                      aria-pressed={vegOnly}
                      onClick={() => setVegOnly((v) => !v)}
                    >
                      <span className={styles.switch} aria-hidden="true">
                        <span />
                      </span>
                      <Leaf size={16} aria-hidden="true" />
                      Veg only
                    </button>
                  )}
                </div>
                <CategoryNavigation
                  categories={categories}
                  active={q ? '' : category}
                  onChange={changeCategory}
                  counts={counts}
                />
              </div>
            </div>

            <p className={styles.resultCount} aria-live="polite">
              {resultText}
            </p>

            <div id="menu-results" role="tabpanel" aria-label={`Dishes in ${activeName}`}>
              {filtered.length === 0 ? (
                <div className={styles.state}>
                  <span className={styles.stateIcon}>
                    <SearchX size={28} strokeWidth={1.5} aria-hidden="true" />
                  </span>
                  <h3 className="heading-3">
                    {q ? 'No dishes match your search' : items.length ? 'Nothing here yet' : 'Our menu is being updated'}
                  </h3>
                  <p className="body-3">
                    {q
                      ? 'Try a shorter word, or browse by category. You can also ask us for a dish in your enquiry.'
                      : items.length
                        ? 'Try another category, or turn off the veg only filter.'
                        : 'Send us an enquiry and we will share our current menu with you.'}
                  </p>
                  <div className={styles.stateActions}>
                    {(q || vegOnly) && (
                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={() => {
                          setQuery('');
                          setVegOnly(false);
                          setCategory('all');
                        }}
                      >
                        Show all dishes
                      </button>
                    )}
                    <button type="button" className="btn btn-outline" onClick={() => cart.open(cart.count ? 0 : 1)}>
                      Send enquiry
                    </button>
                  </div>
                </div>
              ) : groups ? (
                <div key={`all-${vegOnly}`} className={styles.groups}>
                  {groups.map((g) => (
                    <section key={g.id} className={styles.group} aria-labelledby={`cat-${g.id}`}>
                      <Reveal className={styles.groupHead}>
                        <h3 id={`cat-${g.id}`} className="heading-3">
                          {g.name}
                        </h3>
                        {g.description && <p className="body-6">{g.description}</p>}
                        <span className={styles.groupRule} aria-hidden="true" />
                      </Reveal>
                      <div className={styles.grid}>{renderCards(g.items, false)}</div>
                    </section>
                  ))}
                </div>
              ) : (
                <div key={`${category}-${vegOnly}-${q ? 'q' : ''}`} className={styles.grid}>
                  {renderCards(filtered, Boolean(q))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
