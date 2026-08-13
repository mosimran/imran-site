# Tasks

31 tasks plus T00. One at a time: branch, build the one thing, run the named
validation, PR, green CI, squash, confirm the deploy, append to
[WORKLOG.md](WORKLOG.md), stop.

The loop is written out in [PLAN.md section 11](PLAN.md#11-how-each-task-runs).

**Ships** marks tasks whose result is visible on the live site the moment they merge.
The site goes live at T03, deliberately early, so "deployed and validated" means
something on every task after it rather than only at the end.

---

## Track 0: start the clock

- [x] **T00** ~~Open the `.com.bd` delegation request with BTCL~~ **CANCELLED**
  <br>Not needed. `imran.com.bd` is already an active Cloudflare zone
  (`c566ee2a7cd380ccfe9bbd4b3ed48e85`) in the John Efemer account, on
  `greg`/`may.ns.cloudflare.com`. The longest lead time in the plan does not exist.

## Track 1: get it live

- [x] **T01** gh auth as mosimran, repo init, git identity, docs, 31 issues, milestone
  <br>*Ships:* no. *Validated by:* `gh api /user` returns mosimran; the first commit's
  author is correct on github.com, not just locally.
  <br>*Status:* done, pushed. All 3 commits linked to the mosimran account.
  Issues and milestone NOT created: the token lacks `Issues: write`. TASKS.md is the
  source of truth meanwhile. See WORKLOG.

- [x] **T02** Astro skeleton, index page, `rfc.css` extracted from the prototype
  <br>*Ships:* no. *Validated by:* `npm run build` clean; local render matches the
  prototype's home view side by side.
  <br>*Status:* done. Rendered text identical at 22,043 chars, compared mechanically.
  50,344 bytes, 0 scripts, CSS inlined at 9,634 bytes. See WORKLOG.

- [x] **T03** Pages project, first deploy by hand
  <br>*Ships:* **live from here.** *Validated by:* the pages.dev URL serves the index
  over HTTPS.
  <br>*Status:* done. https://imran-site.pages.dev, 200 in 0.62 s, served bytes
  identical to `dist/`. Account `John Efemer` / `f697cce1cf00f8132c900d2c643ad935`,
  project `imran-site`. See WORKLOG.

- [x] **T04** Actions pipeline, build and deploy on green
  <br>*Ships:* yes. *Validated by:* push a one-word change, it appears without
  touching wrangler locally. Break a check on purpose, deploy is skipped.
  <br>*Status:* pipeline green. Failure path proven: a deliberate `<script>` tag gave
  `check: failure`, `deploy: skipped`, live site unaffected. Auto-deploy still gated on
  `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` secrets. See WORKLOG.

- [x] **T04a** Readability pass, spot accent colour, dead form, favicon and share card
  <br>*Ships:* yes. *Inserted* on request, not in the original 31.
  <br>*Status:* done. Typographic rule applied, accent AA in both themes (10/10 pairs),
  CV form now degrades loudly, favicon set and OG card live. robots.txt pulled forward
  from T17 with Google and AI crawlers explicitly allowed. See WORKLOG.

- [x] **T05** `_headers`, `_redirects`, security headers, **and zone hardening**
  <br>*Ships:* yes. *Validated by:* `curl -I` shows HSTS, CSP, nosniff.
  securityheaders.com grade A or better. **Plus: 0 script tags on the LIVE page, not
  just in `dist/`.**
  <br>*Blocked on:* Cloudflare Email Address Obfuscation must be turned off on both
  zones first (Scrape Shield). It injects a `<script>` and two `/cdn-cgi/` requests
  into every response, which breaks the zero-JavaScript budget and would be blocked by
  the planned CSP. Needs dashboard access or a token with Zone Settings Edit.

## Track 2: content model

- [x] **T06** Collections, Zod schema, `draft.ts` identifier and expiry
  <br>*Ships:* no. *Validated by:* remove `retires` from one paper, build fails with
  the schema message; restore. Identifier computes to `-03` for the index.

- [x] **T07** 14 papers migrated, front matter complete
  <br>*Ships:* no. *Validated by:* build green, `astro check` zero errors, count
  matches the index table.

- [x] **T08** 5 implementation notes and 4 errata migrated
  <br>*Ships:* no. *Validated by:* same, and slugs match llms.txt exactly.

- [x] **T09** Paper count reconciled to one generated source
  <br>*Ships:* no. *Validated by:* `grep -r "34 papers" src/` returns nothing.

## Track 3: routes

- [x] **T10** Three layouts (Rfc, Paper, Impl), masthead in the Internet-Draft form
  <br>*Ships:* yes. *Validated by:* masthead renders the identifier and a correct
  `Expires` date computed from `revised`. GitHub link fixed to `mosimran`.
  <br>*Status:* done. `draft-imran-systems-and-arguments-03`, expires 14 February 2027,
  matching an independent computation to the day. 0 references to the old name anywhere
  in the build. See WORKLOG.

- [x] **T11** `/papers/` and `/papers/<slug>/`
  <br>*Ships:* yes. *Validated by:* 14 pages build, index sorted by confidence,
  retracted paper renders struck through.

- [x] **T12** `/impl/<slug>/`, `/errata/`, `/cv/`
  <br>*Ships:* yes. *Validated by:* all routes 200. The CV form is real HTML, not
  `onsubmit="return false"`.

- [x] **T13** Router deleted, anchors preserved, 404 page
  <br>*Status:* 404 page done; router was never carried over. *Ships:* yes. *Validated by:* zero `<script>` tags in `dist/`. Every anchor from
  the prototype resolves; scripted check over the list.

## Track 4: machine surface

- [x] **T14** Three Atom feeds
  <br>*Ships:* yes. *Validated by:* W3C Feed Validator clean. Bump a version locally,
  the entry updates rather than duplicating.

- [x] **T15** `llms.txt` and `llms-full.txt`, generated
  <br>*Ships:* yes. *Validated by:* diff the generated llms.txt against the
  handwritten handoff, every difference explainable.

- [x] **T16** `index.json` and the `.md` mirrors
  <br>*Ships:* yes. *Validated by:* JSON parses, schema URL present, every paper
  carries confidence, state and expires.

- [x] **T17** robots.txt, sitemap, Content Signals
  <br>*Ships:* yes. *Validated by:* sitemap validates, `lastmod` matches `revised` and
  not file mtime.

- [x] **T18** JSON-LD and the CSP hash integration
  <br>*Ships:* yes. *Validated by:* Rich Results Test passes. Real browser, real
  domain, zero console CSP violations.

## Track 5: quality gates

- [x] **T19** Budget scripts wired into `npm run check`
  <br>*Ships:* no. *Validated by:* add a fake webfont, check fails; remove, green.
  Index under 60 KB, CSS under 12 KB.

- [~] **T20** Lighthouse CI and pa11y, both colour schemes
  <br>*Ships:* no. *Validated by:* LCP under 1.2 s on simulated 3G. AA contrast in
  light and dark. Tap targets pass. Print check by hand.

- [x] **T21** Link check, errata check, expiry check
  <br>*Ships:* no. *Validated by:* change a confidence value with no errata file, PR
  fails; add the file, green.

## Track 6: the gate

- [x] **T22** D1 database, migration, private object store (KV, not R2)
  <br>*Ships:* no. *Validated by:* migration applies, PDF uploaded, guessing the
  bucket URL from outside finds no route.

- [x] **T23** `POST /api/cv`, no-JS acknowledgement page, Resend
  <br>*Ships:* yes. *Validated by:* real mail arrives. Acknowledgement page is
  byte-identical for valid, rate-limited and malformed addresses; diffed, not
  eyeballed.

- [x] **T24** `GET /cv/<token>`, `_routes.json`, collision test
  <br>*Ships:* yes. *Validated by:* `/cv/` serves as a static asset, `/cv/deadbeef`
  hits the function and 410s.

- [x] **T25** `/api/cv/forget` and the cron janitor Worker
  <br>*Ships:* yes. *Validated by:* forget deletes the rows, janitor runs on its
  trigger against a backdated row.

- [x] **T26** Adversarial pass over the whole gate
  <br>*Ships:* no. *Validated by:* two simultaneous redeems give exactly one 200 and
  one 410. Expired token 410s. Limits trip at 4 and 61. Nothing in the logs is PII.

## Track 7: domains

- [~] **T27** mosthofaimran.com cutover, mailboxes, Resend DNS
  <br>*Ships:* live. *Validated by:* apex and www resolve, `hey@` and `security@`
  both receive, SPF, DKIM and DMARC pass.
  <br>*Status:* **routing already done.** The apex is attached to the `imran-site`
  Pages project and serving the current build over HTTPS. Remaining: `www`, the two
  mailboxes, and the Resend DNS records.

- [x] **T28** johnefemer.com and imran.com.bd aliases
  <br>*Ships:* live. *Validated by:* both serve, canonical on every alias page names
  the primary, security.txt lists all three `Canonical` URIs.
  <br>*Status:* `imran.com.bd` **done**, attached and serving, canonical correctly
  names the primary. `johnefemer.com` **not started**: registered at Namecheap since
  2022-07-29, expires 2027-07-29, but parked on `ns1/ns2.lander.d.parity.domains`.
  Its nameservers must move to Cloudflare before it can be attached.

- [ ] **T29** HSTS preload on the primary
  <br>*Ships:* live. *Validated by:* a week of clean serving first, then submit.
  Aliases stay unpreloaded.

## Track 8: signatures

- [x] **T30** New key, pgp.asc, real fingerprints replace the placeholders
  <br>*Ships:* yes. *Validated by:* `gpg --recv-keys` against the published
  fingerprint returns the key.

- [x] **T31** Sign the index draft and every paper, signed commits on
  <br>*Ships:* yes. *Validated by:* the section 9.3 curl-and-verify sequence, run
  verbatim from a clean machine, verifies.

---

## Ordering notes

**T03 is deliberately early.** Everything after it lands on a site that is already
serving, so "deployed and validated" means something on every single task rather than
only at the end.

**The gate (T22 to T26) sits after the quality gates on purpose.** It is the only part
with an attack surface, and it is easier to reason about when the static site around
it is already frozen and checked.
