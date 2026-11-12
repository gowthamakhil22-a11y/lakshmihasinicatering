import { ChefHat, Wheat, PartyPopper } from 'lucide-react';
import Reveal from './Reveal.jsx';
import styles from './TrustSection.module.css';

const FEATURES = [
  {
    icon: ChefHat,
    title: 'Freshly prepared',
    text: 'Dishes are prepared fresh for each event and served at their best.',
  },
  {
    icon: Wheat,
    title: 'Quality ingredients',
    text: 'Fresh produce, good oils and whole spices, chosen for flavour and care.',
  },
  {
    icon: PartyPopper,
    title: 'Catering for every occasion',
    text: 'From an intimate pooja to a full wedding, we plan the menu around your guests.',
  },
];

const OCCASIONS = ['Weddings', 'Birthdays', 'Family functions', 'Corporate events', 'Engagements', 'Housewarmings', 'Special occasions'];

export default function TrustSection() {
  return (
    <>
      <div className={styles.marquee} aria-hidden="true">
        <div className={styles.track}>
          {[0, 1].map((copy) => (
            <ul key={copy} className={styles.group}>
              {OCCASIONS.map((o) => (
                <li key={o}>
                  {o}
                  <span className={styles.star}>✦</span>
                </li>
              ))}
            </ul>
          ))}
        </div>
      </div>

      <section className={`section ${styles.section}`} aria-label="Why families choose us">
        <div className="container">
          <ul className={styles.grid}>
            {FEATURES.map(({ icon: Icon, title, text }, i) => (
              <Reveal as="li" key={title} delay={i * 120} className={styles.item}>
                <span className={styles.icon}>
                  <Icon size={24} strokeWidth={1.5} aria-hidden="true" />
                </span>
                <h2 className={`title-1 ${styles.title}`}>{title}</h2>
                <p className="body-6">{text}</p>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
