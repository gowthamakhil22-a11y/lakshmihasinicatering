import { memo, useRef } from 'react';
import { Check, Plus, Star } from 'lucide-react';
import { formatCurrency, formatUnit } from '../utils/formatCurrency.js';
import QuantityStepper from './QuantityStepper.jsx';
import SmartImage from './SmartImage.jsx';
import styles from './FoodCard.module.css';

const FOOD_TYPE_LABEL = { veg: 'Vegetarian', 'non-veg': 'Non vegetarian', egg: 'Contains egg' };

function FoodCard({ item, quantity, index = 0, categoryName, onAdd, onQuantity, onRemove }) {
  const addRef = useRef(null);
  const selected = quantity > 0;
  const priced = item.price !== null;

  return (
    <article
      className={`${styles.card} ${selected ? styles.selected : ''} ${item.image ? styles.hasImage : ''}`}
      style={{ '--i': Math.min(index, 12) }}
      aria-labelledby={`dish-${item.id}`}
    >
      {item.image && (
        <div className={styles.media}>
          <SmartImage src={item.image} alt={item.name} className={styles.image} />
        </div>
      )}
      <span className={styles.check} aria-hidden="true">
        <Check size={14} strokeWidth={2.5} />
      </span>

      <div className={styles.meta}>
        {item.foodType && (
          <span className={`${styles.diet} ${styles[item.foodType.replace('-', '')]}`} title={FOOD_TYPE_LABEL[item.foodType]}>
            <span className={styles.dietMark} aria-hidden="true" />
            <span className="visually-hidden">{FOOD_TYPE_LABEL[item.foodType]}</span>
          </span>
        )}
        {categoryName && <span className={styles.category}>{categoryName}</span>}
        {item.featured && (
          <span className={styles.featured}>
            <Star size={12} fill="currentColor" aria-hidden="true" /> Chef&rsquo;s pick
          </span>
        )}
      </div>

      <h3 id={`dish-${item.id}`} className={styles.name}>
        {item.name}
      </h3>
      {item.description && <p className={styles.desc}>{item.description}</p>}

      <div className={styles.footer}>
        <p className={styles.price}>
          {priced ? (
            <>
              <span className={styles.amount}>{formatCurrency(item.price)}</span>
              {item.unit && <span className={styles.unit}>{formatUnit(item.unit)}</span>}
            </>
          ) : (
            <span className={styles.onRequest}>Price on request</span>
          )}
        </p>

        <div className={styles.action} data-selected={selected}>
          <button
            ref={addRef}
            type="button"
            className={styles.add}
            onClick={() => onAdd(item, addRef.current)}
            tabIndex={selected ? -1 : 0}
            aria-hidden={selected}
            aria-label={`Add ${item.name} to enquiry`}
          >
            <Plus size={16} aria-hidden="true" />
            Add
          </button>
          <div className={styles.stepperWrap} aria-hidden={!selected} inert={selected ? undefined : ''}>
            {selected && (
              <QuantityStepper
                value={quantity}
                label={item.name}
                onChange={(q) => onQuantity(item, q)}
                onRemove={() => onRemove(item)}
              />
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

export default memo(FoodCard);
