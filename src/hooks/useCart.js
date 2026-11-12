import { createContext, createElement, useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { appConfig } from '../config/appConfig.js';

const CartContext = createContext(null);
const MAX_QTY = 100000;

function lineKey(kind, id) {
  return `${kind}:${id}`;
}

function clampQty(q, min = 1) {
  const n = Math.round(Number(q));
  if (!Number.isFinite(n)) return min;
  return Math.min(MAX_QTY, Math.max(min, n));
}

function reducer(state, action) {
  switch (action.type) {
    case 'add': {
      const { line } = action;
      const existing = state.find((l) => l.key === line.key);
      if (existing) {
        return state.map((l) =>
          l.key === line.key ? { ...l, quantity: clampQty(l.quantity + (line.step ?? 1), l.minQuantity) } : l,
        );
      }
      return [...state, { ...line, quantity: clampQty(line.quantity, line.minQuantity) }];
    }
    case 'setQty':
      return state.map((l) => (l.key === action.key ? { ...l, quantity: clampQty(action.quantity, l.minQuantity) } : l));
    case 'remove':
      return state.filter((l) => l.key !== action.key);
    case 'clear':
      return [];
    case 'replace':
      return action.lines;
    case 'sync': {
      // Refresh names and prices from the latest menu without touching quantities.
      const lookup = action.lookup;
      let changed = false;
      const next = state.map((l) => {
        const fresh = lookup.get(l.key);
        if (!fresh) return l;
        if (fresh.price !== l.price || fresh.name !== l.name || fresh.image !== l.image || fresh.unit !== l.unit) {
          changed = true;
          return { ...l, ...fresh, quantity: clampQty(l.quantity, fresh.minQuantity ?? l.minQuantity) };
        }
        return l;
      });
      return changed ? next : state;
    }
    default:
      return state;
  }
}

function loadInitial() {
  try {
    const raw = localStorage.getItem(appConfig.storageKeys.cart);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((l) => l && l.key && l.name && l.quantity > 0) : [];
  } catch {
    return [];
  }
}

export function itemToLine(item) {
  return {
    key: lineKey('item', item.id),
    kind: 'item',
    id: item.id,
    name: item.name,
    price: item.price,
    unit: item.unit,
    image: item.image,
    minQuantity: 1,
    quantity: 1,
  };
}

export function packageToLine(pkg, guests) {
  return {
    key: lineKey('package', pkg.id),
    kind: 'package',
    id: pkg.id,
    name: pkg.name,
    price: pkg.pricePerPerson,
    unit: 'per person',
    image: pkg.image,
    minQuantity: pkg.minGuests,
    quantity: guests ?? pkg.minGuests,
    step: 0,
  };
}

export function CartProvider({ children }) {
  const [lines, dispatch] = useReducer(reducer, undefined, loadInitial);
  const [isOpen, setIsOpen] = useState(false);
  const [initialStep, setInitialStep] = useState(0);
  const cartIconRef = useRef(null);

  useEffect(() => {
    try {
      localStorage.setItem(appConfig.storageKeys.cart, JSON.stringify(lines));
    } catch {
      /* ignore storage errors */
    }
  }, [lines]);

  // Keep tabs in sync.
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === appConfig.storageKeys.cart) dispatch({ type: 'replace', lines: loadInitial() });
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const add = useCallback((line) => dispatch({ type: 'add', line }), []);
  const setQuantity = useCallback((key, quantity) => dispatch({ type: 'setQty', key, quantity }), []);
  const remove = useCallback((key) => dispatch({ type: 'remove', key }), []);
  const clear = useCallback(() => dispatch({ type: 'clear' }), []);
  const sync = useCallback((lookup) => dispatch({ type: 'sync', lookup }), []);
  const open = useCallback((step = 0) => {
    setInitialStep(step);
    setIsOpen(true);
  }, []);
  const close = useCallback(() => setIsOpen(false), []);

  const value = useMemo(() => {
    const quantities = new Map(lines.map((l) => [l.key, l.quantity]));
    const priced = lines.filter((l) => l.price !== null && l.price !== undefined);
    const total = priced.reduce((sum, l) => sum + l.price * l.quantity, 0);
    return {
      lines,
      count: lines.length,
      total,
      hasUnpriced: priced.length !== lines.length,
      quantityOf: (key) => quantities.get(key) || 0,
      add,
      setQuantity,
      remove,
      clear,
      sync,
      isOpen,
      initialStep,
      open,
      close,
      cartIconRef,
    };
  }, [lines, add, setQuantity, remove, clear, sync, isOpen, initialStep, open, close]);

  return createElement(CartContext.Provider, { value }, children);
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside CartProvider');
  return ctx;
}

export { lineKey };
