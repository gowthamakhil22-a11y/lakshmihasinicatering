/** Chef hat with a gold cloche, drawn after the visiting card logo. */
export function BrandMark({ size = 40, className = '', animated = false }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden="true"
      data-animated={animated || undefined}
    >
      {/* Chef hat outline */}
      <path
        className="bm-hat"
        d="M16 34c-6.5-1-9-9.5-3.6-13.6 1.8-1.4 4-1.9 6-1.6C19.5 11 26 6.6 32.3 9c2.7-4.6 9.7-5.4 13.4-1.3 2.2 2.4 2.7 5.7 1.6 8.5 5.5-.6 9.6 4.6 7.6 9.7-1.1 2.8-3.7 4.6-6.6 4.9"
        stroke="#0F4A2E"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path className="bm-hat" d="M14 37c4-3.5 10-5 13-5" stroke="#0F4A2E" strokeWidth="2.6" strokeLinecap="round" />
      {/* Steam */}
      <path
        className="bm-steam"
        d="M31 24c-1.6-1.6 1.6-3.2 0-4.8M35 24c-1.6-1.6 1.6-3.2 0-4.8"
        stroke="#C29A45"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      {/* Cloche */}
      <circle cx="33" cy="30" r="2" fill="#C29A45" />
      <path d="M18 46c0-8.3 6.7-15 15-15s15 6.7 15 15H18Z" fill="#C29A45" />
      <path d="M22.5 42.5c1-4.6 4.5-7.8 8.5-8.6" stroke="#F5E8C8" strokeWidth="1.6" strokeLinecap="round" opacity=".8" />
      <rect x="14" y="46.5" width="38" height="3.6" rx="1.8" fill="#A8802F" />
      {/* Leaf */}
      <path d="M52 38c0-5 3.4-8.5 8-9-.2 4.8-3.4 8.6-8 9Z" fill="#1F6B45" />
      <path d="M52 38c1.6-2.6 3.6-4.6 6-6" stroke="#0F4A2E" strokeWidth=".9" strokeLinecap="round" />
    </svg>
  );
}

/** Gold flourish used under headings, as on the card. */
export function Flourish({ className = '', width = 120 }) {
  return (
    <svg className={className} width={width} height="14" viewBox="0 0 120 14" fill="none" aria-hidden="true">
      <path d="M2 7h42" stroke="#C29A45" strokeWidth="1" strokeLinecap="round" />
      <path d="M76 7h42" stroke="#C29A45" strokeWidth="1" strokeLinecap="round" />
      <path d="M60 1.5 64.5 7 60 12.5 55.5 7 60 1.5Z" fill="#C29A45" />
      <path d="M48 7c3-3.4 6-3.4 7.5 0M72 7c-3-3.4-6-3.4-7.5 0" stroke="#C29A45" strokeWidth="1" strokeLinecap="round" />
      <circle cx="46" cy="7" r="1.4" fill="#C29A45" />
      <circle cx="74" cy="7" r="1.4" fill="#C29A45" />
    </svg>
  );
}

/** Faint lotus mandala watermark from the card background. */
export function Lotus({ className = '' }) {
  const petals = Array.from({ length: 12 }, (_, i) => i * 30);
  return (
    <svg className={className} viewBox="0 0 200 200" fill="none" aria-hidden="true">
      <g stroke="currentColor" strokeWidth="1">
        {petals.map((deg) => (
          <path key={deg} transform={`rotate(${deg} 100 100)`} d="M100 100c-12-20-12-48 0-72 12 24 12 52 0 72Z" />
        ))}
        {petals.map((deg) => (
          <path
            key={`o${deg}`}
            transform={`rotate(${deg + 15} 100 100)`}
            d="M100 100c-18-26-18-60 0-92 18 32 18 66 0 92Z"
            opacity=".6"
          />
        ))}
        <circle cx="100" cy="100" r="14" />
        <circle cx="100" cy="100" r="6" />
      </g>
    </svg>
  );
}
