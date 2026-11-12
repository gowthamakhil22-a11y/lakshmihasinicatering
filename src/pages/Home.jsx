import { useEffect } from 'react';
import Header from '../components/Header.jsx';
import Hero from '../components/Hero.jsx';
import TrustSection from '../components/TrustSection.jsx';
import FoodGrid from '../components/FoodGrid.jsx';
import PackagesSection from '../components/PackagesSection.jsx';
import HowItWorks from '../components/HowItWorks.jsx';
import TaglineReveal from '../components/TaglineReveal.jsx';
import Footer from '../components/Footer.jsx';
import EnquiryCart from '../components/EnquiryCart.jsx';
import MobileCartBar from '../components/MobileCartBar.jsx';
import { itemToLine, packageToLine, useCart } from '../hooks/useCart.js';
import { useMenu } from '../hooks/useMenu.js';
import { useBusiness } from '../hooks/useBusiness.js';
import { buildWhatsAppUrl } from '../services/whatsappService.js';

export default function Home() {
  const { status, menu, error, retry } = useMenu();
  const business = useBusiness(menu?.settings);
  const cart = useCart();

  // Keep names and prices in the saved enquiry in step with the latest menu.
  const { sync } = cart;
  useEffect(() => {
    if (!menu) return;
    const lookup = new Map();
    menu.items.forEach((i) => {
      const l = itemToLine(i);
      lookup.set(l.key, { name: l.name, price: l.price, unit: l.unit, image: l.image });
    });
    menu.packages.forEach((p) => {
      const l = packageToLine(p);
      lookup.set(l.key, { name: l.name, price: l.price, unit: l.unit, image: l.image, minQuantity: l.minQuantity });
    });
    sync(lookup);
  }, [menu, sync]);

  useEffect(() => {
    document.title = `${business.name} | Digital Menu and Enquiries`;
  }, [business.name]);

  const helloUrl = buildWhatsAppUrl(business.whatsappNumber, `Hello ${business.name}, I would like to know about your catering menu.`);

  return (
    <>
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <Header businessName={business.name} />
      <main id="main">
        <Hero description={business.description} />
        <TrustSection />
        <FoodGrid status={status} menu={menu} error={error} onRetry={retry} whatsappUrl={helloUrl} />
        <PackagesSection status={status} packages={menu?.packages || []} />
        <HowItWorks />
        <TaglineReveal />
      </main>
      <Footer business={business} onEnquire={() => cart.open(cart.count ? 0 : 1)} />
      <MobileCartBar />
      <EnquiryCart business={business} />
    </>
  );
}
