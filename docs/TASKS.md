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

- [ ] **T00** Open the `.com.bd` delegation request with BTCL
  <br>*Ships:* no. *Validated by:* ticket reference recorded here. Runs in parallel
  with everything; blocks only T28.

## Track 1: get it live

- [x] **T01** gh auth as mosimran, repo init, git identity, docs, 31 issues, milestone
  <br>*Ships:* no. *Validated by:* `gh api /user` returns mosimran; the first commit's
  author is correct on github.com, not just locally.
  <br>*Status:* local half done, push blocked on `gh auth`. See WORKLOG.

- [x] **T02** Astro skeleton, index page, `rfc.css` extracted from the prototype
  <br>*Ships:* no. *Validated by:* `npm run build` clean; local render matches the
  prototype's home view side by side.
  <br>*Status:* done. Rendered text identical at 22,043 chars, compared mechanically.
  50,344 bytes, 0 scripts, CSS inlined at 9,634 bytes. See WORKLOG.

- [ ] **T03** Pages project, first deploy by hand
  <br>*Ships:* **live from here.** *Validated by:* the pages.dev URL serves the index
  over HTTPS.

- [ ] **T04** Actions pipeline, build and deploy on green
  <br>*Ships:* yes. *Validated by:* push a one-word change, it appears without
  touching wrangler locally. Break a check on purpose, deploy is skipped.

- [ ] **T05** `_headers`, `_redirects`, security headers
  <br>*Ships:* yes. *Validated by:* `curl -I` shows HSTS, CSP, nosniff.
  securityheaders.com grade A or better.

## Track 2: content model

- [ ] **T06** Collections, Zod schema, `draft.ts` identifier and expiry
  <br>*Ships:* no. *Validated by:* remove `retires` from one paper, build fails with
  the schema message; restore. Identifier computes to `-03` for the index.

- [ ] **T07** 14 papers migrated, front matter complete
  <br>*Ships:* no. *Validated by:* build green, `astro check` zero errors, count
  matches the index table.

- [ ] **T08** 5 implementation notes and 4 errata migrated
  <br>*Ships:* no. *Validated by:* same, and slugs match llms.txt exactly.

- [ ] **T09** Paper count reconciled to one generated source
  <br>*Ships:* no. *Validated by:* `grep -r "34 papers" src/` returns nothing.

## Track 3: routes

- [ ] **T10** Three layouts (Rfc, Paper, Impl), masthead in the Internet-Draft form
  <br>*Ships:* yes. *Validated by:* masthead renders the identifier and a correct
  `Expires` date computed from `revised`. GitHub link fixed to `mosimran`.

- [ ] **T11** `/papers/` and `/papers/<slug>/`
  <br>*Ships:* yes. *Validated by:* 14 pages build, index sorted by confidence,
  retracted paper renders struck through.

- [ ] **T12** `/impl/<slug>/`, `/errata/`, `/cv/`
  <br>*Ships:* yes. *Validated by:* all routes 200. The CV form is real HTML, not
  `onsubmit="return false"`.

- [ ] **T13** Router deleted, anchors preserved, 404 page
  <br>*Ships:* yes. *Validated by:* zero `<script>` tags in `dist/`. Every anchor from
  the prototype resolves; scripted check over the list.

## Track 4: machine surface

- [ ] **T14** Three Atom feeds
  <br>*Ships:* yes. *Validated by:* W3C Feed Validator clean. Bump a version locally,
  the entry updates rather than duplicating.

- [ ] **T15** `llms.txt` and `llms-full.txt`, generated
  <br>*Ships:* yes. *Validated by:* diff the generated llms.txt against the
  handwritten handoff, every difference explainable.

- [ ] **T16** `index.json` and the `.md` mirrors
  <br>*Ships:* yes. *Validated by:* JSON parses, schema URL present, every paper
  carries confidence, state and expires.

- [ ] **T17** robots.txt, sitemap, Content Signals
  <br>*Ships:* yes. *Validated by:* sitemap validates, `lastmod` matches `revised` and
  not file mtime.

- [ ] **T18** JSON-LD and the CSP hash integration
  <br>*Ships:* yes. *Validated by:* Rich Results Test passes. Real browser, real
  domain, zero console CSP violations.

## Track 5: quality gates

- [ ] **T19** Budget scripts wired into `npm run check`
  <br>*Ships:* no. *Validated by:* add a fake webfont, check fails; remove, green.
  Index under 60 KB, CSS under 12 KB.

- [ ] **T20** Lighthouse CI and pa11y, both colour schemes
  <br>*Ships:* no. *Validated by:* LCP under 1.2 s on simulated 3G. AA contrast in
  light and dark. Tap targets pass. Print check by hand.

- [ ] **T21** Link check, errata check, expiry check
  <br>*Ships:* no. *Validated by:* change a confidence value with no errata file, PR
  fails; add the file, green.

## Track 6: the gate

- [ ] **T22** D1 database, migration, private R2 bucket
  <br>*Ships:* no. *Validated by:* migration applies, PDF uploaded, guessing the
  bucket URL from outside finds no route.

- [ ] **T23** `POST /api/cv`, no-JS acknowledgement page, Resend
  <br>*Ships:* yes. *Validated by:* real mail arrives. Acknowledgement page is
  byte-identical for valid, rate-limited and malformed addresses; diffed, not
  eyeballed.

- [ ] **T24** `GET /cv/<token>`, `_routes.json`, collision test
  <br>*Ships:* yes. *Validated by:* `/cv/` serves as a static asset, `/cv/deadbeef`
  hits the function and 410s.

- [ ] **T25** `/api/cv/forget` and the cron janitor Worker
  <br>*Ships:* yes. *Validated by:* forget deletes the rows, janitor runs on its
  trigger against a backdated row.

- [ ] **T26** Adversarial pass over the whole gate
  <br>*Ships:* no. *Validated by:* two simultaneous redeems give exactly one 200 and
  one 410. Expired token 410s. Limits trip at 4 and 61. Nothing in the logs is PII.

## Track 7: domains

- [ ] **T27** mosthofaimran.com cutover, mailboxes, Resend DNS
  <br>*Ships:* live. *Validated by:* apex and www resolve, `imran@` and `security@`
  both receive, SPF, DKIM and DMARC pass.

- [ ] **T28** johnefemer.com and imran.com.bd aliases
  <br>*Ships:* live. *Validated by:* both serve, canonical on every alias page names
  the primary, security.txt lists all three `Canonical` URIs.

- [ ] **T29** HSTS preload on the primary
  <br>*Ships:* live. *Validated by:* a week of clean serving first, then submit.
  Aliases stay unpreloaded.

## Track 8: signatures

- [ ] **T30** New key, pgp.asc, real fingerprints replace the placeholders
  <br>*Ships:* yes. *Validated by:* `gpg --recv-keys` against the published
  fingerprint returns the key.

- [ ] **T31** Sign the index draft and every paper, signed commits on
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
