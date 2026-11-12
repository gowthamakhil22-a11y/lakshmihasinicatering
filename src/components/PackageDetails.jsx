import { useEffect, useRef, useState } from 'react';
import { Check, X } from 'lucide-react';
import SmartImage from './SmartImage.jsx';
import QuantityStepper from './QuantityStepper.jsx';
import { formatCurrency } from '../utils/formatCurrency.js';
import { useFocusTrap, useLockBody, usePresence } from '../hooks/useMotion.js';
import styles from './PackageDetails.module.css';

export default function PackageDetails({ pkg, open, onClose, onConfirm, currentGuests }) {
  const { mounted, visible } = usePresence(open, 450);
  const dialogRef = useRef(null);
  const [guests, setGuests] = useState(1);
  const [shown, setShown] = useState(pkg);

  // Keep showing the last package while the dialog animates out.
  useEffect(() => {
    if (pkg) {
      setShown(pkg);
      setGuests(currentGuests || pkg.minGuests);
    }
  }, [pkg, currentGuests]);

  useLockBody(open);
  useFocusTrap(open, dialogRef, onClose);

  if (!mounted || !shown) return null;
  const p = shown;
  const total = p.pricePerPerson !== null ? p.pricePerPerson * guests : null;

  return (
    <div className={`${styles.root} ${visible ? styles.visible : ''}`}>
      <div className={styles.backdrop} onClick={onClose} aria-hidden="true" />
      <div
        ref={dialogRef}
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="pkg-dialog-title"
      >
        <button type="button" className={styles.close} onClick={onClose} aria-label="Close package details">
          <X size={20} aria-hidden="true" />
        </button>
        <SmartImage src={p.image} alt={`${p.name} catering spread`} className={styles.image} />
        <div className={styles.body}>
          <p className="eyebrow">Catering package</p>
          <h2 id="pkg-dialog-title" className="heading-2">
            {p.name}
          </h2>
          {p.description && <p className={styles.desc}>{p.description}</p>}

          {p.inclusions.length > 0 && (
            <div className={styles.inclusions}>
              <h3 className="title-3">What is included</h3>
              <ul>
                {p.inclusions.map((inc, i) => (
                  <li key={inc} style={{ '--i': i }}>
                    <Check size={16} aria-hidden="true" />
                    {inc}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className={styles.calc}>
            <div>
              <p className={styles.calcLabel}>Number of guests</p>
              {p.minGuests > 1 && <p className={styles.calcHint}>Minimum {p.minGuests} guests</p>}
            </div>
            <QuantityStepper value={guests} min={p.minGuests} label={`${p.name} guests`} onChange={setGuests} />
          </div>

          <div className={styles.footer}>
            <div>
              <p className={styles.calcLabel}>Estimated total</p>
              <p className={styles.total}>
                {total !== null ? (
                  <span key={total} className={styles.totalValue}>
                    {formatCurrency(total)}
                  </span>
                ) : (
                  'Price on request'
                )}
              </p>
              {p.pricePerPerson !== null && (
                <p className={styles.calcHint}>
                  {formatCurrency(p.pricePerPerson)} per person. Indicative only.
                </p>
              )}
            </div>
            <button type="button" className="btn btn-primary" data-autofocus onClick={() => onConfirm(p, guests)}>
              {currentGuests ? 'Update enquiry' : 'Add to enquiry'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
