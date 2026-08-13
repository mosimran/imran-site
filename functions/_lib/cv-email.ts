// The one email this site sends: the résumé link.
//
// Style follows the site. Dark ground, system stacks only, monospace for the
// apparatus and a text face for anything read in sentences, verdigris spent
// once. No webfonts, no images, no tracking pixel, no unsubscribe footer,
// because there is no list to leave.
//
// Email clients strip <style> blocks and most selectors, so everything is
// inline and the layout is tables. Outlook does not do flexbox and never will.
//
// A plain text alternative always ships alongside. A signed link that only
// renders in an HTML client is a link some people cannot use, and the whole
// point of Section 6 is that requesting the file should cost the requester
// nothing.

const PAPER = '#0d1013'
const PANEL = '#151a1e'
const INK = '#dde2e6'
const DIM = '#8d97a1'
const RULE = '#222a31'
const ACCENT = '#4fbdb6'

const MONO = "ui-monospace,'SF Mono','JetBrains Mono',Menlo,Consolas,monospace"
const SERIF = "Charter,'Iowan Old Style',Georgia,'Times New Roman',serif"

export interface CvLinkVars {
  url: string
  ttlSeconds: number
  from?: string
}

const hours = (s: number) => Math.round(s / 3600)

export function subject(): string {
  // No urgency, no first name, no "Your download is ready!". It is a document.
  return 'Your link to the CV'
}

export function text({ url, ttlSeconds }: CvLinkVars): string {
  return `Here is the link.

${url}

It works once and expires in ${hours(ttlSeconds)} hours. If it has already been
used, or you left it too long, request another at
https://mosthofaimran.com/cv/ and nothing is held against you.

What was recorded: your address, so the link could be issued and revoked, and
the time it was issued and redeemed. The source network, truncated to a /24,
for rate limiting only. Not your user agent, because there is no purpose for it.

Your address is not on a list. There is no list. Nothing follows this email
unless you write back, and if you would rather it were deleted, say so and it
goes the same day.

If the file is not what you needed, reply and say what you are actually looking
for. Sections 3 to 5 of the document will usually answer it better than the CV
does.

Mosthofa Imran
https://mosthofaimran.com
`
}

export function html({ url, ttlSeconds }: CvLinkVars): string {
  const p = `margin:0 0 16px;font-family:${SERIF};font-size:16px;line-height:1.6;color:${INK}`
  const dim = `margin:0 0 14px;font-family:${SERIF};font-size:14.5px;line-height:1.6;color:${DIM}`
  const label = `font-family:${MONO};font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:${ACCENT};font-weight:700`

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="dark">
<meta name="supported-color-schemes" content="dark">
<title>${subject()}</title>
</head>
<body style="margin:0;padding:0;background:${PAPER};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">Single use, expires in ${hours(ttlSeconds)} hours. No list, no sequence.</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${PAPER};">
<tr><td align="center" style="padding:40px 16px;">

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;">

    <tr><td style="padding-bottom:10px;">
      <span style="${label}">Section 6</span>
    </td></tr>

    <tr><td style="padding-bottom:26px;border-bottom:1px solid ${RULE};">
      <div style="font-family:${MONO};font-size:13px;line-height:1.8;color:${DIM};">
        Curriculum Vitae<br>
        Access controlled &#183; single use &#183; ${hours(ttlSeconds)} hour lifetime
      </div>
    </td></tr>

    <tr><td style="padding:30px 0 0;">
      <p style="${p}">Here is the link.</p>
    </td></tr>

    <tr><td style="padding:6px 0 24px;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="background:${PANEL};border:1px solid ${RULE};border-left:3px solid ${ACCENT};width:100%;">
        <tr><td style="padding:16px 18px;">
          <a href="${url}" style="font-family:${MONO};font-size:14px;line-height:1.6;color:${ACCENT};text-decoration:none;word-break:break-all;">${url}</a>
        </td></tr>
      </table>
    </td></tr>

    <tr><td>
      <p style="${p}">It works once and expires in ${hours(ttlSeconds)} hours. If it has already been used, or you left it too long, <a href="https://mosthofaimran.com/cv/" style="color:${ACCENT};text-decoration:none;border-bottom:1px solid ${RULE};">request another</a> and nothing is held against you.</p>
    </td></tr>

    <tr><td style="padding:14px 0 8px;border-top:1px solid ${RULE};">
      <span style="${label}">What was recorded</span>
    </td></tr>

    <tr><td>
      <p style="${dim}">Your address, so the link could be issued and revoked, and the time it was issued and redeemed. The source network, truncated to a /24, for rate limiting only. Not your user agent, because there is no purpose for it.</p>
      <p style="${dim}">Your address is not on a list. There is no list. Nothing follows this email unless you write back, and if you would rather it were deleted, say so and it goes the same day.</p>
    </td></tr>

    <tr><td style="padding-top:14px;">
      <p style="${p}">If the file is not what you needed, reply and say what you are actually looking for. Sections 3 to 5 of the document will usually answer it better than the CV does.</p>
    </td></tr>

    <tr><td style="padding-top:26px;border-top:1px solid ${RULE};">
      <div style="font-family:${MONO};font-size:12px;line-height:1.9;color:${DIM};">
        Mosthofa Imran<br>
        <a href="https://mosthofaimran.com" style="color:${DIM};text-decoration:none;">mosthofaimran.com</a>
      </div>
    </td></tr>

  </table>

</td></tr>
</table>
</body>
</html>`
}
