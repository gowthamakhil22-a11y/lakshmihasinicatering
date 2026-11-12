import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowUpRight, Eye, EyeOff, LayoutList, LogOut, Package, Plus, Search, Star, Store, UtensilsCrossed, X } from 'lucide-react';
import { BrandMark } from '../components/BrandMark.jsx';
import { AdminError, adminCall, readSession, writeSession } from './adminApi.js';
import styles from './Admin.module.css';

/* ---------- what each table looks like in the editor ---------- */

const TABLES = {
  items: {
    title: 'Dishes',
    singular: 'dish',
    idKey: 'item_id',
    nameKey: 'item_name',
    fields: [
      { key: 'item_name', label: 'Dish name', required: true, placeholder: 'e.g. Gutti Vankaya Curry' },
      { key: 'item_name_te', label: 'Dish name in Telugu', lang: 'te', placeholder: 'ఉదా. గుత్తి వంకాయ కూర' },
      { key: 'category_id', label: 'Section', type: 'select', source: 'categories', required: true },
      { key: 'food_type', label: 'Food type', type: 'choice', options: [['veg', 'Veg'], ['non-veg', 'Non-veg'], ['egg', 'Egg']] },
      { key: 'description', label: 'Short description', type: 'textarea', hint: 'One or two lines. Longer text is cut off in the book.' },
      { key: 'description_te', label: 'Description in Telugu', type: 'textarea', lang: 'te', hint: 'Optional. Empty = English is shown.' },
      { key: 'featured', label: 'Show on Chef’s Specials page', type: 'switch', on: 'yes', off: '' },
      { key: 'status', label: 'Show on the menu', type: 'switch', on: 'active', off: 'inactive' },
      { key: 'display_order', label: 'Position in section', type: 'number', hint: '1 comes first.' },
      { key: 'image_url', label: 'Photo link (optional)', hint: 'A Google Drive link shared with “Anyone with the link”.' },
    ],
  },
  categories: {
    title: 'Sections',
    singular: 'section',
    idKey: 'category_id',
    nameKey: 'category_name',
    fields: [
      { key: 'category_name', label: 'Section name', required: true, placeholder: 'e.g. Breakfast' },
      { key: 'category_name_te', label: 'Section name in Telugu', lang: 'te' },
      { key: 'category_description', label: 'Line under the title', type: 'textarea' },
      { key: 'category_description_te', label: 'Line under the title, in Telugu', type: 'textarea', lang: 'te' },
      { key: 'status', label: 'Show on the menu', type: 'switch', on: 'active', off: 'inactive', hint: 'Hiding a section hides all its dishes.' },
      { key: 'display_order', label: 'Position in the book', type: 'number', hint: '1 comes first.' },
    ],
  },
  packages: {
    title: 'Set menus',
    singular: 'set menu',
    idKey: 'package_id',
    nameKey: 'package_name',
    fields: [
      { key: 'package_name', label: 'Set menu name', required: true, placeholder: 'e.g. Classic Catering' },
      { key: 'package_name_te', label: 'Name in Telugu', lang: 'te' },
      { key: 'inclusions', label: 'What is included', type: 'lines', hint: 'One item per line.' },
      { key: 'minimum_guests', label: 'Minimum guests', type: 'number' },
      { key: 'description', label: 'Description', type: 'textarea', hint: 'Only shown when the list above is empty.' },
      { key: 'status', label: 'Show on the menu', type: 'switch', on: 'active', off: 'inactive' },
      { key: 'display_order', label: 'Position', type: 'number' },
    ],
  },
};

const SETTINGS = [
  { key: 'business_name', label: 'Business name' },
  { key: 'tagline', label: 'Tagline', hint: 'Short line under the name on the cover.' },
  { key: 'business_description', label: 'About the business', type: 'textarea' },
  { key: 'whatsapp_number', label: 'WhatsApp number', hint: 'Country code + number, digits only. Example: 919876543210', inputMode: 'numeric', check: (v) => !v || /^\d{10,15}$/.test(v) || 'Digits only, with country code (e.g. 91…).' },
  { key: 'phone_number', label: 'Phone number', hint: 'As it should be shown, e.g. +91 98765 43210', inputMode: 'tel' },
  { key: 'email', label: 'Email', inputMode: 'email' },
  { key: 'location', label: 'Address', type: 'textarea' },
  { key: 'maps_url', label: 'Google Maps link (optional)' },
  { key: 'trust_line', label: 'Trust line (optional)', hint: 'Real facts only, e.g. “Serving Rajahmundry since 2012 · 400+ weddings”. Shown on the cover.' },
  { key: 'testimonial', label: 'Customer quote (optional)', type: 'textarea', hint: 'A real customer’s words. Shown on the last page.' },
  { key: 'testimonial_by', label: 'Quote by (optional)', hint: 'e.g. Ravi & Sita, wedding, March 2025' },
];

/* ---------- helpers ---------- */

const num = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 9999;
};
const byOrder = (a, b) => num(a.display_order) - num(b.display_order);

function slug(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 30);
}

function nextId(table, data, draft) {
  if (table === 'categories') {
    const base = slug(draft.category_name) || 'section';
    const taken = new Set(data.categories.map((c) => c.category_id));
    let id = base;
    for (let n = 2; taken.has(id); n++) id = `${base}-${n}`;
    return id;
  }
  const rows = table === 'items' ? data.items : data.packages;
  let prefix = 'PK';
  if (table === 'items') {
    const inCat = rows.filter((r) => r.category_id === draft.category_id);
    const counts = {};
    inCat.forEach((r) => {
      const p = (r.item_id.match(/^[A-Za-z]+/) || [''])[0];
      if (p) counts[p] = (counts[p] || 0) + 1;
    });
    prefix = Object.keys(counts).sort((a, b) => counts[b] - counts[a])[0] || (draft.category_id || 'IT').slice(0, 2).toUpperCase();
  }
  const used = rows
    .map((r) => r[TABLES[table].idKey])
    .filter((id) => id.startsWith(prefix))
    .map((id) => Number(id.slice(prefix.length)) || 0);
  const n = (used.length ? Math.max(...used) : 0) + 1;
  return `${prefix}${String(n).padStart(2, '0')}`;
}

function FoodMark({ type }) {
  if (!type) return <span className={styles.markSpacer} />;
  return (
    <span className={styles.mark} data-type={type} title={type}>
      <span />
    </span>
  );
}

/* ---------- login ---------- */

function Login({ onDone }) {
  const [pw, setPw] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    if (!pw) return;
    setBusy(true);
    setError('');
    try {
      const res = await adminCall('login', { password: pw });
      const session = { token: res.token, expiresAt: res.expiresAt };
      writeSession(session);
      onDone(session);
    } catch (err) {
      setError(err.message);
      setPw('');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={styles.loginPage}>
      <form className={styles.loginCard} onSubmit={submit}>
        <span className={styles.medal}>
          <BrandMark size={40} />
        </span>
        <p className={styles.kicker}>Lakshmi Hasini Catering</p>
        <h1>Menu Admin</h1>
        <p className={styles.loginNote}>Sign in to add, edit or hide dishes. Changes appear on the menu within a minute.</p>
        <label className={styles.field}>
          <span>Password</span>
          <span className={styles.pwWrap}>
            <input
              type={show ? 'text' : 'password'}
              autoComplete="current-password"
              autoFocus
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              disabled={busy}
            />
            <button type="button" className={styles.pwToggle} onClick={() => setShow((s) => !s)} aria-label={show ? 'Hide password' : 'Show password'}>
              {show ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </span>
        </label>
        {error && <p className={styles.error}>{error}</p>}
        <button type="submit" className={styles.primary} disabled={busy || !pw}>
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
        <a className={styles.backLink} href={import.meta.env.BASE_URL}>
          ← Back to the menu
        </a>
      </form>
    </div>
  );
}

/* ---------- editor drawer ---------- */

function Editor({ table, data, initial, isNew, onClose, onSave, onDelete, busy }) {
  const cfg = TABLES[table];
  const [draft, setDraft] = useState(initial);
  const [errors, setErrors] = useState({});
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && !busy && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose, busy]);

  const id = isNew ? nextId(table, data, draft) : draft[cfg.idKey];
  const set = (k, v) => {
    setDraft((d) => ({ ...d, [k]: v }));
    setErrors((e) => ({ ...e, [k]: undefined }));
  };

  const save = () => {
    const errs = {};
    cfg.fields.forEach((f) => {
      if (f.required && !String(draft[f.key] || '').trim()) errs[f.key] = 'Required';
    });
    setErrors(errs);
    if (Object.keys(errs).length) return;
    onSave({ ...draft, [cfg.idKey]: id, isNew });
  };

  const renderField = (f) => {
    const v = draft[f.key] ?? '';
    const common = { id: `f-${f.key}`, lang: f.lang, 'aria-invalid': Boolean(errors[f.key]) };
    let input;
    if (f.type === 'textarea') {
      input = <textarea {...common} rows={2} value={v} onChange={(e) => set(f.key, e.target.value)} />;
    } else if (f.type === 'lines') {
      input = (
        <textarea
          {...common}
          rows={5}
          value={String(v).split('|').join('\n')}
          onChange={(e) => set(f.key, e.target.value.split('\n').map((s) => s.replace(/\|/g, '/')).join('|'))}
        />
      );
    } else if (f.type === 'select') {
      input = (
        <select {...common} value={v} onChange={(e) => set(f.key, e.target.value)}>
          <option value="">Choose…</option>
          {[...data[f.source]].sort(byOrder).map((o) => (
            <option key={o.category_id} value={o.category_id}>
              {o.category_name}
            </option>
          ))}
        </select>
      );
    } else if (f.type === 'choice') {
      input = (
        <span className={styles.segment} role="radiogroup">
          {f.options.map(([val, label]) => (
            <button key={val} type="button" role="radio" aria-checked={v === val} onClick={() => set(f.key, val)}>
              <FoodMark type={val} />
              {label}
            </button>
          ))}
        </span>
      );
    } else if (f.type === 'switch') {
      const on = v === f.on;
      return (
        <div key={f.key} className={styles.switchRow}>
          <span>
            <strong>{f.label}</strong>
            {f.hint && <small>{f.hint}</small>}
          </span>
          <button type="button" role="switch" aria-checked={on} className={styles.switch} onClick={() => set(f.key, on ? f.off : f.on)}>
            <span />
          </button>
        </div>
      );
    } else {
      input = (
        <input
          {...common}
          type={f.type === 'number' ? 'number' : 'text'}
          inputMode={f.type === 'number' ? 'numeric' : undefined}
          min={f.type === 'number' ? 0 : undefined}
          placeholder={f.placeholder}
          value={v}
          onChange={(e) => set(f.key, e.target.value)}
        />
      );
    }
    return (
      <div key={f.key} className={styles.field}>
        <label htmlFor={`f-${f.key}`}>
          {f.label}
          {f.required && <em> *</em>}
        </label>
        {input}
        {errors[f.key] ? <small className={styles.fieldError}>{errors[f.key]}</small> : f.hint && <small>{f.hint}</small>}
      </div>
    );
  };

  return (
    <div className={styles.drawerRoot}>
      <div className={styles.scrim} onClick={() => !busy && onClose()} />
      <aside className={styles.drawer} role="dialog" aria-modal="true" aria-label={`${isNew ? 'New' : 'Edit'} ${cfg.singular}`}>
        <header className={styles.drawerHead}>
          <div>
            <p className={styles.kicker}>{isNew ? `New ${cfg.singular}` : `Edit ${cfg.singular}`}</p>
            <h2>{draft[cfg.nameKey] || `Untitled ${cfg.singular}`}</h2>
            <p className={styles.idLine}>ID: {id}</p>
          </div>
          <button type="button" className={styles.iconBtn} onClick={onClose} disabled={busy} aria-label="Close">
            <X size={20} />
          </button>
        </header>

        <div className={styles.drawerBody}>{cfg.fields.map(renderField)}</div>

        <footer className={styles.drawerFoot}>
          {confirmDelete ? (
            <div className={styles.confirm}>
              <p>
                Delete <strong>{draft[cfg.nameKey]}</strong>? To bring it back later you would use the sheet’s version
                history. Hiding it is usually better.
              </p>
              <div>
                <button type="button" className={styles.ghost} onClick={() => setConfirmDelete(false)} disabled={busy}>
                  Keep it
                </button>
                <button type="button" className={styles.danger} onClick={() => onDelete(draft[cfg.idKey])} disabled={busy}>
                  {busy ? 'Deleting…' : 'Delete'}
                </button>
              </div>
            </div>
          ) : (
            <>
              {!isNew && (
                <button type="button" className={styles.deleteLink} onClick={() => setConfirmDelete(true)} disabled={busy}>
                  Delete
                </button>
              )}
              <span className={styles.spacer} />
              <button type="button" className={styles.ghost} onClick={onClose} disabled={busy}>
                Cancel
              </button>
              <button type="button" className={styles.primary} onClick={save} disabled={busy}>
                {busy ? 'Saving…' : isNew ? `Add ${cfg.singular}` : 'Save changes'}
              </button>
            </>
          )}
        </footer>
      </aside>
    </div>
  );
}

/* ---------- lists ---------- */

function TableView({ table, data, cat, onEdit, onAdd, onToggle, onFeature, busyId }) {
  const cfg = TABLES[table];
  const [q, setQ] = useState('');
  const cats = useMemo(() => [...data.categories].sort(byOrder), [data.categories]);

  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    return [...data[table]]
      .filter((r) => table !== 'items' || !cat || r.category_id === cat)
      .filter((r) => !term || Object.values(r).some((v) => String(v).toLowerCase().includes(term)))
      .sort(byOrder);
  }, [data, table, q, cat]);

  const groups = useMemo(() => {
    if (table !== 'items') return [{ key: 'all', title: '', rows }];
    return cats
      .map((c) => ({ key: c.category_id, title: c.category_name, te: c.category_name_te, hidden: c.status === 'inactive', rows: rows.filter((r) => r.category_id === c.category_id) }))
      .filter((g) => g.rows.length);
  }, [table, cats, rows]);

  const total = data[table].length;
  const shownCount = data[table].filter((r) => r.status !== 'inactive').length;

  return (
    <section>
      <header className={styles.pageHead}>
        <div>
          <h2>{cfg.title}</h2>
          <p>
            {shownCount} of {total} on the menu
            {total - shownCount > 0 && <> · {total - shownCount} hidden</>}
          </p>
        </div>
        <div className={styles.pageTools}>
          <label className={styles.search}>
            <Search size={16} aria-hidden="true" />
            <input type="search" placeholder="Search" value={q} onChange={(e) => setQ(e.target.value)} aria-label={`Search ${cfg.title}`} />
          </label>
          <button type="button" className={styles.primary} onClick={() => onAdd(cat)}>
            <Plus size={17} /> <span>Add {cfg.singular}</span>
          </button>
        </div>
      </header>

      {groups.length === 0 && <p className={styles.empty}>Nothing matches “{q}”.</p>}

      {groups.map((g) => (
        <div key={g.key} className={styles.group}>
          {g.title && (
            <h3 className={styles.groupTitle}>
              <span>{g.title}</span>
              {g.te && <span lang="te">{g.te}</span>}
              <span className={styles.groupCount}>{g.rows.length}</span>
              {g.hidden && <em>section hidden from menu</em>}
            </h3>
          )}
          <ul className={styles.tiles}>
            {g.rows.map((r) => {
              const id = r[cfg.idKey];
              const shown = r.status !== 'inactive';
              const special = r.featured === 'yes';
              const te = r[`${cfg.nameKey}_te`];
              const desc =
                table === 'packages'
                  ? String(r.inclusions || r.description || '').split('|').filter(Boolean).join(' · ')
                  : table === 'categories'
                    ? r.category_description
                    : r.description;
              const dishCount = table === 'categories' ? data.items.filter((i) => i.category_id === id).length : 0;
              const busy = busyId === id;
              return (
                <li key={id} className={styles.tile} data-off={!shown || undefined}>
                  <button type="button" className={styles.tileMain} onClick={() => onEdit(r)}>
                    <span className={styles.tileName}>
                      {table === 'items' && <FoodMark type={r.food_type} />}
                      <span>{r[cfg.nameKey]}</span>
                    </span>
                    {te && (
                      <span className={styles.tileTe} lang="te">
                        {te}
                      </span>
                    )}
                    {desc && <span className={styles.tileDesc}>{desc}</span>}
                    {(table === 'categories' || (table === 'packages' && r.minimum_guests)) && (
                      <span className={styles.tileMeta}>
                        {table === 'categories' ? `${dishCount} ${dishCount === 1 ? 'dish' : 'dishes'}` : `From ${r.minimum_guests} guests`}
                      </span>
                    )}
                  </button>
                  <div className={styles.tileFoot}>
                    {table === 'items' ? (
                      <button
                        type="button"
                        className={styles.star}
                        data-on={special || undefined}
                        onClick={() => onFeature(r)}
                        disabled={busy}
                        aria-pressed={special}
                        title={special ? 'On Chef’s Specials – tap to remove' : 'Add to Chef’s Specials'}
                      >
                        <Star size={15} fill={special ? 'currentColor' : 'none'} />
                        <span>{special ? 'Special' : 'Mark special'}</span>
                      </button>
                    ) : (
                      <span className={styles.tileId}>No. {r.display_order || '–'}</span>
                    )}
                    <label className={styles.onMenu} title={shown ? 'Shown on the menu' : 'Hidden from the menu'}>
                      <span>{busy ? 'Saving…' : shown ? 'On menu' : 'Hidden'}</span>
                      <button type="button" role="switch" aria-checked={shown} className={styles.switch} onClick={() => onToggle(r)} disabled={busy}>
                        <span />
                      </button>
                    </label>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </section>
  );
}

function SettingsView({ data, onSaveMany, busy }) {
  const current = useMemo(() => Object.fromEntries(data.settings.map((s) => [s.setting_key, s.setting_value])), [data.settings]);
  const [draft, setDraft] = useState(current);
  const [errors, setErrors] = useState({});
  useEffect(() => setDraft(current), [current]);

  const changed = SETTINGS.filter((f) => (draft[f.key] || '') !== (current[f.key] || ''));

  const save = () => {
    const errs = {};
    SETTINGS.forEach((f) => {
      const r = f.check?.(String(draft[f.key] || '').trim());
      if (typeof r === 'string') errs[f.key] = r;
    });
    setErrors(errs);
    if (Object.keys(errs).length || !changed.length) return;
    onSaveMany(changed.map((f) => ({ setting_key: f.key, setting_value: String(draft[f.key] || '').trim() })));
  };

  const GROUPS = [
    {
      title: 'Your business',
      note: 'Shown on the cover of the menu book.',
      keys: ['business_name', 'tagline', 'business_description'],
    },
    {
      title: 'How customers reach you',
      note: 'Enquiries are sent to this WhatsApp number. The phone and address appear on the last page.',
      keys: ['whatsapp_number', 'phone_number', 'email', 'location', 'maps_url'],
    },
    {
      title: 'Why choose you',
      note: 'Optional. Leave empty to hide. Use real facts and real customer words only.',
      keys: ['trust_line', 'testimonial', 'testimonial_by'],
    },
  ];
  const byKey = Object.fromEntries(SETTINGS.map((f) => [f.key, f]));
  const wa = String(draft.whatsapp_number || '').replace(/\D/g, '');
  const missing = ['whatsapp_number', 'phone_number'].filter((k) => !String(draft[k] || '').trim());

  const field = (f) => (
    <div key={f.key} className={styles.field} data-warn={missing.includes(f.key) || undefined}>
      <label htmlFor={`s-${f.key}`}>{f.label}</label>
      {f.type === 'textarea' ? (
        <textarea id={`s-${f.key}`} rows={f.key === 'testimonial' ? 3 : 2} value={draft[f.key] || ''} onChange={(e) => setDraft((d) => ({ ...d, [f.key]: e.target.value }))} />
      ) : (
        <input
          id={`s-${f.key}`}
          type="text"
          inputMode={f.inputMode}
          value={draft[f.key] || ''}
          onChange={(e) => setDraft((d) => ({ ...d, [f.key]: e.target.value }))}
        />
      )}
      {errors[f.key] ? <small className={styles.fieldError}>{errors[f.key]}</small> : f.hint && <small>{f.hint}</small>}
      {f.key === 'whatsapp_number' && /^\d{10,15}$/.test(wa) && (
        <a className={styles.testLink} href={`https://wa.me/${wa}?text=${encodeURIComponent('Test message from the menu admin')}`} target="_blank" rel="noopener noreferrer">
          Send a test WhatsApp to this number ↗
        </a>
      )}
    </div>
  );

  return (
    <section className={styles.settings}>
      <header className={styles.pageHead}>
        <div>
          <h2>Business details</h2>
          <p>{changed.length ? `${changed.length} unsaved change${changed.length > 1 ? 's' : ''}` : 'Everything is saved'}</p>
        </div>
        <div className={styles.pageTools}>
          {changed.length > 0 && (
            <button type="button" className={styles.ghost} onClick={() => { setDraft(current); setErrors({}); }} disabled={busy}>
              Undo
            </button>
          )}
          <button type="button" className={styles.primary} onClick={save} disabled={busy || !changed.length}>
            {busy ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </header>

      {missing.length > 0 && (
        <p className={styles.alert}>
          <strong>Needed before you go live:</strong> {missing.map((k) => byKey[k].label.toLowerCase()).join(' and ')}. Customers’ enquiries can’t reach you without it.
        </p>
      )}

      {GROUPS.map((g) => (
        <div key={g.title} className={styles.panel}>
          <div className={styles.panelInfo}>
            <h3>{g.title}</h3>
            <p>{g.note}</p>
          </div>
          <div className={styles.panelFields}>{g.keys.map((k) => field(byKey[k]))}</div>
        </div>
      ))}

      {changed.length > 0 && (
        <div className={styles.saveBar}>
          <span>
            {changed.length} unsaved change{changed.length > 1 ? 's' : ''}
          </span>
          <button type="button" className={styles.primary} onClick={save} disabled={busy}>
            {busy ? 'Saving…' : 'Save'}
          </button>
        </div>
      )}
    </section>
  );
}

/* ---------- app ---------- */

export default function AdminApp() {
  const [session, setSession] = useState(readSession);
  const [data, setData] = useState(null);
  const [tab, setTab] = useState('items');
  const [cat, setCat] = useState('');
  const [editing, setEditing] = useState(null); // { table, row, isNew }
  const [busy, setBusy] = useState(false);
  const [busyId, setBusyId] = useState('');
  const [toast, setToast] = useState(null);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    document.title = 'Menu Admin | Lakshmi Hasini Catering';
    const meta = document.createElement('meta');
    meta.name = 'robots';
    meta.content = 'noindex, nofollow';
    document.head.appendChild(meta);
    return () => meta.remove();
  }, []);

  const notify = useCallback((text, kind = 'ok') => {
    setToast({ text, kind, id: Date.now() });
  }, []);
  useEffect(() => {
    if (!toast) return undefined;
    const t = setTimeout(() => setToast(null), toast.kind === 'error' ? 6000 : 3500);
    return () => clearTimeout(t);
  }, [toast]);

  const signOut = useCallback((msg) => {
    writeSession(null);
    setSession(null);
    setData(null);
    setEditing(null);
    if (msg) notify(msg, 'error');
  }, [notify]);

  const call = useCallback(
    async (action, payload) => {
      try {
        return await adminCall(action, { token: session?.token, ...payload });
      } catch (err) {
        if (err instanceof AdminError && err.code === 'auth') signOut('Your session ended. Please sign in again.');
        throw err;
      }
    },
    [session, signOut],
  );

  const load = useCallback(async () => {
    setLoadError('');
    try {
      const res = await call('list');
      setData(res.data);
    } catch (err) {
      setLoadError(err.message);
    }
  }, [call]);

  useEffect(() => {
    if (session) load();
  }, [session, load]);

  const save = async (table, row, message) => {
    setBusy(true);
    try {
      const res = await call('save', { table, row });
      setData(res.data);
      setEditing(null);
      notify(message || 'Saved. The menu updates within a minute.');
    } catch (err) {
      notify(err.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  const remove = async (table, id) => {
    setBusy(true);
    try {
      const res = await call('delete', { table, id });
      setData(res.data);
      setEditing(null);
      notify('Deleted.');
    } catch (err) {
      notify(err.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  const toggle = async (table, row) => {
    const id = row[TABLES[table].idKey];
    setBusyId(id);
    const next = row.status === 'inactive' ? 'active' : 'inactive';
    try {
      const res = await call('save', { table, row: { ...row, status: next, isNew: false } });
      setData(res.data);
      notify(next === 'active' ? `${row[TABLES[table].nameKey]} is shown on the menu.` : `${row[TABLES[table].nameKey]} is hidden from the menu.`);
    } catch (err) {
      notify(err.message, 'error');
    } finally {
      setBusyId('');
    }
  };

  const feature = async (row) => {
    const id = row.item_id;
    setBusyId(id);
    const next = row.featured === 'yes' ? '' : 'yes';
    try {
      const res = await call('save', { table: 'items', row: { ...row, featured: next, isNew: false } });
      setData(res.data);
      notify(next ? `${row.item_name} added to Chef’s Specials.` : `${row.item_name} removed from Chef’s Specials.`);
    } catch (err) {
      notify(err.message, 'error');
    } finally {
      setBusyId('');
    }
  };

  const saveSettings = async (rows) => {
    setBusy(true);
    try {
      let res;
      for (const row of rows) res = await call('save', { table: 'settings', row });
      setData(res.data);
      notify('Business details saved.');
    } catch (err) {
      notify(err.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  const startAdd = (table, catFilter) => {
    const rows = data[table];
    const base = { status: 'active' };
    if (table === 'items') {
      const category_id = catFilter || [...data.categories].sort(byOrder)[0]?.category_id || '';
      const inCat = rows.filter((r) => r.category_id === category_id);
      Object.assign(base, { category_id, food_type: 'veg', featured: '', display_order: String(Math.max(0, ...inCat.map((r) => num(r.display_order) % 9999)) + 1) });
    } else {
      base.display_order = String(Math.max(0, ...rows.map((r) => num(r.display_order) % 9999)) + 1);
    }
    setEditing({ table, row: base, isNew: true });
  };

  if (!session) return <Login onDone={setSession} />;

  const TABS = [
    ['items', 'Dishes', UtensilsCrossed],
    ['categories', 'Sections', LayoutList],
    ['packages', 'Set menus', Package],
    ['settings', 'Business details', Store],
  ];
  const cats = data ? [...data.categories].sort(byOrder) : [];
  const pick = (k) => {
    setTab(k);
    setCat('');
  };

  return (
    <div className={styles.app}>
      <aside className={styles.side}>
        <div className={styles.brand}>
          <span className={styles.medalSm}>
            <BrandMark size={24} />
          </span>
          <div>
            <strong>Lakshmi Hasini</strong>
            <span>Menu admin</span>
          </div>
          <div className={styles.brandActions}>
            <a href={import.meta.env.BASE_URL} target="_blank" rel="noopener noreferrer" title="View menu" aria-label="View menu">
              <ArrowUpRight size={18} />
            </a>
            <button type="button" onClick={() => signOut()} title="Sign out" aria-label="Sign out">
              <LogOut size={18} />
            </button>
          </div>
        </div>

        <nav className={styles.nav} aria-label="Admin sections">
          {TABS.map(([k, label, Icon]) => (
            <button key={k} type="button" aria-current={tab === k || undefined} onClick={() => pick(k)}>
              <Icon size={17} aria-hidden="true" />
              <span>{label}</span>
              {data && k !== 'settings' && <em>{data[k].length}</em>}
            </button>
          ))}
        </nav>

        {data && tab === 'items' && (
          <div className={styles.index}>
            <p>Jump to section</p>
            <div>
              <button type="button" aria-current={!cat || undefined} onClick={() => setCat('')}>
                <span>All dishes</span>
                <em>{data.items.length}</em>
              </button>
              {cats.map((c) => (
                <button key={c.category_id} type="button" aria-current={cat === c.category_id || undefined} onClick={() => setCat(c.category_id)} data-off={c.status === 'inactive' || undefined}>
                  <span>{c.category_name}</span>
                  <em>{data.items.filter((i) => i.category_id === c.category_id).length}</em>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className={styles.sideFoot}>
          <a href={import.meta.env.BASE_URL} target="_blank" rel="noopener noreferrer">
            View menu <ArrowUpRight size={14} />
          </a>
          <button type="button" onClick={() => signOut()}>
            <LogOut size={14} /> Sign out
          </button>
        </div>
      </aside>

      <main className={styles.main}>
        {!data && !loadError && (
          <div className={styles.loading}>
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div key={i} />
            ))}
          </div>
        )}
        {loadError && (
          <div className={styles.loadError}>
            <p>{loadError}</p>
            <button type="button" className={styles.primary} onClick={load}>
              Try again
            </button>
          </div>
        )}
        {data && tab !== 'settings' && (
          <TableView
            key={tab}
            table={tab}
            data={data}
            cat={cat}
            busyId={busyId}
            onEdit={(row) => setEditing({ table: tab, row, isNew: false })}
            onAdd={(c) => startAdd(tab, c)}
            onToggle={(row) => toggle(tab, row)}
            onFeature={feature}
          />
        )}
        {data && tab === 'settings' && <SettingsView data={data} busy={busy} onSaveMany={saveSettings} />}
      </main>

      {editing && (
        <Editor
          key={`${editing.table}:${editing.row[TABLES[editing.table].idKey] || 'new'}`}
          table={editing.table}
          data={data}
          initial={editing.row}
          isNew={editing.isNew}
          busy={busy}
          onClose={() => setEditing(null)}
          onSave={(row) => save(editing.table, row, editing.isNew ? `${row[TABLES[editing.table].nameKey]} added.` : undefined)}
          onDelete={(id) => remove(editing.table, id)}
        />
      )}

      {toast && (
        <p key={toast.id} className={styles.toast} data-kind={toast.kind} role="status">
          {toast.text}
        </p>
      )}
    </div>
  );
}
