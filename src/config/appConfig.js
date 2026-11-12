/**
 * Central configuration for the Lakshmi Hasini Catering website.
 *
 * Edit the values in `business` before going live. Values set on the
 * "Business Settings" Google Sheet override these at runtime, so the
 * business owner can update contact details without a new deployment.
 */
export const appConfig = {
  business: {
    name: 'Lakshmi Hasini Catering',
    // Telugu name, used on the business card front.
    nameTe: 'లక్ష్మీ హాసిని కేటరింగ్',
    // One line of services on the business card back.
    cardServices: 'Weddings · Functions · Corporate Events',
    tagline: 'Delicious Food for Every Occasion',
    description:
      'Thoughtfully prepared catering for weddings, family celebrations, corporate events and special gatherings.',
    // WhatsApp number: country code + digits only, no "+", spaces or dashes.
    // Example for an Indian number 98765 43210 → '919876543210'
    // NOTE: taken from the visiting card. Confirm it is the real WhatsApp number before printing the QR.
    whatsappNumber: '919876543210',
    // Phone number as it should be displayed and dialled.
    phoneNumber: '+91 98765 43210',
    email: 'lakshmihasinicatering@gmail.com',
    location: 'Main Road, Danavaipeta, Rajahmundry, Andhra Pradesh 533101',
    // Optional Google Maps link for the address. Leave empty to search the address instead.
    mapsUrl: '',
    // Optional. Only real facts, e.g. 'Serving Rajahmundry since 2012 · 400+ weddings'.
    // Shown on the book cover when filled. The sheet setting 'trust_line' overrides it.
    trustLine: '',
    // Optional. A real customer's words and their name, shown on the last page.
    testimonial: '',
    testimonialBy: '',
  },

  // Google Apps Script web app URL ending in /exec.
  // Set it in a .env.local file (VITE_MENU_API_URL=...) or as a GitHub
  // repository variable for production builds. When empty, the bundled
  // demo menu in public/data/demo-menu.json is used.
  menuApiUrl: import.meta.env.VITE_MENU_API_URL || '',

  // How long a cached menu is shown before it is refreshed in the background.
  menuCacheMaxAgeMs: 1000 * 60 * 30,
  apiTimeoutMs: 12000,

  currency: 'INR',
  locale: 'en-IN',

  storageKeys: {
    cart: 'lhc.cart.v1',
    eventDetails: 'lhc.event.v1',
    menuCache: 'lhc.menu.v2',
  },

  eventTypes: [
    'Wedding',
    'Birthday',
    'Engagement',
    'Housewarming',
    'Corporate Event',
    'Family Function',
    'Other',
  ],

  foodPreferences: ['Vegetarian', 'Non vegetarian', 'Both veg and non veg', 'Jain'],
};

/** Resolve a path inside /public against the deployed base path. */
export function assetUrl(path) {
  if (!path) return '';
  if (/^(https?:)?\/\//i.test(path) || path.startsWith('data:')) return path;
  return `${import.meta.env.BASE_URL}${path.replace(/^\.?\//, '')}`;
}
