import QRCode from 'qrcode'

/*
 * A QR code, drawn at build time as inline SVG.
 *
 * It has to be inline. An <img> would be a second request in the reading path,
 * a hosted generator would be a third-party request, and a client-side library
 * would be JavaScript. All three are forbidden by BUILD.md section 6, and the
 * one route left open is to encode it during the build and put the vectors in
 * the page. That also means the code is in the HTML the reader already has, so
 * it works with the network off once the page has loaded.
 *
 * Error correction is M, 15% recovery. L makes a smaller code and gives up the
 * margin that lets a phone read it off a screen at an angle; Q and H push this
 * payload to 85 modules, and a denser grid on the same physical area is harder
 * to scan, not easier.
 */

const QUIET = 4  // modules. RFC-equivalent for QR is ISO/IEC 18004, which requires 4.

export interface Qr {
  svg: string
  /** Modules per side, without the quiet zone. Reported so a page can say it. */
  size: number
  version: number
  payloadBytes: number
}

export function qr(payload: string, label: string): Qr {
  const code = QRCode.create(payload, { errorCorrectionLevel: 'M' })
  const size = code.modules.size
  const data = code.modules.data
  const side = size + QUIET * 2

  /*
   * Dark modules are emitted as horizontal runs rather than one rect each.
   * A 69 module code is 4761 cells; drawing each one separately produced a path
   * around four times longer for a picture identical to the pixel.
   */
  const parts: string[] = []
  for (let y = 0; y < size; y++) {
    let run = 0
    for (let x = 0; x <= size; x++) {
      const dark = x < size && data[y * size + x] === 1
      if (dark) { run++; continue }
      if (run > 0) {
        parts.push(`M${x - run + QUIET} ${y + QUIET}h${run}v1h-${run}z`)
        run = 0
      }
    }
  }

  /*
   * The background is painted white by the SVG itself and the modules are
   * painted black, in both colour schemes. This is the one place on the site
   * that ignores the reader's theme, and it is deliberate: a QR inverted to
   * light-on-dark is out of spec, and while some scanners cope, the ones on
   * older phones return nothing at all. A contact code that fails in a dim room
   * is worse than one that ignores dark mode.
   *
   * shape-rendering="crispEdges" turns off antialiasing. A blurred module edge
   * is the most common reason a rendered code will not decode.
   */
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${side} ${side}" ` +
    `width="100%" height="100%" shape-rendering="crispEdges" ` +
    `role="img" aria-label="${escapeAttr(label)}">` +
    `<rect width="${side}" height="${side}" fill="#ffffff"/>` +
    `<path d="${parts.join('')}" fill="#000000"/>` +
    `</svg>`

  return { svg, size, version: code.version, payloadBytes: Buffer.byteLength(payload) }
}

const escapeAttr = (v: string) =>
  v.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
