import { formatCurrency, formatUnit } from '../utils/formatCurrency.js';

/** Keep digits only. "+91 98480-12345" → "919848012345". */
export function sanitizeWhatsAppNumber(number) {
  return String(number ?? '').replace(/\D/g, '');
}

export function isValidWhatsAppNumber(number) {
  const digits = sanitizeWhatsAppNumber(number);
  // Country code + subscriber number. Placeholder numbers of all zeros are rejected.
  return digits.length >= 10 && digits.length <= 15 && !/^\d{2}0+$/.test(digits);
}

function formatDate(iso) {
  if (!iso) return 'Not decided yet';
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function lineFor(line, index) {
  const priced = line.price !== null && line.price !== undefined;
  const qtyLabel = line.kind === 'package' ? `${line.quantity} guests` : `Qty ${line.quantity}`;
  const priceLabel = priced
    ? `${formatCurrency(line.price)} ${formatUnit(line.unit)} = ${formatCurrency(line.price * line.quantity)}`
    : 'Price on request';
  const tag = line.kind === 'package' ? ' (Package)' : '';
  return `${index + 1}. ${line.name}${tag} – ${qtyLabel} – ${priceLabel}`;
}

/**
 * Build the structured enquiry message.
 * WhatsApp renders *text* as bold, so section titles use it.
 */
export function buildEnquiryMessage({ businessName, details, lines, total, hasUnpriced }) {
  const out = [];
  out.push(`*${businessName} Enquiry*`);
  out.push('');
  out.push('*Customer Details*');
  out.push(`Name: ${details.name.trim()}`);
  out.push(`Event Type: ${details.eventType}`);
  out.push(`Event Date: ${formatDate(details.date)}`);
  out.push(`Event Location: ${details.location.trim()}`);
  out.push(`Expected Guests: ${Number(details.guests).toLocaleString('en-IN')}`);
  if (details.foodPreference) out.push(`Food Preference: ${details.foodPreference}`);
  out.push('');
  out.push('*Selected Menu*');
  if (lines.length) {
    lines.forEach((line, i) => out.push(lineFor(line, i)));
  } else {
    out.push('No dishes selected yet. Please suggest a menu for this event.');
  }
  out.push('');
  if (lines.length) {
    out.push(`*Estimated Total:* ${formatCurrency(total)}${hasUnpriced ? ' (plus items priced on request)' : ''}`);
    out.push('_Indicative only. Final quotation to be confirmed._');
    out.push('');
  }
  out.push('*Additional Requirements*');
  out.push(details.requirements.trim() || 'None');
  out.push('');
  out.push('Please share your catering quotation.');
  return out.join('\n');
}

export function buildWhatsAppUrl(number, message) {
  return `https://wa.me/${sanitizeWhatsAppNumber(number)}?text=${encodeURIComponent(message)}`;
}

const MSG = {
  en: {
    title: (b) => `*${b} – Menu Enquiry*`,
    name: 'Name',
    occasion: 'Occasion',
    date: 'Event Date',
    people: 'No. of People',
    venue: 'Venue',
    items: (n) => `*Items Selected (${n})*`,
    none: 'Not decided yet – please suggest a menu.',
    notes: '*Notes*',
    close: 'Please call me to discuss the menu and pricing. Thank you!',
    noDate: 'Not decided yet',
    locale: 'en-IN',
  },
  te: {
    title: (b) => `*${b} – మెనూ ఎంక్వైరీ*`,
    name: 'పేరు',
    occasion: 'సందర్భం',
    date: 'కార్యక్రమం తేదీ',
    people: 'అతిథుల సంఖ్య',
    venue: 'వేదిక',
    items: (n) => `*ఎంచుకున్న వంటకాలు (${n})*`,
    none: 'ఇంకా నిర్ణయించలేదు – దయచేసి మెనూ సూచించండి.',
    notes: '*ఇతర వివరాలు*',
    close: 'మెనూ మరియు ధర గురించి మాట్లాడటానికి దయచేసి నాకు ఫోన్ చేయండి. ధన్యవాదాలు!',
    noDate: 'ఇంకా నిర్ణయించలేదు',
    locale: 'te-IN',
  },
};

/**
 * Message for the QR menu card: ticked dishes grouped by category,
 * guests and date. No prices – the team calls back to quote.
 *
 * lang 'te' writes the message in Telugu; each dish keeps its English name
 * in brackets so the kitchen can match it to the menu without doubt.
 *
 * groups: [{ title, titleTe?, items: [{ name, nameTe? }] }]
 */
export function buildMenuCardMessage({ businessName, details, groups, lang = 'en', occasionLabel }) {
  const L = MSG[lang] || MSG.en;
  const te = lang === 'te';
  const count = groups.reduce((n, g) => n + g.items.length, 0);
  const dateText = (() => {
    if (!details.date) return L.noDate;
    const [y, m, d] = details.date.split('-').map(Number);
    const dt = new Date(y, m - 1, d);
    if (Number.isNaN(dt.getTime())) return details.date;
    const opts = { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' };
    return te ? `${dt.toLocaleDateString('te-IN', opts)} (${details.date.split('-').reverse().join('-')})` : dt.toLocaleDateString('en-IN', opts);
  })();
  const dish = (i) => {
    const item = typeof i === 'string' ? { name: i } : i;
    return te && item.nameTe ? `${item.nameTe} (${item.name})` : item.name;
  };

  const out = [];
  out.push(L.title(businessName));
  out.push('');
  if (details.name?.trim()) out.push(`${L.name}: ${details.name.trim()}`);
  if (details.eventType) out.push(`${L.occasion}: ${occasionLabel || details.eventType}`);
  out.push(`${L.date}: ${dateText}`);
  out.push(`${L.people}: ${Number(details.guests).toLocaleString('en-IN')}`);
  if (details.location?.trim()) out.push(`${L.venue}: ${details.location.trim()}`);
  out.push('');
  out.push(L.items(count));
  if (!count) out.push(L.none);
  groups.forEach((g) => {
    out.push('');
    out.push(`_${te && g.titleTe ? g.titleTe : g.title}_`);
    g.items.forEach((i) => out.push(`• ${dish(i)}`));
  });
  if (details.notes?.trim()) {
    out.push('');
    out.push(L.notes);
    out.push(details.notes.trim());
  }
  out.push('');
  out.push(L.close);
  return out.join('\n');
}
