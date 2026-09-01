// Builds the favicon set and the social share card from the author photo.
//
// Run by hand, not at build time: it renders with macOS system fonts through
// librsvg, so it is not reproducible on a CI runner. The outputs are committed.
// The per-paper cards described in PLAN section 7 are a separate job at T18 and
// do embed their font.
//
//   node scripts/make-social.mjs
//
// Card geometry is 1200x630, which is 1.91:1. Twitter wants that for
// summary_large_image and WhatsApp renders the same ratio for link previews.
// The JPEG is kept under 300 KB because WhatsApp silently drops covers above it.

import sharp from 'sharp'
import { readFileSync, writeFileSync, existsSync } from 'node:fs'

// The card's identifier is read out of the built page rather than typed here.
// It was typed here once, the document reached -05, and the card carried on
// telling every share preview it was -03. A share card is the first thing most
// readers see; it does not get to disagree with the document.
if (!existsSync('dist/index.html')) {
  console.error('\nmake-social: no dist/index.html. Run `npm run build` first.\n')
  process.exit(1)
}
const IDENT = (readFileSync('dist/index.html', 'utf8').match(/draft-imran-systems-and-arguments-\d{2}/) || [])[0]
if (!IDENT) {
  console.error('\nmake-social: no draft identifier found in dist/index.html.\n')
  process.exit(1)
}

const SRC = 'docs/john - avatar 2022.png'
const W = 1200
const H = 630
const PANEL = 452

// rfc.css :root under prefers-color-scheme: dark. The card is the dark theme
// because a share card sits on someone else's timeline, not on our paper.
const PAPER = '#0d1013'
const INK = '#dde2e6'
const DIM = '#8d97a1'
const ACCENT = '#4fbdb6'
const RULE = '#222a31'

const MONO = "Menlo,'SF Mono','JetBrains Mono',monospace"
const SERIF = "Charter,'Iowan Old Style',Georgia,serif"

// ---------- favicons ----------

const svg = readFileSync('public/favicon.svg')
for (const s of [16, 32, 48, 180, 512]) {
  await sharp(svg, { density: 600 }).resize(s, s).png().toFile(`/tmp/icon-${s}.png`)
}
await sharp('/tmp/icon-180.png').toFile('public/apple-touch-icon.png')
await sharp('/tmp/icon-512.png').toFile('public/icon-512.png')

// ---------- share card ----------

// Attention-weighted crop. The geometric centre of this frame is the laptop
// lid; attention finds the face.
const photo = await sharp(SRC)
  .resize(PANEL, H, { fit: 'cover', position: sharp.strategy.attention })
  .toBuffer()

// Feather the inner edge so the portrait sits on the ground rather than on a seam.
const fade = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${PANEL}" height="${H}">
  <defs><linearGradient id="g" x1="0" x2="1">
    <stop offset="0" stop-color="${PAPER}" stop-opacity="1"/>
    <stop offset="0.45" stop-color="${PAPER}" stop-opacity="0"/>
  </linearGradient></defs>
  <rect width="${PANEL}" height="${H}" fill="url(#g)"/></svg>`)

const panel = await sharp(photo).composite([{ input: fade }]).toBuffer()

const text = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <rect x="0" y="0" width="${W}" height="6" fill="${ACCENT}"/>

  <text x="72" y="128" font-family="${MONO}" font-size="19" font-weight="700"
        letter-spacing="3.4" fill="${ACCENT}">INTERNET-DRAFT</text>

  <text x="72" y="232" font-family="${SERIF}" font-size="78" font-weight="700"
        fill="${INK}">Mosthofa Imran</text>

  <text x="72" y="288" font-family="${MONO}" font-size="25" fill="${DIM}">Head of Engineering and Delivery</text>
  <text x="72" y="324" font-family="${MONO}" font-size="25" fill="${DIM}">Dhaka, Bangladesh (UTC+6)</text>

  <line x1="72" y1="372" x2="648" y2="372" stroke="${RULE}" stroke-width="1.5"/>

  <text x="72" y="422" font-family="${SERIF}" font-size="29" fill="${INK}">Systems with numbers.</text>
  <text x="72" y="464" font-family="${SERIF}" font-size="29" fill="${INK}">Arguments with confidence values.</text>
  <text x="72" y="506" font-family="${SERIF}" font-size="29" fill="${DIM}">A public retraction log.</text>

  <text x="72" y="578" font-family="${MONO}" font-size="19"
        fill="${ACCENT}">${IDENT}</text>
</svg>`)

const card = sharp({ create: { width: W, height: H, channels: 3, background: PAPER } })
  .composite([
    { input: panel, left: W - PANEL, top: 0 },
    { input: text, left: 0, top: 0 },
  ])

await card.clone().jpeg({ quality: 88, chromaSubsampling: '4:4:4' }).toFile('public/og-cover.jpg')
await card.clone().webp({ quality: 88 }).toFile('public/og-cover.webp')

// Stamped so `npm run check` can tell whether the committed card still matches
// the document. Kept outside public/ because it is build metadata, not a route.
writeFileSync('scripts/og-cover.id', IDENT + '\n')

console.log(`favicons and share card written to public/, identifier ${IDENT}`)
