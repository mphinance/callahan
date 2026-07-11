// Renders the "Are We There Yet?" PWA icons (open road to a destination flag) to PNG.
// Uses the Playwright chromium that ships with this repo's deps.
//   node gen-icons.js
const { chromium } = require('playwright');

// Inner artwork in a 512x512 space: a sky, a winding road, and a destination pin.
const ART = `
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#7cc0ee"/>
      <stop offset="100%" stop-color="#eaf4fb"/>
    </linearGradient>
  </defs>
  <rect x="0" y="0" width="512" height="512" fill="url(#sky)"/>
  <circle cx="110" cy="120" r="44" fill="#ffc24b"/>
  <!-- winding road as a ribbon -->
  <path d="M150 500 C 150 380 300 380 300 300 C 300 220 150 210 190 130 C 215 82 300 96 356 96"
        fill="none" stroke="#5b6675" stroke-width="70" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M150 500 C 150 380 300 380 300 300 C 300 220 150 210 190 130 C 215 82 300 96 356 96"
        fill="none" stroke="#ffd24d" stroke-width="8" stroke-linecap="round"
        stroke-dasharray="4 30"/>
  <!-- destination pin at the end of the road -->
  <g transform="translate(372 74)">
    <path d="M0 92 C -44 38 -33 -8 0 -8 C 33 -8 44 38 0 92 Z" fill="#ef7d3b" stroke="#fff" stroke-width="6"/>
    <circle cx="0" cy="26" r="14" fill="#fff"/>
  </g>
`;

function svg(size, maskable) {
  const inner = maskable
    ? `<g transform="translate(56 56) scale(0.78)">${ART}</g>`
    : ART;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 512 512">
    <rect width="512" height="512" fill="#eaf4fb"/>
    ${inner}
  </svg>`;
}

const ICONS = [
  { file: 'assets/icon-192.png', size: 192, svg: svg(192, false) },
  { file: 'assets/icon-512.png', size: 512, svg: svg(512, false) },
  { file: 'assets/icon-maskable-512.png', size: 512, svg: svg(512, true) }
];

(async () => {
  const browser = await chromium.launch({ executablePath: process.env.PWEXEC });
  for (const ic of ICONS) {
    const page = await browser.newContext({ viewport: { width: ic.size, height: ic.size }, deviceScaleFactor: 1 })
      .then(c => c.newPage());
    await page.setContent('<style>*{margin:0;padding:0}</style>' + ic.svg);
    await page.screenshot({ path: ic.file });
    console.log('wrote', ic.file);
    await page.close();
  }
  await browser.close();
  console.log('icons done');
})().catch(e => { console.error('ICON ERROR:', e.message); process.exit(1); });
