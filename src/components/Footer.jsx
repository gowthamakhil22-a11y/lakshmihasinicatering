import { Building2, Cake, Gem, Mail, MapPin, Phone, Users, Wine } from 'lucide-react';
import { BrandMark, Flourish, Lotus } from './BrandMark.jsx';
import { WhatsAppIcon } from './WhatsAppButton.jsx';
import Reveal from './Reveal.jsx';
import { NAV_LINKS } from './Header.jsx';
import { isValidWhatsAppNumber, sanitizeWhatsAppNumber } from '../services/whatsappService.js';
import styles from './Footer.module.css';

const OCCASIONS = [
  { icon: Gem, label: 'Weddings' },
  { icon: Cake, label: 'Birthdays' },
  { icon: Users, label: 'Family functions' },
  { icon: Building2, label: 'Corporate events' },
  { icon: Wine, label: 'Special occasions' },
];

export default function Footer({ business, onEnquire }) {
  const wa = sanitizeWhatsAppNumber(business.whatsappNumber);
  const waOk = isValidWhatsAppNumber(wa);
  const tel = business.phoneNumber.replace(/[^\d+]/g, '');
  const maps =
    business.mapsUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(business.location)}`;
  const waDisplay = waOk ? `+${wa.slice(0, wa.length - 10)} ${wa.slice(-10, -5)} ${wa.slice(-5)}` : '';
  const year = new Date().getFullYear();

  return (
    <>
      <section id="contact" className={`section ${styles.contact}`} aria-labelledby="contact-title">
        <div className="container">
          <Reveal className={styles.card}>
            <div className={styles.panel}>
              <Lotus className={styles.lotus} />
              <span className={styles.panelMark}>
                <BrandMark size={56} />
              </span>
              <p className="eyebrow">Get in touch</p>
              <h2 id="contact-title" className={`heading-2 ${styles.panelTitle}`}>
                Planning an occasion? Tell us about it.
              </h2>
              <Flourish className={styles.flourish} />
              <p className={styles.panelText}>{business.tagline}</p>
              <button type="button" className="btn btn-gold" onClick={onEnquire}>
                Send enquiry
              </button>
            </div>

            <div className={styles.details}>
              <ul className={styles.occasions} aria-label="Occasions we cater">
                {OCCASIONS.map(({ icon: Icon, label }, i) => (
                  <li key={label} style={{ '--i': i }}>
                    <span className={styles.occIcon}>
                      <Icon size={22} strokeWidth={1.4} aria-hidden="true" />
                    </span>
                    {label}
                  </li>
                ))}
              </ul>

              <ul className={styles.contactList}>
                <li>
                  <span className={styles.tile}>
                    <Phone size={18} aria-hidden="true" />
                  </span>
                  <a href={`tel:${tel}`}>
                    <span className={styles.k}>Call us</span>
                    {business.phoneNumber}
                  </a>
                </li>
                {waOk && (
                  <li>
                    <span className={styles.tile}>
                      <WhatsAppIcon size={18} />
                    </span>
                    <a href={`https://wa.me/${wa}`} target="_blank" rel="noopener noreferrer">
                      <span className={styles.k}>WhatsApp</span>
                      {waDisplay}
                    </a>
                  </li>
                )}
                {business.email && (
                  <li>
                    <span className={styles.tile}>
                      <Mail size={18} aria-hidden="true" />
                    </span>
                    <a href={`mailto:${business.email}`}>
                      <span className={styles.k}>Email</span>
                      <span className={styles.wrap}>{business.email}</span>
                    </a>
                  </li>
                )}
                <li>
                  <span className={styles.tile}>
                    <MapPin size={18} aria-hidden="true" />
                  </span>
                  <a href={maps} target="_blank" rel="noopener noreferrer">
                    <span className={styles.k}>Visit us</span>
                    {business.location}
                  </a>
                </li>
              </ul>
            </div>
          </Reveal>
        </div>
      </section>

      <footer className={styles.footer}>
        <div className={`container ${styles.footerInner}`}>
          <div className={styles.brand}>
            <span className={styles.brandMark}>
              <BrandMark size={32} />
            </span>
            <div>
              <p className={styles.brandName}>{business.name}</p>
              <p className={styles.brandDesc}>{business.description}</p>
            </div>
          </div>
          <nav aria-label="Footer">
            <ul className={styles.links}>
              {NAV_LINKS.map((l) => (
                <li key={l.id}>
                  <a href={`#${l.id}`}>{l.label}</a>
                </li>
              ))}
            </ul>
          </nav>
        </div>
        <div className={`container ${styles.legal}`}>
          <p>
            © {year} {business.name}. All rights reserved.
          </p>
          <p>Your enquiry goes straight to our WhatsApp. This site does not store your personal details.</p>
        </div>
      </footer>
    </>
  );
}
