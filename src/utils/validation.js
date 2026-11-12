import { appConfig } from '../config/appConfig.js';

export const MAX_GUESTS = 100000;

export const emptyEventDetails = {
  name: '',
  eventType: '',
  guests: '',
  location: '',
  date: '',
  foodPreference: '',
  requirements: '',
};

function todayIso() {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
}

export const minEventDate = todayIso;

/**
 * Validate the event details form.
 * Returns an object keyed by field name; empty when the form is valid.
 */
export function validateEventDetails(values) {
  const errors = {};
  const name = values.name.trim();
  if (!name) {
    errors.name = 'Please enter your name.';
  } else if (name.length < 2) {
    errors.name = 'Name should be at least 2 characters.';
  } else if (!/^[\p{L}\s.'’]+$/u.test(name)) {
    errors.name = 'Use letters only for your name.';
  }

  if (!values.eventType) {
    errors.eventType = 'Choose the type of event.';
  } else if (!appConfig.eventTypes.includes(values.eventType)) {
    errors.eventType = 'Choose an event type from the list.';
  }

  const guestsRaw = String(values.guests).trim();
  const guests = Number(guestsRaw);
  if (!guestsRaw) {
    errors.guests = 'Enter how many guests you expect.';
  } else if (!Number.isInteger(guests) || guests < 1) {
    errors.guests = 'Guest count should be a whole number, 1 or more.';
  } else if (guests > MAX_GUESTS) {
    errors.guests = `For more than ${MAX_GUESTS.toLocaleString('en-IN')} guests, mention it in additional requirements.`;
  }

  const location = values.location.trim();
  if (!location) {
    errors.location = 'Enter the event location or area.';
  } else if (location.length < 3) {
    errors.location = 'Location should be at least 3 characters.';
  }

  if (values.date) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(values.date)) {
      errors.date = 'Enter a valid date.';
    } else if (values.date < todayIso()) {
      errors.date = 'The event date cannot be in the past.';
    }
  }

  if (values.requirements.length > 1000) {
    errors.requirements = 'Keep additional requirements under 1000 characters.';
  }

  return errors;
}
