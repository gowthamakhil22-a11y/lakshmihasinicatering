/**
 * QR codes and a print-ready table card for the menu.
 *
 *   npm run qr                       → uses VITE_SITE_URL from .env
 *   npm run qr -- https://your.site/ → uses the given URL
 *
 * Writes to qr/:
 *   menu-qr.png       2000px QR, for any print design
 *   menu-qr.svg       vector QR
 *   table-card.html   A6 card (105 × 148 mm) in the menu's green and gold
 *   table-card.pdf    the same card as a PDF, if Google Chrome is installed
 *   business-card.pdf          89 × 51 mm card, 3 mm bleed, page 1 front / page 2 back
 *   business-card-preview.png  mockup photo of both sides
 */
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import QRCode from 'qrcode';
import { mockupHtml, printHtml } from './business-card.mjs';

async function siteUrlFromEnv() {
  for (const file of ['.env.local', '.env']) {
    try {
      const text = await readFile(file, 'utf8');
      const m = text.match(/^VITE_SITE_URL=(.*)$/m);
      if (m && m[1].trim()) return m[1].trim().replace(/^["']|["']$/g, '');
    } catch {
      /* file missing */
    }
  }
  return '';
}

/** Read business details straight from appConfig.js (it uses Vite-only APIs, so no import). */
async function businessDetails() {
  const src = await readFile('src/config/appConfig.js', 'utf8');
  const get = (key, fallback) => src.match(new RegExp(`${key}:\\s*'([^']*)'`))?.[1] || fallback;
  return {
    name: get('name', 'Lakshmi Hasini Catering'),
    nameTe: get('nameTe', ''),
    tagline: get('tagline', ''),
    phone: get('phoneNumber', ''),
    whatsapp: get('whatsappNumber', ''),
    email: get('email', ''),
    location: get('location', ''),
    services: get('cardServices', 'Weddings · Functions · Corporate Events'),
  };
}

function esc(s) {
  return String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
}

function cardHtml({ qrSvg, url, name, tagline, phone }) {
  const m = name.match(/^(.*?)\s+(catering|caterers)$/i);
  const main = m ? m[1] : name;
  const sub = m ? m[2] : '';
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>${esc(name)} – Menu table card</title>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,600;1,500&family=Cormorant+SC:wght@600;700&family=EB+Garamond:ital@0;1&family=Noto+Serif+Telugu:wght@500&display=swap" rel="stylesheet">
<style>
  @page { size: 105mm 148mm; margin: 0; }
  * { box-sizing: border-box; margin: 0; }
  html, body { width: 105mm; height: 148mm; }
  body {
    -webkit-print-color-adjust: exact; print-color-adjust: exact;
    background: #0e3d27;
    background-image:
      radial-gradient(ellipse 90% 60% at 45% 30%, rgba(255,255,255,.07), transparent 70%),
      repeating-linear-gradient(0deg, rgba(255,255,255,.022) 0 1px, transparent 1px 3px),
      repeating-linear-gradient(90deg, rgba(0,0,0,.06) 0 1px, transparent 1px 3px);
    color: #efe6cf; font-family: 'EB Garamond', 'Noto Serif Telugu', Georgia, serif;
  }
  .frame {
    position: absolute; inset: 5mm; border: .3mm solid rgba(210,176,106,.8);
    display: flex; flex-direction: column; align-items: center; justify-content: space-between;
    text-align: center; padding: 8mm 6mm 6mm;
  }
  .frame::after { content: ''; position: absolute; inset: 1.4mm; border: .2mm solid rgba(210,176,106,.4); }
  .kicker { font: italic 500 12pt 'Cormorant Garamond', serif; color: #d2b06a; }
  h1 { font: 600 25pt/1 'Cormorant Garamond', serif; color: #d2b06a; margin-top: 1.5mm; }
  .sub { display: block; margin-top: 2mm; font: 700 8.5pt 'Cormorant SC', serif; letter-spacing: .42em; text-transform: lowercase; }
  .tag { font-style: italic; font-size: 9.5pt; opacity: .85; margin-top: 2mm; }
  .qr {
    width: 46mm; height: 46mm; padding: 2.5mm; background: #f6efdd;
    box-shadow: 0 0 0 .4mm #d2b06a, 0 0 0 1.6mm #0e3d27, 0 0 0 1.9mm rgba(210,176,106,.55);
  }
  .qr svg { width: 100%; height: 100%; display: block; }
  .scan { font: 700 12pt 'Cormorant SC', serif; letter-spacing: .14em; text-transform: lowercase; color: #d2b06a; }
  .scan-te { font: 500 9.5pt 'Noto Serif Telugu', serif; color: #efe6cf; opacity: .85; margin-top: 1mm; }
  .steps { font-size: 8.5pt; opacity: .75; margin-top: 2mm; }
  .phone { font: 600 9.5pt 'Cormorant SC', serif; letter-spacing: .12em; opacity: .8; }
  .url { font-size: 6.5pt; opacity: .45; margin-top: 1mm; word-break: break-all; }
</style>
</head>
<body>
  <div class="frame">
    <div>
      <p class="kicker">The Menu of</p>
      <h1>${esc(main)}${sub ? `<span class="sub">${esc(sub)}</span>` : ''}</h1>
      ${tagline ? `<p class="tag">${esc(tagline)}</p>` : ''}
    </div>
    <div class="qr">${qrSvg}</div>
    <div>
      <p class="scan">Scan to open our menu</p>
      <p class="scan-te">మెనూ చూడటానికి స్కాన్ చేయండి</p>
      <p class="steps">Tick your dishes · Add date &amp; guests · Send on WhatsApp</p>
    </div>
    <div>
      ${phone ? `<p class="phone">${esc(phone)}</p>` : ''}
      <p class="url">${esc(url)}</p>
    </div>
  </div>
</body>
</html>`;
}

function findChrome() {
  const candidates = [
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
  ];
  return candidates.find((p) => existsSync(p));
}

const url = process.argv.slice(2).find((a) => /^https?:/i.test(a)) || (await siteUrlFromEnv());
// Printed codes open /go/, which forwards to the menu, Google Maps or any link
// chosen later in /admin, so cards never need reprinting. Use --direct to skip it.
const direct = process.argv.includes('--direct');
const site = url.replace(/\/?$/, '/');
const qrUrl = direct ? site : `${site}go/`;
if (!/^https?:\/\//i.test(url)) {
  console.error('No site URL. Pass one (npm run qr -- https://...) or set VITE_SITE_URL in .env');
  process.exit(1);
}

const opts = {
  errorCorrectionLevel: 'H', // survives smudges and creases
  margin: 2,
  color: { dark: '#0F4A2E', light: '#FFFFFF' },
};

await mkdir('qr', { recursive: true });
await QRCode.toFile('qr/menu-qr.png', qrUrl, { ...opts, width: 2000 });
await writeFile('qr/menu-qr.svg', await QRCode.toString(qrUrl, { ...opts, type: 'svg' }));

const qrSvg = await QRCode.toString(qrUrl, {
  errorCorrectionLevel: 'H',
  margin: 0,
  type: 'svg',
  color: { dark: '#0E3D27', light: '#F6EFDD' },
});
const details = await businessDetails();
await writeFile('qr/table-card.html', cardHtml({ qrSvg, url: site, ...details }));

// Business card: QR in deep green on cream, photo embedded so the file is self-contained.
const cardQr = await QRCode.toString(qrUrl, {
  errorCorrectionLevel: 'H',
  margin: 0,
  type: 'svg',
  color: { dark: '#0E3D27', light: '#FFFDF6' },
});
let photo = '';
for (const f of ['public/images/festive-spread.webp', 'public/images/hero-banana-leaf-meal.webp']) {
  if (existsSync(f)) {
    photo = `data:image/webp;base64,${(await readFile(f)).toString('base64')}`;
    break;
  }
}
await writeFile('qr/business-card.html', printHtml(details, cardQr, photo));
await writeFile('qr/business-card-preview.html', mockupHtml(details, cardQr, photo));

const chrome = findChrome();
const run = (args) => execFileSync(chrome, ['--headless=new', '--disable-gpu', '--virtual-time-budget=8000', ...args], { stdio: 'ignore' });
const fileUrl = (f) => pathToFileURL(resolve(f)).href;
if (chrome) {
  try {
    run(['--no-pdf-header-footer', `--print-to-pdf=${resolve('qr/table-card.pdf')}`, fileUrl('qr/table-card.html')]);
    run(['--no-pdf-header-footer', `--print-to-pdf=${resolve('qr/business-card.pdf')}`, fileUrl('qr/business-card.html')]);
    run(['--hide-scrollbars', '--window-size=1600,1100', `--screenshot=${resolve('qr/business-card-preview.png')}`, fileUrl('qr/business-card-preview.html')]);
    console.log('Table card:     qr/table-card.pdf (A6, print at 100%)');
    console.log('Business card:  qr/business-card.pdf (89 × 51 mm + 3 mm bleed; page 1 front, page 2 back)');
    console.log('Preview:        qr/business-card-preview.png');
  } catch {
    console.log('Could not make PDFs automatically. Open the .html files in qr/ with Chrome and Print → Save as PDF (margins none).');
  }
} else {
  console.log('Open the .html files in qr/ with Chrome and Print → Save as PDF (margins none).');
}
console.log(`QR codes open ${qrUrl} – written to qr/`);
