import { ArrowUpRight, Check, Users } from 'lucide-react';
import SmartImage from './SmartImage.jsx';
import { formatCurrency } from '../utils/formatCurrency.js';
import styles from './PackageCard.module.css';

export default function PackageCard({ pkg, inCart, onView, onAdd, index }) {
  return (
    <article className={`${styles.card} ${inCart ? styles.added : ''}`} style={{ '--i': index }} aria-labelledby={`pkg-${pkg.id}`}>
      <button type="button" className={styles.media} onClick={() => onView(pkg)} tabIndex={-1} aria-hidden="true">
        <SmartImage src={pkg.image} alt="" className={styles.image} />
        <span className={styles.viewHint}>
          View details <ArrowUpRight size={16} aria-hidden="true" />
        </span>
      </button>
      <div className={styles.body}>
        <h3 id={`pkg-${pkg.id}`} className={styles.name}>
          {pkg.name}
        </h3>
        {pkg.description && <p className={styles.desc}>{pkg.description}</p>}
        <div className={styles.facts}>
          <p className={styles.price}>
            {pkg.pricePerPerson !== null ? (
              <>
                <span className={styles.from}>From</span>
                <span className={styles.amount}>{formatCurrency(pkg.pricePerPerson)}</span>
                <span className={styles.unit}>/ person</span>
              </>
            ) : (
              <span className={styles.onRequest}>Price on request</span>
            )}
          </p>
          {pkg.minGuests > 1 && (
            <p className={styles.min}>
              <Users size={14} aria-hidden="true" /> Min. {pkg.minGuests} guests
            </p>
          )}
        </div>
        <div className={styles.actions}>
          <button type="button" className="btn btn-outline btn-sm" onClick={() => onView(pkg)}>
            View details
          </button>
          <button
            type="button"
            className={`btn btn-sm ${inCart ? 'btn-gold' : 'btn-primary'}`}
            onClick={(e) => onAdd(pkg, e.currentTarget)}
          >
            {inCart ? (
              <>
                <Check size={16} aria-hidden="true" /> Added
              </>
            ) : (
              'Add to enquiry'
            )}
          </button>
        </div>
      </div>
    </article>
  );
}
