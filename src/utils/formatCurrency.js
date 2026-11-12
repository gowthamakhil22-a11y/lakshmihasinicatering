import { appConfig } from '../config/appConfig.js';

const formatter = new Intl.NumberFormat(appConfig.locale, {
  style: 'currency',
  currency: appConfig.currency,
  maximumFractionDigits: 2,
  minimumFractionDigits: 0,
});

/** Format a number as Indian Rupees. Returns an empty string for missing prices. */
export function formatCurrency(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return '';
  return formatter.format(Number(value));
}

/** "per plate" → "/ plate". Keeps unknown units readable. */
export function formatUnit(unit) {
  if (!unit) return '';
  const clean = String(unit).trim().replace(/^per\s+/i, '');
  return `/ ${clean}`;
}
