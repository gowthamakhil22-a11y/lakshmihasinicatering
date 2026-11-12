/**
 * Menu book front cover, A4 portrait, following the 60-30-10 colour rule:
 *   60% deep green  – background
 *   30% cream       – arch panel + headline text
 *   10% gold        – thin borders, logo cloche, dividers only
 *
 *   node scripts/menu-cover.mjs
 *
 * Writes to qr/:
 *   menu-cover.html        source artwork (all vector except the food photo)
 *   menu-cover.pdf         print file: 210 × 297 mm trim + 3 mm bleed (216 × 303 mm page)
 *   menu-cover-600dpi.png  5100 × 7157 px raster (600 DPI incl. bleed)
 *   menu-cover-preview.png small preview
 */
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const C = {
  green: '#0F4A2E',
  greenDeep: '#0A3621',
  greenLine: '#1C6141',
  cream: '#F6EDD6',
  gold: '#C9A24A',
  goldDark: '#A8802F',
};

const src = await readFile('src/config/appConfig.js', 'utf8');
const get = (k, d) => src.match(new RegExp(`${k}:\\s*'([^']*)'`))?.[1] || d;
const NAME = get('name', 'Lakshmi Hasini Catering').replace(/\s+catering$/i, '');
const NAME_TE = get('nameTe', '');
const TAGLINE = get('tagline', 'Delicious Food for Every Occasion');
const SERVICES = ['Weddings', 'Birthdays', 'Family Functions', 'Corporate Events', 'Special Occasions'];

const photo = `data:image/png;base64,${(await readFile('design-source/festive-spread.png')).toString('base64')}`;

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

// Page geometry in mm (bleed included). Trim box starts at 3 mm.
const W = 216;
const H = 303;
const CX = W / 2;

/* Tone-on-tone motif for the green background (stays inside the 60%). */
const MOTIF = {
  lotus: 'M12 18c-2.5-2-3.5-5-2.5-9 1.6 1.2 2.5 3 2.5 5 0-2 .9-3.8 2.5-5 1 4 0 7-2.5 9Z M12 18c-3 0-6-1.5-7.5-4.5 2.5-.3 4.5.5 5.5 2 M12 18c3 0 6-1.5 7.5-4.5-2.5-.3-4.5.5-5.5 2 M6 20h12',
  leaf: 'M5 19C5 10 11 5 19 5c0 8-5 14-14 14Z M5 19 14 10 M9 15h3 M11 13V10',
};

/* Corner ornament (gold, thin). Drawn for the top-left corner, mirrored for others. */
const corner = (x, y, sx, sy) => `
  <g transform="translate(${x} ${y}) scale(${sx} ${sy})" fill="none" stroke="${C.gold}" stroke-linecap="round">
    <path d="M0 16V5a5 5 0 0 1 5-5h11" stroke-width=".45"/>
    <path d="M3 16V7a4 4 0 0 1 4-4h9" stroke-width=".25" opacity=".7"/>
    <path d="M6.2 6.2c2.4 0 3.8 1.4 3.8 3.8-2.4 0-3.8-1.4-3.8-3.8Z" fill="${C.gold}" stroke="none"/>
  </g>`;

/* Brand mark: cream chef-hat outline, gold cloche (gold kept small). */
const brandMark = (x, y, size) => `
  <g transform="translate(${x - size / 2} ${y}) scale(${size / 64})" fill="none" stroke-linecap="round" stroke-linejoin="round">
    <path d="M16 34c-6.5-1-9-9.5-3.6-13.6 1.8-1.4 4-1.9 6-1.6C19.5 11 26 6.6 32.3 9c2.7-4.6 9.7-5.4 13.4-1.3 2.2 2.4 2.7 5.7 1.6 8.5 5.5-.6 9.6 4.6 7.6 9.7-1.1 2.8-3.7 4.6-6.6 4.9" stroke="${C.cream}" stroke-width="2.4"/>
    <path d="M14 37c4-3.5 10-5 13-5" stroke="${C.cream}" stroke-width="2.4"/>
    <path d="M31 24c-1.6-1.6 1.6-3.2 0-4.8M35 24c-1.6-1.6 1.6-3.2 0-4.8" stroke="${C.gold}" stroke-width="1.5"/>
    <circle cx="33" cy="30" r="2" fill="${C.gold}" stroke="none"/>
    <path d="M18 46c0-8.3 6.7-15 15-15s15 6.7 15 15H18Z" fill="${C.gold}" stroke="none"/>
    <path d="M22.5 42.5c1-4.6 4.5-7.8 8.5-8.6" stroke="${C.cream}" stroke-width="1.4" opacity=".7"/>
    <rect x="14" y="46.5" width="38" height="3.4" rx="1.7" fill="${C.goldDark}" stroke="none"/>
  </g>`;

/* Gold divider: line – lotus – line. */
const divider = (y, half, color = C.gold) => `
  <g stroke="${color}" fill="none" stroke-linecap="round">
    <path d="M${CX - half} ${y}H${CX - 6}M${CX + 6} ${y}H${CX + half}" stroke-width=".35"/>
    <circle cx="${CX - half - 1.2}" cy="${y}" r=".5" fill="${color}" stroke="none"/>
    <circle cx="${CX + half + 1.2}" cy="${y}" r=".5" fill="${color}" stroke="none"/>
    <g transform="translate(${CX - 4.2} ${y - 6}) scale(.35)" stroke-width="1.5" stroke-linejoin="round"><path d="${MOTIF.lotus}"/></g>
  </g>`;

/* Arch shapes: straight sides, semicircular top. */
const arch = (x1, x2, yTop, yBottom) => {
  const r = (x2 - x1) / 2;
  return `M${x1} ${yBottom}V${yTop + r}A${r} ${r} 0 0 1 ${x2} ${yTop + r}V${yBottom}Z`;
};

// Arch panel (cream, the 30%)
const A = { x1: 34, x2: 182, top: 88, bottom: 266 };
// Photo window inside the arch
const P = { x1: 43, x2: 173, top: 97, bottom: 198 };

// SVG letter-spacing adds trailing space; shift centred text by half of it.
const spaced = (y, text, size, spacing, fill, family, weight = 600) =>
  `<text x="${CX + spacing / 2}" y="${y}" text-anchor="middle" font-family="${family}" font-weight="${weight}" font-size="${size}" letter-spacing="${spacing}" fill="${fill}">${esc(text)}</text>`;

const servicesLine = SERVICES.map((s, i) => (i ? `<tspan fill="${C.gold}" dx="1.6">•</tspan><tspan dx="1.6">${esc(s)}</tspan>` : `<tspan>${esc(s)}</tspan>`)).join('');

const svg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}mm" height="${H}mm">
  <defs>
    <pattern id="motif" width="30" height="30" patternUnits="userSpaceOnUse" patternTransform="rotate(-12)">
      <g fill="none" stroke="${C.greenLine}" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round">
        <g transform="translate(2 2) scale(.42)"><path d="${MOTIF.lotus}"/></g>
        <g transform="translate(17 16) rotate(20 5 5) scale(.42)"><path d="${MOTIF.leaf}"/></g>
      </g>
    </pattern>
    <radialGradient id="vignette" cx="50%" cy="48%" r="70%">
      <stop offset=".55" stop-color="${C.greenDeep}" stop-opacity="0"/>
      <stop offset="1" stop-color="${C.greenDeep}" stop-opacity=".85"/>
    </radialGradient>
    <clipPath id="photoClip"><path d="${arch(P.x1, P.x2, P.top, P.bottom)}"/></clipPath>
    <linearGradient id="photoShade" x1="0" y1="0" x2="0" y2="1">
      <stop offset=".7" stop-color="#000" stop-opacity="0"/>
      <stop offset="1" stop-color="#000" stop-opacity=".18"/>
    </linearGradient>
  </defs>

  <!-- 60%: green ground -->
  <rect width="${W}" height="${H}" fill="${C.green}"/>
  <rect width="${W}" height="${H}" fill="url(#motif)" opacity=".55"/>
  <rect width="${W}" height="${H}" fill="url(#vignette)"/>

  <!-- 10%: gold frame, 9 mm inside trim -->
  <rect x="12" y="12" width="${W - 24}" height="${H - 24}" fill="none" stroke="${C.gold}" stroke-width=".4"/>
  ${corner(14.5, 14.5, 1, 1)}${corner(W - 14.5, 14.5, -1, 1)}${corner(14.5, H - 14.5, 1, -1)}${corner(W - 14.5, H - 14.5, -1, -1)}

  <!-- Brand block -->
  ${brandMark(CX, 17, 28)}
  <text x="${CX}" y="61" text-anchor="middle" font-family="Cormorant Garamond" font-weight="600" font-size="15.5" fill="${C.cream}">${esc(NAME)}</text>
  <g stroke="${C.gold}" stroke-width=".35"><path d="M${CX - 46} 68.4H${CX - 23}M${CX + 23} 68.4H${CX + 46}"/></g>
  ${spaced(70, 'CATERING', 4.4, 2.1, C.gold, 'Cormorant SC', 700)}
  ${NAME_TE ? `<text x="${CX}" y="78.5" text-anchor="middle" font-family="Noto Serif Telugu" font-weight="500" font-size="3.4" fill="${C.cream}" opacity=".75">${esc(NAME_TE)}</text>` : ''}

  <!-- 30%: cream arch panel -->
  <path d="${arch(A.x1 - 2.2, A.x2 + 2.2, A.top - 2.2, A.bottom + 2.2)}" fill="none" stroke="${C.gold}" stroke-width=".35"/>
  <path d="${arch(A.x1, A.x2, A.top, A.bottom)}" fill="${C.cream}"/>

  <!-- Food photo in an inner arch -->
  <g clip-path="url(#photoClip)">
    <image href="${photo}" x="${P.x1 - 14}" y="${P.top}" width="${P.x2 - P.x1 + 28}" height="${P.bottom - P.top}" preserveAspectRatio="xMidYMid slice"/>
    <rect x="${P.x1}" y="${P.top}" width="${P.x2 - P.x1}" height="${P.bottom - P.top}" fill="url(#photoShade)"/>
  </g>
  <path d="${arch(P.x1 - 1.6, P.x2 + 1.6, P.top - 1.6, P.bottom + 1.6)}" fill="none" stroke="${C.gold}" stroke-width=".3"/>

  <!-- Title inside the cream arch (green on cream = strongest contrast) -->
  ${spaced(227, 'MENU', 21, 6, C.green, 'Cormorant Garamond', 600)}
  ${divider(238, 30)}
  <text x="${CX}" y="251" text-anchor="middle" font-family="EB Garamond" font-style="italic" font-size="5.6" fill="${C.green}">${esc(TAGLINE)}</text>

  <!-- Services, on green below the arch -->
  <text x="${CX}" y="281" text-anchor="middle" font-family="EB Garamond" font-weight="500" font-size="3.6" fill="${C.cream}">${servicesLine}</text>
</svg>`;

const FONTS =
  'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@600&family=Cormorant+SC:wght@700&family=EB+Garamond:ital,wght@0,500;1,400&family=Noto+Serif+Telugu:wght@500&display=block';

const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>Menu Cover</title>
<link href="${FONTS}" rel="stylesheet">
<style>
  @page { size: ${W}mm ${H}mm; margin: 0; }
  html, body { margin: 0; padding: 0; background: ${C.green}; }
  svg { display: block; width: ${W}mm; height: ${H}mm; }
  * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
</style></head>
<body>${svg}</body></html>`;

await mkdir('qr', { recursive: true });
await writeFile('qr/menu-cover.html', html);
console.log('Artwork:  qr/menu-cover.html');

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
if (!existsSync(CHROME)) {
  console.log('Google Chrome not found – open qr/menu-cover.html and print to PDF manually.');
  process.exit(0);
}
const url = pathToFileURL(resolve('qr/menu-cover.html')).href;
const pxW = Math.round((W / 25.4) * 96); // CSS px
const pxH = Math.round((H / 25.4) * 96);
const run = (args) =>
  execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--virtual-time-budget=8000', ...args], { stdio: 'ignore' });

run(['--no-pdf-header-footer', `--print-to-pdf=${resolve('qr/menu-cover.pdf')}`, url]);
run(['--hide-scrollbars', `--window-size=${pxW},${pxH}`, '--force-device-scale-factor=6.25', `--screenshot=${resolve('qr/menu-cover-600dpi.png')}`, url]);
run(['--hide-scrollbars', `--window-size=${pxW},${pxH}`, '--force-device-scale-factor=1', `--screenshot=${resolve('qr/menu-cover-preview.png')}`, url]);
console.log('Print PDF: qr/menu-cover.pdf  (210 × 297 mm + 3 mm bleed)');
console.log('Hi-res:    qr/menu-cover-600dpi.png');
console.log('Preview:   qr/menu-cover-preview.png');
