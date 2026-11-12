import { appConfig } from '../config/appConfig.js';

const SESSION_KEY = 'lhc.admin.session.v1';

export function readSession() {
  try {
    const s = JSON.parse(sessionStorage.getItem(SESSION_KEY) || 'null');
    return s && s.token && s.expiresAt > Date.now() ? s : null;
  } catch {
    return null;
  }
}

export function writeSession(s) {
  try {
    if (s) sessionStorage.setItem(SESSION_KEY, JSON.stringify(s));
    else sessionStorage.removeItem(SESSION_KEY);
  } catch {
    /* private mode: session lasts until the tab closes */
  }
}

export class AdminError extends Error {
  constructor(message, code) {
    super(message);
    this.code = code;
  }
}

/**
 * Calls the Apps Script admin API. Sent as text/plain so the browser makes a
 * "simple" request (Apps Script cannot answer CORS preflights).
 */
export async function adminCall(action, payload = {}) {
  if (!appConfig.menuApiUrl) throw new AdminError('The menu sheet is not connected (VITE_MENU_API_URL is empty).', 'setup');
  let res;
  try {
    res = await fetch(appConfig.menuApiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action, ...payload }),
      redirect: 'follow',
    });
  } catch {
    throw new AdminError('Could not reach the menu sheet. Check your internet connection.', 'network');
  }
  let data;
  try {
    data = await res.json();
  } catch {
    throw new AdminError(
      'The sheet did not answer correctly. Make sure the latest Code.gs is deployed as a new version.',
      'setup',
    );
  }
  if (!data.ok) throw new AdminError(data.error || 'Something went wrong.', data.code);
  return data;
}
