/**
 * Business card artwork: print PDF pages (front + back) and a mockup preview.
 * Size: 89 × 51 mm trim, 3 mm bleed each side (page 95 × 57 mm), 4 mm safe zone.
 * All illustrations are inline vector SVG so they stay sharp at any print size.
 */

const esc = (s) =>
  String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

/* ---------- illustrations (24-unit line icons) ---------- */
const ICON = {
  lotus:
    'M12 18c-2.5-2-3.5-5-2.5-9 1.6 1.2 2.5 3 2.5 5 0-2 .9-3.8 2.5-5 1 4 0 7-2.5 9Z M12 18c-3 0-6-1.5-7.5-4.5 2.5-.3 4.5.5 5.5 2 M12 18c3 0 6-1.5 7.5-4.5-2.5-.3-4.5.5-5.5 2 M6 20h12',
  leaf: 'M5 19C5 10 11 5 19 5c0 8-5 14-14 14Z M5 19 14 10 M9 15h3 M11 13V10',
  pot: 'M5.5 10.5h13 M7 10.5c-1.4 1.4-2 3-2 4.5 0 3 3.1 5.5 7 5.5s7-2.5 7-5.5c0-1.5-.6-3.1-2-4.5 M8.5 10.5c0-2 1.6-3.6 3.5-3.6s3.5 1.6 3.5 3.6 M12 6.9V5.2 M10.6 5.2h2.8',
  ladle: 'M17 3.5 9.6 13.2 M9.6 13.2c-2.2 0-3.9 1.6-3.9 3.6S7.4 20.5 9.6 20.5s3.9-1.6 3.9-3.6c0-1.3-.8-2.5-2.1-3.1',
  chilli: 'M6.5 18.5c5.5 0 10-3.5 11-9.5 M17.5 9c.4-1.6 1.4-2.8 3-3.3 M6.5 18.5c-1.3 0-2-.9-1.6-1.8 M16.6 11.5c-1.5 3.5-5 6-9.5 6.4',
};

/** Chef hat + cloche + leaf, from the logo. */
const BRAND_MARK = `
<svg viewBox="0 0 64 64" width="100%" height="100%" fill="none" aria-hidden="true">
  <path d="M16 34c-6.5-1-9-9.5-3.6-13.6 1.8-1.4 4-1.9 6-1.6C19.5 11 26 6.6 32.3 9c2.7-4.6 9.7-5.4 13.4-1.3 2.2 2.4 2.7 5.7 1.6 8.5 5.5-.6 9.6 4.6 7.6 9.7-1.1 2.8-3.7 4.6-6.6 4.9" stroke="#0F4A2E" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M14 37c4-3.5 10-5 13-5" stroke="#0F4A2E" stroke-width="2.6" stroke-linecap="round"/>
  <path d="M31 24c-1.6-1.6 1.6-3.2 0-4.8M35 24c-1.6-1.6 1.6-3.2 0-4.8" stroke="#C29A45" stroke-width="1.6" stroke-linecap="round"/>
  <circle cx="33" cy="30" r="2" fill="#C29A45"/>
  <path d="M18 46c0-8.3 6.7-15 15-15s15 6.7 15 15H18Z" fill="#C29A45"/>
  <path d="M22.5 42.5c1-4.6 4.5-7.8 8.5-8.6" stroke="#F5E8C8" stroke-width="1.6" stroke-linecap="round" opacity=".8"/>
  <rect x="14" y="46.5" width="38" height="3.6" rx="1.8" fill="#A8802F"/>
  <path d="M52 38c0-5 3.4-8.5 8-9-.2 4.8-3.4 8.6-8 9Z" fill="#1F6B45"/>
  <path d="M52 38c1.6-2.6 3.6-4.6 6-6" stroke="#0F4A2E" stroke-width=".9" stroke-linecap="round"/>
</svg>`;

const HAT_OUTLINE =
  'M16 34c-6.5-1-9-9.5-3.6-13.6 1.8-1.4 4-1.9 6-1.6C19.5 11 26 6.6 32.3 9c2.7-4.6 9.7-5.4 13.4-1.3 2.2 2.4 2.7 5.7 1.6 8.5 5.5-.6 9.6 4.6 7.6 9.7-1.1 2.8-3.7 4.6-6.6 4.9 M14 37c4-3.5 10-5 13-5 M18 46c0-8.3 6.7-15 15-15s15 6.7 15 15H18Z M14 48.3h38';

const CORNER = `<svg viewBox="0 0 34 34" fill="none"><path d="M1 33V9a8 8 0 0 1 8-8h24" stroke="currentColor" stroke-width="1.2"/><path d="M6 33V12a6 6 0 0 1 6-6h21" stroke="currentColor" stroke-width=".8" opacity=".7"/><path d="M10 10c3 0 5 2 5 5-3 0-5-2-5-5Z" fill="currentColor"/></svg>`;

const SMALL = {
  phone:
    '<path d="M5 3.5h3l1.5 4-2 1.3a10 10 0 0 0 4.7 4.7l1.3-2 4 1.5v3c0 1-.8 1.8-1.8 1.8C9.4 17.8 2.2 10.6 3.2 5.3 3.2 4.3 4 3.5 5 3.5Z"/>',
  whatsapp:
    '<path d="M10.5 3a7.5 7.5 0 0 0-6.4 11.4L3 18l3.7-1a7.5 7.5 0 1 0 3.8-14Z"/><path d="M8 7.6c.3 2 1.9 3.9 4.1 4.6l.9-1.1 1.7.8-.4 1.3c-3.4.2-7-3.3-6.8-6.6l1.3-.4.8 1.7Z"/>',
  pin: '<path d="M10.5 18s5.5-5.2 5.5-9.5a5.5 5.5 0 0 0-11 0c0 4.3 5.5 9.5 5.5 9.5Z"/><circle cx="10.5" cy="8.5" r="2"/>',
  mail: '<rect x="3" y="5" width="15" height="11" rx="1.5"/><path d="m3.5 6 7 5.5 7-5.5"/>',
};
const smallIcon = (k) =>
  `<svg class="ico" viewBox="0 0 21 21" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${SMALL[k]}</svg>`;

function patternTile() {
  const g = (k, x, y, rot = 0) =>
    `<g transform="translate(${x} ${y}) rotate(${rot} 3.2 3.2) scale(.27)"><path d="${ICON[k]}"/></g>`;
  return `
    ${g('lotus', 1.2, 1.2)}
    ${g('pot', 11, 2.6, 8)}
    ${g('leaf', 2.8, 11.2, -10)}
    ${g('ladle', 11.6, 11.4, 6)}
    ${g('chilli', 6.6, 6.4, -18)}
    <circle cx="9.6" cy="17.6" r=".22" fill="#d2b06a" stroke="none"/>
    <circle cx="18" cy="8.6" r=".22" fill="#d2b06a" stroke="none"/>`;
}

function formatWa(digits) {
  const d = String(digits || '').replace(/\D/g, '');
  if (d.length === 12 && d.startsWith('91')) return `+91 ${d.slice(2, 7)} ${d.slice(7)}`;
  return d ? `+${d}` : '';
}

function shortAddress(location) {
  const parts = String(location || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  return parts.length >= 3 ? parts.slice(1, 3).join(', ') : parts.join(', ');
}

/* ---------- card faces ---------- */

export function frontSide(b) {
  const m = b.name.match(/^(.*?)\s+(catering|caterers)$/i);
  const main = m ? m[1] : b.name;
  const sub = m ? m[2] : '';
  return `
<section class="card front">
  <svg class="art" viewBox="0 0 95 57" preserveAspectRatio="none" aria-hidden="true">
    <defs>
      <pattern id="motif" width="19" height="19" patternUnits="userSpaceOnUse" patternTransform="rotate(-8)">
        <g fill="none" stroke="#d2b06a" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round">${patternTile()}</g>
      </pattern>
      <radialGradient id="calm" cx="50%" cy="50%" r="55%">
        <stop offset="0" stop-color="#0e3d27" stop-opacity=".96"/>
        <stop offset=".55" stop-color="#0e3d27" stop-opacity=".55"/>
        <stop offset="1" stop-color="#0e3d27" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect width="95" height="57" fill="url(#motif)" opacity=".13"/>
    <ellipse cx="47.5" cy="28.5" rx="34" ry="24" fill="url(#calm)"/>
  </svg>
  <div class="frame">
    <span class="c tl">${CORNER}</span><span class="c tr">${CORNER}</span>
    <span class="c bl">${CORNER}</span><span class="c br">${CORNER}</span>
  </div>
  <div class="front-content">
    <span class="medal">${BRAND_MARK}</span>
    <h1>${esc(main)}</h1>
    ${sub ? `<p class="sub">${esc(sub)}</p>` : ''}
    <span class="rule"></span>
    ${b.tagline ? `<p class="tag">${esc(b.tagline)}</p>` : ''}
    ${b.nameTe ? `<p class="te">${esc(b.nameTe)}</p>` : ''}
  </div>
</section>`;
}

export function backSide(b, qrSvg, photoDataUri) {
  const m = b.name.match(/^(.*?)\s+(catering|caterers)$/i);
  const main = m ? m[1] : b.name;
  const sub = m ? m[2] : '';
  const cx = 72;
  const cy = 28.5;
  const r = 14;
  const tr = 16.4;
  const a1 = (125 * Math.PI) / 180;
  const a2 = (235 * Math.PI) / 180;
  const p1 = [cx + tr * Math.cos(a1), cy + tr * Math.sin(a1)].map((n) => n.toFixed(2));
  const p2 = [cx + tr * Math.cos(a2), cy + tr * Math.sin(a2)].map((n) => n.toFixed(2));
  const wa = formatWa(b.whatsapp);
  const phoneDigits = String(b.phone || '').replace(/\D/g, '');
  const sameNumber = phoneDigits && phoneDigits === String(b.whatsapp || '').replace(/\D/g, '');
  return `
<section class="card back">
  <svg class="art" viewBox="0 0 95 57" preserveAspectRatio="none" aria-hidden="true">
    <defs>
      <pattern id="dots" width="1.9" height="1.9" patternUnits="userSpaceOnUse">
        <circle cx=".95" cy=".95" r=".33" fill="#d2b06a"/>
      </pattern>
      <clipPath id="plate"><circle cx="${cx}" cy="${cy}" r="${r}"/></clipPath>
      <path id="arc" d="M ${p1[0]} ${p1[1]} A ${tr} ${tr} 0 0 1 ${p2[0]} ${p2[1]}"/>
    </defs>
    <path d="${HAT_OUTLINE}" transform="translate(-6 13) scale(.86)" fill="none" stroke="#0F4A2E" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" opacity=".055"/>
    <path d="M 72 0 C 60 0 50 12 50 28.5 C 50 45 60 57 72 57 L 95 57 L 95 0 Z" fill="#0e3d27"/>
    <path d="M 74 -1 C 62 -1 52 12 52 28.5 C 52 45 62 58 74 58" fill="none" stroke="#d2b06a" stroke-width=".22" opacity=".75"/>
    <rect x="81.2" y="5.2" width="9.5" height="7.6" fill="url(#dots)" opacity=".55"/>
    <rect x="81.2" y="44.2" width="9.5" height="7.6" fill="url(#dots)" opacity=".55"/>
    <circle cx="${cx}" cy="${cy}" r="${r + 1.25}" fill="#f6efdd"/>
    <image href="${photoDataUri}" x="${cx - r}" y="${cy - r}" width="${2 * r}" height="${2 * r}" preserveAspectRatio="xMidYMid slice" clip-path="url(#plate)"/>
    <circle cx="${cx}" cy="${cy}" r="${r + 1.25}" fill="none" stroke="#d2b06a" stroke-width=".35"/>
    <circle cx="${cx}" cy="${cy}" r="${r + 2.1}" fill="none" stroke="#d2b06a" stroke-width=".15" opacity=".55"/>
    <text font-family="Cormorant SC, serif" font-weight="700" font-size="1.85" fill="#d2b06a">
      <textPath href="#arc" textLength="${(tr * (110 * Math.PI) / 180 - 1.2).toFixed(2)}" lengthAdjust="spacing" startOffset=".6">cooked fresh · served with care</textPath>
    </text>
  </svg>

  <div class="back-text">
    <h2>${esc(main)}</h2>
    ${sub ? `<p class="sub">${esc(sub)}</p>` : ''}
    <p class="services">${esc(b.services)}</p>
    <span class="rule"></span>
  </div>

  <div class="qr-block">
    <div class="qr">${qrSvg}</div>
    <p>scan for our menu</p>
  </div>

  <ul class="contacts">
    <li>${smallIcon('phone')}${sameNumber ? smallIcon('whatsapp') : ''}<span>${esc(b.phone)}</span></li>
    ${!sameNumber && wa ? `<li>${smallIcon('whatsapp')}<span>${esc(wa)}</span></li>` : ''}
    ${b.location ? `<li>${smallIcon('pin')}<span>${esc(shortAddress(b.location))}</span></li>` : ''}
    ${b.email ? `<li class="mail">${smallIcon('mail')}<span>${esc(b.email)}</span></li>` : ''}
  </ul>
</section>`;
}

const FONTS =
  'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,600;0,700;1,500&family=Cormorant+SC:wght@600;700&family=EB+Garamond:ital,wght@0,400;0,500;1,400&family=Noto+Serif+Telugu:wght@500&display=swap';

const CARD_CSS = `
  .card { position: relative; width: 95mm; height: 57mm; overflow: hidden; -webkit-print-color-adjust: exact; print-color-adjust: exact; font-family: 'EB Garamond', 'Noto Serif Telugu', Georgia, serif; }
  .card .art { position: absolute; inset: 0; width: 100%; height: 100%; }

  /* front */
  .front { background: #0e3d27; color: #efe6cf;
    background-image:
      radial-gradient(ellipse 90% 70% at 40% 30%, rgba(255,255,255,.07), transparent 70%),
      repeating-linear-gradient(0deg, rgba(255,255,255,.025) 0 .25mm, transparent .25mm .75mm),
      repeating-linear-gradient(90deg, rgba(0,0,0,.07) 0 .25mm, transparent .25mm .75mm); }
  .front .frame { position: absolute; inset: 6.4mm; border: .25mm solid rgba(210,176,106,.85); }
  .front .frame::after { content: ''; position: absolute; inset: .9mm; border: .15mm solid rgba(210,176,106,.45); }
  .front .c { position: absolute; width: 5.2mm; height: 5.2mm; color: #d2b06a; }
  .front .c svg { width: 100%; height: 100%; display: block; }
  .front .tl { top: 1.6mm; left: 1.6mm; }
  .front .tr { top: 1.6mm; right: 1.6mm; transform: rotate(90deg); }
  .front .br { bottom: 1.6mm; right: 1.6mm; transform: rotate(180deg); }
  .front .bl { bottom: 1.6mm; left: 1.6mm; transform: rotate(270deg); }
  .front-content { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; }
  .medal { width: 12.5mm; height: 12.5mm; border-radius: 50%; background: #f6efdd; display: grid; place-items: center; padding: 1.7mm;
    box-shadow: 0 0 0 .22mm #d2b06a, 0 0 0 .9mm #0e3d27, 0 0 0 1.05mm rgba(210,176,106,.6); margin-bottom: 2.6mm; }
  .front h1 { font: 600 17pt/1 'Cormorant Garamond', serif; color: #d2b06a; letter-spacing: .01em; text-shadow: 0 .15mm 0 rgba(0,0,0,.45); }
  .front .sub { margin-top: 1.2mm; font: 700 5.4pt 'Cormorant SC', serif; letter-spacing: .45em; padding-left: .45em; color: #d2b06a; text-transform: lowercase; }
  .front .rule { width: 7mm; height: .18mm; background: #d2b06a; opacity: .7; margin: 1.8mm 0 1.4mm; }
  .front .tag { font: italic 400 6.4pt 'EB Garamond', serif; color: #efe6cf; opacity: .9; }
  .front .te { margin-top: .9mm; font: 500 5.2pt 'Noto Serif Telugu', serif; color: #efe6cf; opacity: .7; }

  /* back */
  .back { background: #f8f2e2; color: #23302a;
    background-image: radial-gradient(ellipse 70% 80% at 25% 40%, rgba(255,255,255,.6), transparent 70%); }
  .back-text { position: absolute; left: 7.6mm; top: 7.4mm; width: 40mm; }
  .back h2 { font: 700 12.6pt/1 'Cormorant Garamond', serif; color: #0f4a2e; }
  .back .sub { margin-top: .8mm; font: 700 4.9pt 'Cormorant SC', serif; letter-spacing: .42em; color: #8f6d2c; text-transform: lowercase; }
  .back .services { margin-top: 2.2mm; font: italic 400 5.6pt 'EB Garamond', serif; color: #4f5a50; }
  .back .rule { display: block; width: 9mm; height: .18mm; background: #c29a45; margin-top: 2mm; }
  .qr-block { position: absolute; left: 7.6mm; top: 28.6mm; width: 16.4mm; text-align: center; }
  .qr { width: 16.4mm; height: 16.4mm; padding: .9mm; background: #fffdf6; box-shadow: 0 0 0 .2mm #c29a45; }
  .qr svg { width: 100%; height: 100%; display: block; }
  .qr-block p { margin-top: .9mm; font: 700 4.1pt 'Cormorant SC', serif; letter-spacing: .14em; color: #0f4a2e; text-transform: lowercase; white-space: nowrap; }
  .contacts { position: absolute; left: 26mm; top: 30.2mm; width: 23.4mm; list-style: none; padding: 0; margin: 0; }
  .contacts li { display: flex; align-items: center; gap: .9mm; margin-bottom: 1.55mm; font: 500 5.5pt/1.15 'EB Garamond', serif; color: #23302a; }
  .contacts li span { min-width: 0; }
  .contacts .mail { font-size: 4.2pt; letter-spacing: -.005em; }
  .contacts .ico { flex: none; width: 2.5mm; height: 2.5mm; color: #0f4a2e; }
`;

/** Two-page print file: page 1 front, page 2 back. */
export function printHtml(b, qrSvg, photo) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${esc(b.name)} – business card</title>
<link href="${FONTS}" rel="stylesheet">
<style>
  @page { size: 95mm 57mm; margin: 0; }
  * { box-sizing: border-box; margin: 0; }
  html, body { background: #fff; }
  .card { page-break-after: always; break-after: page; }
  ${CARD_CSS}
</style></head><body>
${frontSide(b)}
${backSide(b, qrSvg, photo)}
</body></html>`;
}

/** Photo-style preview: both cards on marble with soft shadows. */
export function mockupHtml(b, qrSvg, photo) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Business card preview</title>
<link href="${FONTS}" rel="stylesheet">
<style>
  * { box-sizing: border-box; margin: 0; }
  body { width: 1600px; height: 1100px; overflow: hidden; position: relative; background: #ece8e1; }
  .marble { position: absolute; inset: 0; }
  .leaf { position: absolute; left: -60px; top: -40px; width: 520px; opacity: .22; filter: blur(14px); }
  .leaf2 { position: absolute; right: -80px; bottom: -60px; width: 440px; opacity: .16; filter: blur(16px); transform: rotate(160deg); }
  .plate { position: absolute; right: 120px; bottom: 70px; width: 520px; height: 520px; border-radius: 50%;
    background: radial-gradient(circle at 40% 35%, #e6c27a 0%, #b88a3b 35%, #8a6421 70%, #6b4a17 100%);
    box-shadow: inset 0 0 0 14px #a87d33, inset 0 0 0 18px #c99d4f, 0 30px 60px -20px rgba(60,40,10,.5); }
  .plate::after { content: ''; position: absolute; inset: 60px; border-radius: 50%; background: radial-gradient(circle at 45% 40%, #d8b064, #9c742d 80%); opacity: .7; }
  .holder { position: absolute; width: calc(89mm * 3.1); height: calc(51mm * 3.1); }
  .holder .clip { width: 89mm; height: 51mm; overflow: hidden; transform: scale(3.1); transform-origin: 0 0; border-radius: .6mm;
    box-shadow: 0 .4mm .5mm rgba(0,0,0,.18), 0 4mm 8mm -2mm rgba(40,30,15,.35); }
  .holder .clip .card { margin: -3mm 0 0 -3mm; }
  .holder.b { left: 170px; top: 120px; transform: rotate(-6deg); }
  .holder.f { left: 700px; top: 520px; transform: rotate(4deg); }
  .sheen { position: absolute; inset: 0; background: linear-gradient(115deg, rgba(255,255,255,.18), transparent 35%, transparent 70%, rgba(255,255,255,.08)); pointer-events: none; }
  ${CARD_CSS}
</style></head><body>
<svg class="marble" viewBox="0 0 1600 1100" preserveAspectRatio="none">
  <filter id="m"><feTurbulence type="fractalNoise" baseFrequency=".0035 .009" numOctaves="5" seed="7"/>
    <feColorMatrix values="0 0 0 0 .55  0 0 0 0 .53  0 0 0 0 .5  0 0 0 -2.2 1.35"/></filter>
  <rect width="1600" height="1100" fill="#f1eee8"/><rect width="1600" height="1100" filter="url(#m)" opacity=".55"/>
</svg>
<svg class="leaf" viewBox="0 0 200 200"><g fill="#1f3a20"><path d="M20 180C40 100 110 40 190 20 160 100 100 160 20 180Z"/><path d="M10 120C30 70 70 40 120 30 100 80 60 110 10 120Z"/></g></svg>
<svg class="leaf2" viewBox="0 0 200 200"><g fill="#1f3a20"><path d="M20 180C40 100 110 40 190 20 160 100 100 160 20 180Z"/></g></svg>
<div class="plate"></div>
<div class="holder b"><div class="clip">${backSide(b, qrSvg, photo)}</div><div class="sheen"></div></div>
<div class="holder f"><div class="clip">${frontSide(b)}</div><div class="sheen"></div></div>
</body></html>`;
}
