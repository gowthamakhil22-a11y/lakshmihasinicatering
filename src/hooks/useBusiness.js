import { useMemo } from 'react';
import { appConfig } from '../config/appConfig.js';
import { isValidWhatsAppNumber } from '../services/whatsappService.js';

/** Business details: "Business Settings" sheet values override the defaults in appConfig. */
export function useBusiness(settings) {
  return useMemo(() => {
    const s = settings || {};
    const d = appConfig.business;
    const pick = (key, fallback) => (s[key] && String(s[key]).trim()) || fallback;
    const sheetWa = pick('whatsapp_number', '');
    return {
      name: pick('business_name', d.name),
      tagline: pick('tagline', d.tagline),
      description: pick('business_description', d.description),
      whatsappNumber: isValidWhatsAppNumber(sheetWa) ? sheetWa : d.whatsappNumber,
      phoneNumber: pick('phone_number', d.phoneNumber),
      email: pick('email', d.email),
      location: pick('location', d.location),
      mapsUrl: pick('maps_url', d.mapsUrl),
      trustLine: pick('trust_line', d.trustLine),
      testimonial: pick('testimonial', d.testimonial),
      testimonialBy: pick('testimonial_by', d.testimonialBy),
    };
  }, [settings]);
}
