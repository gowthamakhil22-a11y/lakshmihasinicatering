import { useEffect, useRef, useState } from 'react';
import { appConfig } from '../config/appConfig.js';
import { makeT, OCCASION_TE, pick } from '../i18n.js';
import { minEventDate } from '../utils/validation.js';
import { buildMenuCardMessage, buildWhatsAppUrl, isValidWhatsAppNumber } from '../services/whatsappService.js';
import { WhatsAppIcon } from './WhatsAppButton.jsx';
import styles from './EnquirySheet.module.css';

const DETAILS_KEY = 'lhc.menucard.details.v1';
const GUEST_PRESETS = [50, 100, 200, 500];
const EMPTY = { guests: '', date: '', name: '', eventType: '', notes: '' };

function readDetails() {
  try {
    const saved = JSON.parse(localStorage.getItem(DETAILS_KEY) || '{}');
    const d = { ...EMPTY, ...(saved && typeof saved === 'object' ? saved : {}) };
    // A saved date that has already passed is no use.
    if (d.date && d.date < minEventDate()) d.date = '';
    return d;
  } catch {
    return { ...EMPTY };
  }
}

function validate(d) {
  const errors = {};
  const g = Number(String(d.guests).trim());
  if (!String(d.guests).trim()) errors.guests = 'err.guests';
  else if (!Number.isInteger(g) || g < 1) errors.guests = 'err.guestsNum';
  else if (g > 100000) errors.guests = 'err.guestsHigh';
  if (!d.date) errors.date = 'err.date';
  else if (d.date < minEventDate()) errors.date = 'err.datePast';
  return errors;
}

/** Options shown as words; the chosen one gets a pen circle. */
function CircleChoice({ options, value, onChange, label, format = (o) => o }) {
  return (
    <div className={styles.choices} role="radiogroup" aria-label={label}>
      {options.map((o) => {
        const on = String(value) === String(o);
        return (
          <button
            key={o}
            type="button"
            role="radio"
            aria-checked={on}
            className={styles.choice}
            onClick={() => onChange(on ? '' : String(o))}
          >
            {format(o)}
          </button>
        );
      })}
    </div>
  );
}

export default function EnquirySheet({ open, onClose, business, groups, count, onRemove, lang = 'en', t = makeT('en') }) {
  const [details, setDetails] = useState(readDetails);
  const [errors, setErrors] = useState({});
  const guestsRef = useRef(null);
  const dateRef = useRef(null);
  const panelRef = useRef(null);

  useEffect(() => {
    try {
      localStorage.setItem(DETAILS_KEY, JSON.stringify(details));
    } catch {
      /* ignore */
    }
  }, [details]);

  // Lock page scroll, close on Escape, return focus when closed.
  useEffect(() => {
    if (!open) return undefined;
    const prevFocus = document.activeElement;
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    panelRef.current?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      prevFocus?.focus?.();
    };
  }, [open, onClose]);

  const set = (key) => (e) => {
    const value = typeof e === 'object' && e?.target ? e.target.value : e;
    setDetails((d) => ({ ...d, [key]: value }));
    if (errors[key]) setErrors((x) => ({ ...x, [key]: undefined }));
  };

  const configured = isValidWhatsAppNumber(business.whatsappNumber);

  const send = () => {
    const errs = validate(details);
    setErrors(errs);
    if (errs.guests) return guestsRef.current?.focus();
    if (errs.date) return dateRef.current?.focus();
    const message = buildMenuCardMessage({
      businessName: business.name,
      details,
      groups,
      lang,
      occasionLabel: details.eventType ? pick(lang, details.eventType, OCCASION_TE[details.eventType]) : '',
    });
    // Same tab hand-off is the most reliable way into the WhatsApp app on phones.
    window.location.href = buildWhatsAppUrl(business.whatsappNumber, message);
  };

  return (
    <div className={styles.root} data-open={open || undefined} data-lang={lang} aria-hidden={!open}>
      <div className={styles.scrim} onClick={onClose} />
      <div
        ref={panelRef}
        className={styles.slip}
        role="dialog"
        aria-modal="true"
        aria-labelledby="slip-title"
        tabIndex={-1}
        inert={open ? undefined : ''}
      >
        <div className={styles.perf} aria-hidden="true" />

        <div className={styles.scroll}>
          <header className={styles.head}>
            <button type="button" className={styles.close} onClick={onClose}>
              {t('slip.close')}
            </button>
            <p className={styles.house}>{business.name}</p>
            <h2 id="slip-title">{t('slip.title')}</h2>
            <span className={styles.orn} aria-hidden="true">
              <span />◆<span />
            </span>
          </header>

          {/* What they ticked */}
          <section className={styles.part}>
            <h3 className={styles.partTitle}>
              {t('slip.dishes')} <span>{count ? `(${count})` : ''}</span>
            </h3>
            {count === 0 ? (
              <p className={styles.none}>
                {t('slip.none')}{' '}
                <button type="button" onClick={onClose}>
                  {t('slip.back')}
                </button>
                .
              </p>
            ) : (
              <div className={styles.ledger}>
                {groups.map((g) => (
                  <div key={g.title} className={styles.ledgerGroup}>
                    <p className={styles.ledgerHead}>{pick(lang, g.title, g.titleTe)}</p>
                    <ul>
                      {g.items.map((i) => (
                        <li key={i.key}>
                          <span>{pick(lang, i.name, i.nameTe)}</span>
                          <button type="button" onClick={() => onRemove(i.key)} aria-label={`${t('slip.remove')} ${i.name}`}>
                            {t('slip.remove')}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Fill in the blanks */}
          <section className={styles.part}>
            <h3 className={styles.partTitle}>{t('slip.event')}</h3>

            <div className={styles.pair}>
              <div>
                <div className={styles.blank} data-invalid={errors.guests ? true : undefined}>
                  <label htmlFor="f-guests">{t('slip.guests')}</label>
                  <input
                    id="f-guests"
                    ref={guestsRef}
                    type="number"
                    inputMode="numeric"
                    min="1"
                    step="1"
                    placeholder={t('slip.guestsPh')}
                    value={details.guests}
                    onChange={set('guests')}
                    aria-invalid={Boolean(errors.guests)}
                    aria-describedby={errors.guests ? 'e-guests' : undefined}
                  />
                </div>
                <div className={styles.quick}>
                  <CircleChoice
                    options={GUEST_PRESETS}
                    value={details.guests}
                    onChange={set('guests')}
                    label="Quick guest count"
                  />
                </div>
                {errors.guests && (
                  <p id="e-guests" className={styles.error}>
                    {t(errors.guests)}
                  </p>
                )}
              </div>

              <div>
                <div className={styles.blank} data-invalid={errors.date ? true : undefined}>
                  <label htmlFor="f-date">{t('slip.date')}</label>
                  <input
                    id="f-date"
                    ref={dateRef}
                    type="date"
                    min={minEventDate()}
                    value={details.date}
                    data-empty={details.date ? undefined : true}
                    onChange={set('date')}
                    aria-invalid={Boolean(errors.date)}
                    aria-describedby={errors.date ? 'e-date' : undefined}
                  />
                </div>
                {errors.date && (
                  <p id="e-date" className={styles.error}>
                    {t(errors.date)}
                  </p>
                )}
              </div>
            </div>

            <p className={styles.subLabel}>
              {t('slip.occasion')} <em>{t('slip.occasionHint')}</em>
            </p>
            <CircleChoice
              options={appConfig.eventTypes}
              value={details.eventType}
              onChange={set('eventType')}
              label={t('slip.occasion')}
              format={(o) => pick(lang, o, OCCASION_TE[o])}
            />

            <div className={styles.blank}>
              <label htmlFor="f-name">
                {t('slip.name')} <em>{t('slip.optional')}</em>
              </label>
              <input
                id="f-name"
                type="text"
                autoComplete="name"
                placeholder={t('slip.namePh')}
                value={details.name}
                onChange={set('name')}
              />
            </div>

            <div className={styles.notes}>
              <label htmlFor="f-notes">
                {t('slip.notes')} <em>{t('slip.notesHint')}</em>
              </label>
              <textarea id="f-notes" rows={3} maxLength={500} value={details.notes} onChange={set('notes')} />
            </div>
          </section>
        </div>

        <footer className={styles.foot}>
          <button type="button" className={styles.send} onClick={send} disabled={!configured}>
            <WhatsAppIcon size={18} />
            {t('slip.send')}
          </button>
          <p className={styles.footNote}>{configured ? t('slip.foot') : t('slip.noNumber')}</p>
          <p className={styles.callLine}>
            {t('slip.call')}{' '}
            <a href={`tel:${business.phoneNumber.replace(/[^\d+]/g, '')}`}>{business.phoneNumber}</a>
          </p>
        </footer>
      </div>
    </div>
  );
}
