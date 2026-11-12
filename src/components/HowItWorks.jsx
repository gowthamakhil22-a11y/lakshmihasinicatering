import { ListChecks, CalendarHeart, MessageCircle } from 'lucide-react';
import Reveal from './Reveal.jsx';
import { useInView } from '../hooks/useMotion.js';
import styles from './HowItWorks.module.css';

const STEPS = [
  { icon: ListChecks, title: 'Choose your dishes', text: 'Browse the menu and add the dishes or package you would like. Change quantities any time.' },
  { icon: CalendarHeart, title: 'Share your event details', text: 'Tell us the occasion, date, venue and how many guests you expect.' },
  { icon: MessageCircle, title: 'Get your quotation', text: 'Your enquiry opens in WhatsApp, ready to send. We reply with a confirmed quotation.' },
];

export default function HowItWorks() {
  const [lineRef, lineVisible] = useInView();
  return (
    <section id="how-it-works" className={`section ${styles.section}`} aria-labelledby="how-title">
      <div className="container">
        <Reveal className="section-head">
          <p className="eyebrow">How it works</p>
          <h2 id="how-title" className="heading-2">Three simple steps to your enquiry</h2>
        </Reveal>
        <ol className={styles.steps} ref={lineRef}>
          <span className={`${styles.connector} ${lineVisible ? styles.drawn : ''}`} aria-hidden="true" />
          {STEPS.map(({ icon: Icon, title, text }, i) => (
            <Reveal as="li" key={title} delay={150 + i * 160} className={styles.step}>
              <span className={styles.badge}>
                <Icon size={22} strokeWidth={1.5} aria-hidden="true" />
                <span className={styles.num}>{i + 1}</span>
              </span>
              <h3 className={`title-1 ${styles.title}`}>{title}</h3>
              <p className="body-6">{text}</p>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}
