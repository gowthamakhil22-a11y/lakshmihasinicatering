import { appConfig, assetUrl } from '../config/appConfig.js';

/**
 * Loads the menu (categories, items, packages, settings).
 *
 * Source order:
 *  1. Google Apps Script API (appConfig.menuApiUrl), via fetch, then JSONP
 *     as a fallback for networks or browsers that block the redirect.
 *  2. Bundled demo data when no API URL is configured.
 *
 * Successful responses are cached in localStorage so a returning visitor
 * sees the menu instantly while a fresh copy loads in the background.
 */

const ACTIVE = new Set(['active', 'yes', 'true', '1', 'live', 'available', '']);

function isActive(status) {
  return ACTIVE.has(String(status ?? '').trim().toLowerCase());
}

function toBool(value) {
  return ['yes', 'true', '1', 'y', 'featured'].includes(String(value ?? '').trim().toLowerCase());
}

function toNumber(value) {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(String(value).replace(/[₹,\s]/g, ''));
  return Number.isFinite(n) && n >= 0 ? n : null;
}

function toText(value) {
  return value === null || value === undefined ? '' : String(value).trim();
}

/** Turn Google Drive share links into direct image links; resolve local paths. */
export function resolveImage(url) {
  const raw = toText(url);
  if (!raw) return '';
  const drive = raw.match(/drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?(?:export=\w+&)?id=)([\w-]{10,})/);
  if (drive) return `https://lh3.googleusercontent.com/d/${drive[1]}=w800`;
  return assetUrl(raw);
}

function byOrder(a, b) {
  return (a.order ?? 9999) - (b.order ?? 9999) || a.name.localeCompare(b.name);
}

function normalizeFoodType(value) {
  const v = toText(value).toLowerCase().replace(/[\s_-]+/g, '');
  if (['veg', 'vegetarian', 'v'].includes(v)) return 'veg';
  if (['nonveg', 'nonvegetarian', 'nv'].includes(v)) return 'non-veg';
  if (['egg', 'eggetarian'].includes(v)) return 'egg';
  return '';
}

function splitList(value) {
  return toText(value)
    .split(/\n|;|\|/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Normalise raw sheet rows into the shapes the UI uses. Drops invalid rows. */
export function normalizeMenu(raw) {
  const data = raw && typeof raw === 'object' ? raw : {};

  const categories = (Array.isArray(data.categories) ? data.categories : [])
    .filter((c) => c && toText(c.category_id) && toText(c.category_name) && isActive(c.status))
    .map((c) => ({
      id: toText(c.category_id),
      name: toText(c.category_name),
      nameTe: toText(c.category_name_te),
      descriptionTe: toText(c.category_description_te),
      description: toText(c.category_description),
      image: resolveImage(c.category_image),
      order: toNumber(c.display_order),
    }))
    .sort(byOrder);

  const categoryIds = new Set(categories.map((c) => c.id));

  const items = (Array.isArray(data.items) ? data.items : [])
    .filter((i) => i && toText(i.item_id) && toText(i.item_name) && isActive(i.status))
    .map((i) => ({
      id: toText(i.item_id),
      name: toText(i.item_name),
      nameTe: toText(i.item_name_te),
      descriptionTe: toText(i.description_te),
      categoryId: toText(i.category_id),
      description: toText(i.description),
      price: toNumber(i.price),
      unit: toText(i.price_unit),
      image: resolveImage(i.image_url),
      featured: toBool(i.featured),
      foodType: normalizeFoodType(i.food_type),
      order: toNumber(i.display_order),
    }))
    // Items whose category is inactive or missing are hidden.
    .filter((i) => categoryIds.has(i.categoryId))
    .sort(byOrder);

  const packages = (Array.isArray(data.packages) ? data.packages : [])
    .filter((p) => p && toText(p.package_id) && toText(p.package_name) && isActive(p.status))
    .map((p) => ({
      id: toText(p.package_id),
      name: toText(p.package_name),
      nameTe: toText(p.package_name_te),
      description: toText(p.description),
      image: resolveImage(p.image_url),
      pricePerPerson: toNumber(p.price_per_person),
      minGuests: Math.max(1, Math.round(toNumber(p.minimum_guests) || 1)),
      inclusions: splitList(p.inclusions),
      order: toNumber(p.display_order),
    }))
    .sort(byOrder);

  const settings = {};
  const rawSettings = data.settings;
  if (Array.isArray(rawSettings)) {
    rawSettings.forEach((row) => {
      const key = toText(row?.setting_key);
      if (key) settings[key] = toText(row.setting_value);
    });
  } else if (rawSettings && typeof rawSettings === 'object') {
    Object.entries(rawSettings).forEach(([k, v]) => {
      settings[k] = toText(v);
    });
  }

  // Only keep categories that have at least one item.
  const usedCategoryIds = new Set(items.map((i) => i.categoryId));
  return {
    categories: categories.filter((c) => usedCategoryIds.has(c.id)),
    items,
    packages,
    settings,
  };
}

function withTimeout(promise, ms) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('The menu took too long to load.')), ms);
    promise.then(
      (v) => {
        clearTimeout(t);
        resolve(v);
      },
      (e) => {
        clearTimeout(t);
        reject(e);
      },
    );
  });
}

function jsonp(url, timeoutMs) {
  return new Promise((resolve, reject) => {
    const cb = `__lhcMenu${Date.now()}${Math.floor(Math.random() * 1000)}`;
    const script = document.createElement('script');
    const cleanup = () => {
      delete window[cb];
      script.remove();
      clearTimeout(timer);
    };
    const timer = setTimeout(() => {
      cleanup();
      reject(new Error('The menu took too long to load.'));
    }, timeoutMs);
    window[cb] = (data) => {
      cleanup();
      resolve(data);
    };
    script.onerror = () => {
      cleanup();
      reject(new Error('Could not reach the menu service.'));
    };
    script.src = `${url}${url.includes('?') ? '&' : '?'}callback=${cb}`;
    document.head.appendChild(script);
  });
}

async function fetchJson(url, timeoutMs) {
  const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const res = await withTimeout(
    fetch(url, { signal: controller?.signal, cache: 'no-store', redirect: 'follow' }),
    timeoutMs,
  ).catch((err) => {
    controller?.abort();
    throw err;
  });
  if (!res.ok) throw new Error(`Menu service responded with ${res.status}.`);
  return res.json();
}

function unwrap(payload) {
  if (!payload || typeof payload !== 'object') {
    throw new Error('The menu service returned an unexpected response.');
  }
  if (payload.ok === false) {
    throw new Error(payload.error || 'The menu service reported an error.');
  }
  return payload.data ?? payload;
}

async function loadFromApi() {
  const url = appConfig.menuApiUrl;
  try {
    return unwrap(await fetchJson(url, appConfig.apiTimeoutMs));
  } catch (fetchError) {
    // JSONP fallback (Apps Script supports ?callback=).
    try {
      return unwrap(await jsonp(url, appConfig.apiTimeoutMs));
    } catch {
      throw fetchError;
    }
  }
}

async function loadDemo() {
  return unwrap(await fetchJson(assetUrl('data/demo-menu.json'), appConfig.apiTimeoutMs));
}

export function readCachedMenu() {
  try {
    const raw = localStorage.getItem(appConfig.storageKeys.menuCache);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.menu || parsed.source !== menuSource()) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeCachedMenu(menu) {
  try {
    localStorage.setItem(
      appConfig.storageKeys.menuCache,
      JSON.stringify({ savedAt: Date.now(), source: menuSource(), menu }),
    );
  } catch {
    /* storage full or blocked: ignore */
  }
}

function menuSource() {
  return appConfig.menuApiUrl || 'demo';
}

export function isDemoMode() {
  return !appConfig.menuApiUrl;
}

/** Fetch, normalise and cache the menu. Throws a user readable Error on failure. */
export async function fetchMenu() {
  const raw = isDemoMode() ? await loadDemo() : await loadFromApi();
  const menu = normalizeMenu(raw);
  writeCachedMenu(menu);
  return menu;
}
