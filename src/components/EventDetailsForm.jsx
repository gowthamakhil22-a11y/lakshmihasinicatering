import { forwardRef } from 'react';
import { AlertCircle } from 'lucide-react';
import { appConfig } from '../config/appConfig.js';
import { minEventDate } from '../utils/validation.js';
import styles from './EventDetailsForm.module.css';

function Field({ id, label, required, error, hint, children, shakeKey }) {
  return (
    <div className={`${styles.field} ${error ? styles.invalid : ''}`} key={error ? `${id}-${shakeKey}` : id}>
      <label htmlFor={id} className={styles.label}>
        {label}
        {required ? (
          <span className={styles.req} aria-hidden="true">
            *
          </span>
        ) : (
          <span className={styles.optional}>Optional</span>
        )}
      </label>
      {children}
      {hint && !error && (
        <p id={`${id}-hint`} className={styles.hint}>
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className={styles.error} role="alert">
          <AlertCircle size={14} aria-hidden="true" />
          {error}
        </p>
      )}
    </div>
  );
}

function ChipGroup({ name, label, options, value, onChange, error, required, shakeKey }) {
  return (
    <fieldset
      className={`${styles.field} ${styles.fieldset} ${error ? styles.invalid : ''}`}
      key={error ? `${name}-${shakeKey}` : name}
      aria-describedby={error ? `${name}-error` : undefined}
    >
      <legend className={styles.label}>
        {label}
        {required ? (
          <span className={styles.req} aria-hidden="true">
            *
          </span>
        ) : (
          <span className={styles.optional}>Optional</span>
        )}
      </legend>
      <div className={styles.chips} id={name}>
        {options.map((opt) => (
          <label key={opt} className={`${styles.chip} ${value === opt ? styles.chipOn : ''}`}>
            <input
              type="radio"
              name={name}
              value={opt}
              checked={value === opt}
              onChange={() => onChange(opt)}
              onClick={() => !required && value === opt && onChange('')}
            />
            {opt}
          </label>
        ))}
      </div>
      {error && (
        <p id={`${name}-error`} className={styles.error} role="alert">
          <AlertCircle size={14} aria-hidden="true" />
          {error}
        </p>
      )}
    </fieldset>
  );
}

const EventDetailsForm = forwardRef(function EventDetailsForm({ values, errors, onChange, onSubmit, shakeKey }, ref) {
  const set = (field) => (e) => onChange(field, e.target.value);
  const describe = (field, hasHint) =>
    errors[field] ? `${field}-error` : hasHint ? `${field}-hint` : undefined;

  return (
    <form
      ref={ref}
      className={styles.form}
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
    >
      <Field id="name" label="Your name" required error={errors.name} shakeKey={shakeKey}>
        <input
          id="name"
          className={styles.input}
          value={values.name}
          onChange={set('name')}
          autoComplete="name"
          placeholder="e.g. Sravani Reddy"
          aria-invalid={Boolean(errors.name)}
          aria-describedby={describe('name')}
          maxLength={80}
          data-autofocus
        />
      </Field>

      <ChipGroup
        name="eventType"
        label="Event type"
        required
        options={appConfig.eventTypes}
        value={values.eventType}
        onChange={(v) => onChange('eventType', v)}
        error={errors.eventType}
        shakeKey={shakeKey}
      />

      <div className={styles.row}>
        <Field id="guests" label="Expected guests" required error={errors.guests} shakeKey={shakeKey}>
          <input
            id="guests"
            className={styles.input}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={values.guests}
            onChange={(e) => onChange('guests', e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="e.g. 150"
            aria-invalid={Boolean(errors.guests)}
            aria-describedby={describe('guests')}
          />
        </Field>
        <Field id="date" label="Event date" error={errors.date} shakeKey={shakeKey}>
          <input
            id="date"
            className={styles.input}
            type="date"
            min={minEventDate()}
            value={values.date}
            onChange={set('date')}
            aria-invalid={Boolean(errors.date)}
            aria-describedby={describe('date')}
          />
        </Field>
      </div>

      <Field
        id="location"
        label="Event location"
        required
        error={errors.location}
        hint="Venue name, area or town"
        shakeKey={shakeKey}
      >
        <input
          id="location"
          className={styles.input}
          value={values.location}
          onChange={set('location')}
          autoComplete="address-level2"
          placeholder="e.g. Function hall, Danavaipeta"
          aria-invalid={Boolean(errors.location)}
          aria-describedby={describe('location', true)}
          maxLength={160}
        />
      </Field>

      <ChipGroup
        name="foodPreference"
        label="Preferred food type"
        options={appConfig.foodPreferences}
        value={values.foodPreference}
        onChange={(v) => onChange('foodPreference', v)}
      />

      <Field
        id="requirements"
        label="Additional requirements"
        error={errors.requirements}
        hint="Serving style, timings, dietary needs or anything else"
        shakeKey={shakeKey}
      >
        <textarea
          id="requirements"
          className={`${styles.input} ${styles.textarea}`}
          value={values.requirements}
          onChange={set('requirements')}
          rows={3}
          maxLength={1000}
          placeholder="e.g. Buffet service for lunch, less spicy food for elders"
          aria-invalid={Boolean(errors.requirements)}
          aria-describedby={describe('requirements', true)}
        />
      </Field>
      <button type="submit" hidden aria-hidden="true" tabIndex={-1} />
    </form>
  );
});

export default EventDetailsForm;
