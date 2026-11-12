import { useState } from 'react';
import { PackageOpen } from 'lucide-react';
import PackageCard from './PackageCard.jsx';
import PackageDetails from './PackageDetails.jsx';
import Reveal from './Reveal.jsx';
import { lineKey, packageToLine, useCart } from '../hooks/useCart.js';
import { flyToCart } from '../hooks/useMotion.js';
import { useToast } from './Toast.jsx';
import styles from './PackagesSection.module.css';

export default function PackagesSection({ status, packages }) {
  const cart = useCart();
  const toast = useToast();
  const [viewing, setViewing] = useState(null);

  const confirm = (pkg, guests, el) => {
    const key = lineKey('package', pkg.id);
    const existing = cart.quantityOf(key);
    if (existing) cart.setQuantity(key, guests);
    else cart.add(packageToLine(pkg, guests));
    if (el) flyToCart(el, cart.cartIconRef.current);
    toast.show({
      message: existing ? `${pkg.name} updated for ${guests} guests` : `${pkg.name} added for ${guests} guests`,
      action: { label: 'View', onClick: () => cart.open(0) },
    });
  };

  return (
    <section id="packages" className={`section ${styles.section}`} aria-labelledby="packages-title">
      <div className="container">
        <Reveal className="section-head">
          <p className="eyebrow">Catering packages</p>
          <h2 id="packages-title" className="heading-2">
            Complete menus, planned for you
          </h2>
          <p className="body-3">
            Choose a package as a starting point. We tailor every package to your guests, venue and budget.
          </p>
        </Reveal>

        {status === 'loading' && (
          <div className={styles.grid} aria-hidden="true">
            {[0, 1, 2].map((i) => (
              <div key={i} className={styles.skeleton}>
                <span className="skeleton" style={{ aspectRatio: '4 / 3', borderRadius: 0 }} />
                <span style={{ display: 'grid', gap: 12, padding: 24 }}>
                  <span className="skeleton" style={{ width: '60%', height: 28 }} />
                  <span className="skeleton" style={{ width: '100%', height: 14 }} />
                  <span className="skeleton" style={{ width: '80%', height: 14 }} />
                </span>
              </div>
            ))}
          </div>
        )}

        {status === 'ready' && packages.length > 0 && (
          <div className={styles.grid}>
            {packages.map((pkg, i) => (
              <Reveal key={pkg.id} delay={i * 100} className={styles.cell}>
                <PackageCard
                  pkg={pkg}
                  index={i}
                  inCart={cart.quantityOf(lineKey('package', pkg.id)) > 0}
                  onView={setViewing}
                  onAdd={(p, el) =>
                    confirm(p, cart.quantityOf(lineKey('package', p.id)) || p.minGuests, el)
                  }
                />
              </Reveal>
            ))}
          </div>
        )}

        {status === 'ready' && packages.length === 0 && (
          <div className={styles.empty}>
            <PackageOpen size={28} strokeWidth={1.5} aria-hidden="true" />
            <p>Our packages are being updated. Send an enquiry and we will suggest one that suits your event.</p>
            <button type="button" className="btn btn-outline btn-sm" onClick={() => cart.open(cart.count ? 0 : 1)}>
              Send enquiry
            </button>
          </div>
        )}
      </div>

      <PackageDetails
        pkg={viewing}
        open={Boolean(viewing)}
        currentGuests={viewing ? cart.quantityOf(lineKey('package', viewing.id)) : 0}
        onClose={() => setViewing(null)}
        onConfirm={(pkg, guests) => {
          confirm(pkg, guests);
          setViewing(null);
        }}
      />
    </section>
  );
}
