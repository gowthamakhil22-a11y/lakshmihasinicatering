import { useEffect } from 'react';
import { ArrowRight, ShoppingBag } from 'lucide-react';
import { useCart } from '../hooks/useCart.js';
import { formatCurrency } from '../utils/formatCurrency.js';
import styles from './MobileCartBar.module.css';

/** Sticky summary on phones and tablets, so the enquiry is always one tap away. */
export default function MobileCartBar() {
  const { count, total, hasUnpriced, open, isOpen } = useCart();
  const show = count > 0 && !isOpen;

  useEffect(() => {
    document.body.classList.toggle('has-cart-bar', count > 0);
  }, [count]);

  return (
    <div className={`${styles.wrap} ${show ? styles.show : ''}`} aria-hidden={!show} inert={show ? undefined : ''}>
      <button type="button" className={styles.bar} onClick={() => open(0)}>
        <span className={styles.icon}>
          <ShoppingBag size={20} aria-hidden="true" />
          <span key={count} className={styles.count}>
            {count}
          </span>
        </span>
        <span className={styles.text}>
          <span className={styles.label}>
            {count} {count === 1 ? 'item' : 'items'} selected
          </span>
          <span className={styles.total}>
            {formatCurrency(total)}
            {hasUnpriced ? ' +' : ''} estimated
          </span>
        </span>
        <span className={styles.cta}>
          Review <ArrowRight size={16} aria-hidden="true" />
        </span>
      </button>
    </div>
  );
}
