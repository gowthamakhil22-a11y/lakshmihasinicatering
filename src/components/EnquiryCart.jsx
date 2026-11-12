import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Copy,
  Info,
  MapPin,
  Pencil,
  ShoppingBag,
  Trash2,
  Users,
  UtensilsCrossed,
  X,
} from 'lucide-react';
import { appConfig } from '../config/appConfig.js';
import { useCart } from '../hooks/useCart.js';
import { useFocusTrap, useLockBody, usePresence } from '../hooks/useMotion.js';
import { buildEnquiryMessage, buildWhatsAppUrl, isValidWhatsAppNumber } from '../services/whatsappService.js';
import { formatCurrency, formatUnit } from '../utils/formatCurrency.js';
import { emptyEventDetails, validateEventDetails } from '../utils/validation.js';
import EventDetailsForm from './EventDetailsForm.jsx';
import QuantityStepper from './QuantityStepper.jsx';
import WhatsAppButton from './WhatsAppButton.jsx';
import { useToast } from './Toast.jsx';
import styles from './EnquiryCart.module.css';

const STEPS = ['Your menu', 'Event details', 'Review and send'];

function loadDetails() {
  try {
    const raw = localStorage.getItem(appConfig.storageKeys.eventDetails);
    return raw ? { ...emptyEventDetails, ...JSON.parse(raw) } : emptyEventDetails;
  } catch {
    return emptyEventDetails;
  }
}

function formatDisplayDate(iso) {
  if (!iso) return 'Date not decided';
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function EnquiryCart({ business }) {
  const cart = useCart();
  const toast = useToast();
  const { mounted, visible } = usePresence(cart.isOpen, 500);
  const dialogRef = useRef(null);
  const formRef = useRef(null);
  const bodyRef = useRef(null);
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [details, setDetails] = useState(loadDetails);
  const [errors, setErrors] = useState({});
  const [attempted, setAttempted] = useState(false);
  const [shakeKey, setShakeKey] = useState(0);
  const [leaving, setLeaving] = useState(() => new Set());
  const [copied, setCopied] = useState(false);

  useLockBody(cart.isOpen);
  useFocusTrap(cart.isOpen, dialogRef, cart.close);

  useEffect(() => {
    if (cart.isOpen) {
      setStep(cart.initialStep);
      setDir(1);
    }
  }, [cart.isOpen, cart.initialStep]);

  useEffect(() => {
    try {
      localStorage.setItem(appConfig.storageKeys.eventDetails, JSON.stringify(details));
    } catch {
      /* ignore */
    }
  }, [details]);

  useEffect(() => {
    bodyRef.current?.scrollTo({ top: 0 });
  }, [step]);

  const message = useMemo(
    () =>
      buildEnquiryMessage({
        businessName: business.name,
        details,
        lines: cart.lines,
        total: cart.total,
        hasUnpriced: cart.hasUnpriced,
      }),
    [business.name, details, cart.lines, cart.total, cart.hasUnpriced],
  );
  const waUrl = buildWhatsAppUrl(business.whatsappNumber, message);
  const waConfigured = isValidWhatsAppNumber(business.whatsappNumber);

  if (!mounted) return null;

  const go = (next) => {
    setDir(next > step ? 1 : -1);
    setStep(next);
  };

  const onFieldChange = (field, value) => {
    setDetails((d) => {
      const next = { ...d, [field]: value };
      if (attempted) setErrors(validateEventDetails(next));
      return next;
    });
  };

  const submitDetails = () => {
    const found = validateEventDetails(details);
    setErrors(found);
    setAttempted(true);
    if (Object.keys(found).length) {
      setShakeKey((k) => k + 1);
      requestAnimationFrame(() => {
        const first = formRef.current?.querySelector('[aria-invalid="true"], fieldset[aria-describedby] input');
        first?.focus();
        first?.scrollIntoView({ block: 'center', behavior: 'smooth' });
      });
      return;
    }
    go(2);
  };

  const removeLine = (line) => {
    setLeaving((s) => new Set(s).add(line.key));
    setTimeout(() => {
      cart.remove(line.key);
      setLeaving((s) => {
        const n = new Set(s);
        n.delete(line.key);
        return n;
      });
    }, 280);
    toast.show({
      message: `${line.name} removed`,
      action: { label: 'Undo', onClick: () => cart.add({ ...line, step: 0 }) },
      duration: 4000,
    });
  };

  const copyMessage = async () => {
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.show({ message: 'Copy is not available in this browser. Select the preview text instead.' });
    }
  };

  const startOver = () => {
    cart.clear();
    setDetails(emptyEventDetails);
    setErrors({});
    setAttempted(false);
    cart.close();
  };

  const totalBlock = (
    <div className={styles.total}>
      <span className={styles.totalLabel}>
        Estimated total
        {cart.hasUnpriced && <span className={styles.totalNote}>+ items priced on request</span>}
      </span>
      <span key={cart.total} className={styles.totalValue}>
        {formatCurrency(cart.total)}
      </span>
    </div>
  );

  let body;
  let footer;

  if (step === 0) {
    body = cart.lines.length ? (
      <>
        <ul className={styles.lines}>
          {cart.lines.map((line, i) => {
            const priced = line.price !== null && line.price !== undefined;
            return (
              <li
                key={line.key}
                className={`${styles.line} ${leaving.has(line.key) ? styles.lineLeaving : ''}`}
                style={{ '--i': i }}
              >
                <div className={styles.lineTop}>
                  <div className={styles.lineInfo}>
                    {line.kind === 'package' && <span className={styles.kind}>Package</span>}
                    <p className={styles.lineName}>{line.name}</p>
                    <p className={styles.linePrice}>
                      {priced ? `${formatCurrency(line.price)} ${formatUnit(line.unit)}` : 'Price on request'}
                    </p>
                  </div>
                  <button
                    type="button"
                    className={styles.remove}
                    onClick={() => removeLine(line)}
                    aria-label={`Remove ${line.name}`}
                  >
                    <Trash2 size={16} aria-hidden="true" />
                  </button>
                </div>
                <div className={styles.lineBottom}>
                  <div className={styles.qty}>
                    <QuantityStepper
                      size="sm"
                      value={line.quantity}
                      min={line.minQuantity || 1}
                      label={line.name}
                      onChange={(q) => cart.setQuantity(line.key, q)}
                    />
                    {line.kind === 'package' && <span className={styles.qtyUnit}>guests</span>}
                  </div>
                  <span key={line.quantity} className={styles.lineTotal}>
                    {priced ? formatCurrency(line.price * line.quantity) : 'On request'}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
        <p className={styles.notice}>
          <Info size={16} aria-hidden="true" />
          <span>
            Prices shown are indicative. {business.name} confirms the final quotation after discussing your event.
          </span>
        </p>
      </>
    ) : (
      <div className={styles.empty}>
        <span className={styles.emptyIcon}>
          <ShoppingBag size={28} strokeWidth={1.5} aria-hidden="true" />
        </span>
        <h3 className="heading-3">Your enquiry is empty</h3>
        <p>Add dishes or a package from the menu, or continue and tell us about your event. We can suggest a menu for you.</p>
        <a
          href="#menu"
          className="btn btn-outline"
          onClick={() => cart.close()}
        >
          <UtensilsCrossed size={18} aria-hidden="true" /> Browse the menu
        </a>
      </div>
    );
    footer = (
      <>
        {cart.lines.length > 0 && totalBlock}
        <button type="button" className="btn btn-primary btn-block" onClick={() => go(1)}>
          {cart.lines.length ? 'Continue to event details' : 'Continue without dishes'}
          <ArrowRight size={18} className="btn-arrow" aria-hidden="true" />
        </button>
      </>
    );
  } else if (step === 1) {
    body = (
      <EventDetailsForm
        ref={formRef}
        values={details}
        errors={errors}
        onChange={onFieldChange}
        onSubmit={submitDetails}
        shakeKey={shakeKey}
      />
    );
    footer = (
      <div className={styles.footerRow}>
        <button type="button" className="btn btn-ghost" onClick={() => go(0)}>
          <ArrowLeft size={18} aria-hidden="true" /> Back
        </button>
        <button type="button" className="btn btn-primary" onClick={submitDetails}>
          Review enquiry <ArrowRight size={18} className="btn-arrow" aria-hidden="true" />
        </button>
      </div>
    );
  } else if (step === 2) {
    body = (
      <div className={styles.review}>
        <section className={styles.card} aria-labelledby="review-event">
          <div className={styles.cardHead}>
            <h3 id="review-event" className="title-2">
              {details.eventType} for {details.name.trim()}
            </h3>
            <button type="button" className={styles.edit} onClick={() => go(1)}>
              <Pencil size={14} aria-hidden="true" /> Edit
            </button>
          </div>
          <ul className={styles.facts}>
            <li>
              <CalendarDays size={16} aria-hidden="true" /> {formatDisplayDate(details.date)}
            </li>
            <li>
              <Users size={16} aria-hidden="true" /> {Number(details.guests).toLocaleString('en-IN')} guests
            </li>
            <li>
              <MapPin size={16} aria-hidden="true" /> {details.location.trim()}
            </li>
            {details.foodPreference && (
              <li>
                <UtensilsCrossed size={16} aria-hidden="true" /> {details.foodPreference}
              </li>
            )}
          </ul>
        </section>

        <section className={styles.card} aria-labelledby="review-menu">
          <div className={styles.cardHead}>
            <h3 id="review-menu" className="title-2">
              Selected menu
            </h3>
            <button type="button" className={styles.edit} onClick={() => go(0)}>
              <Pencil size={14} aria-hidden="true" /> Edit
            </button>
          </div>
          {cart.lines.length ? (
            <ul className={styles.summary}>
              {cart.lines.map((l) => (
                <li key={l.key}>
                  <span>
                    {l.name}
                    <span className={styles.summaryQty}>
                      {' '}
                      × {l.quantity}
                      {l.kind === 'package' ? ' guests' : ''}
                    </span>
                  </span>
                  <span>{l.price !== null && l.price !== undefined ? formatCurrency(l.price * l.quantity) : 'On request'}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className={styles.muted}>No dishes selected. We will suggest a menu for your event.</p>
          )}
          {cart.lines.length > 0 && totalBlock}
        </section>

        <section aria-labelledby="review-preview">
          <div className={styles.cardHead}>
            <h3 id="review-preview" className="title-3">
              Message preview
            </h3>
            <button type="button" className={styles.edit} onClick={copyMessage}>
              <Copy size={14} aria-hidden="true" /> {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
          <div className={styles.chat}>
            <pre className={styles.bubble}>{message}</pre>
          </div>
        </section>

        {!waConfigured && (
          <p className={styles.configError} role="alert">
            WhatsApp enquiries are not set up yet. Please call us on {business.phoneNumber} instead.
          </p>
        )}
      </div>
    );
    footer = (
      <>
        <WhatsAppButton
          url={waUrl}
          number={business.whatsappNumber}
          onOpened={() => {
            setDir(1);
            setStep(3);
          }}
        />
        <p className={styles.footNote}>WhatsApp opens with your message. Review it and tap send.</p>
      </>
    );
  } else {
    body = (
      <div className={styles.success}>
        <svg className={styles.successMark} viewBox="0 0 80 80" aria-hidden="true">
          <circle cx="40" cy="40" r="36" />
          <path d="M25 41.5 35 51l20-22" />
        </svg>
        <h3 className="heading-3">Your enquiry is ready in WhatsApp</h3>
        <p>
          Tap <strong>send</strong> in WhatsApp to share it with {business.name}. We will reply with your quotation.
        </p>
        <a className={styles.retry} href={waUrl} target="_blank" rel="noopener noreferrer">
          WhatsApp did not open? Tap here to try again.
        </a>
      </div>
    );
    footer = (
      <div className={styles.footerRow}>
        <button type="button" className="btn btn-ghost" onClick={cart.close}>
          Back to menu
        </button>
        <button type="button" className="btn btn-primary" onClick={startOver}>
          Start a new enquiry
        </button>
      </div>
    );
  }

  const progressStep = Math.min(step, 2);

  return (
    <div className={`${styles.root} ${visible ? styles.visible : ''}`}>
      <div className={styles.backdrop} onClick={cart.close} aria-hidden="true" />
      <aside ref={dialogRef} className={styles.drawer} role="dialog" aria-modal="true" aria-labelledby="enquiry-title">
        <span className={styles.handle} aria-hidden="true" />
        <header className={styles.head}>
          <div>
            <p className={styles.headEyebrow}>{step === 3 ? 'Enquiry sent to WhatsApp' : `Step ${step + 1} of 3`}</p>
            <h2 id="enquiry-title" className={styles.title}>
              {step === 3 ? 'Thank you' : STEPS[step]}
            </h2>
          </div>
          <button type="button" className={styles.close} onClick={cart.close} aria-label="Close enquiry">
            <X size={20} aria-hidden="true" />
          </button>
        </header>
        <ol className={styles.progress} aria-label="Enquiry progress">
          {STEPS.map((label, i) => (
            <li
              key={label}
              className={`${i <= progressStep || step === 3 ? styles.progressDone : ''}`}
              aria-current={i === step ? 'step' : undefined}
            >
              <span className={styles.progressBar}>
                <span />
              </span>
              <span className={styles.progressLabel}>{label}</span>
            </li>
          ))}
        </ol>

        <div className={styles.body} ref={bodyRef}>
          <div key={step} className={styles.panel} data-dir={dir > 0 ? 'forward' : 'back'}>
            {body}
          </div>
        </div>

        <footer className={styles.footer}>{footer}</footer>
      </aside>
    </div>
  );
}
