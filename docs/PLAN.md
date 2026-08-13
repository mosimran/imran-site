# Build plan

Rev B, 13 August 2026.

The handoff in [intitial-handoff/](intitial-handoff/) is a complete single-file
prototype: one 82 KB document holding five views behind a hash router, plus a build
specification, two Atom feeds, an llms.txt, a robots.txt and a security.txt. It is a
good design. It is not yet a site.

This plan turns it into one: an Astro static build on Cloudflare Pages, every view a
real URL, the schema in `BUILD.md` section 2 enforced by the build, and the Section 6
résumé gate translated off Postgres and Redis onto D1 and R2 without losing a single
security property it claims.

- [1. Document identifier](#1-document-identifier)
- [2. Three domains](#2-three-domains)
- [3. Architecture](#3-architecture)
- [4. Repository layout](#4-repository-layout)
- [5. Route map](#5-route-map)
- [6. The gate, translated](#6-the-gate-translated)
- [7. SEO surface](#7-seo-surface)
- [8. Machine-reader surface](#8-machine-reader-surface)
- [9. Headers and CSP](#9-headers-and-csp)
- [10. Budgets and CI](#10-budgets-and-ci)
- [11. How each task runs](#11-how-each-task-runs)
- [12. Decisions on record](#12-decisions-on-record)
- [13. Only the owner can do these](#13-only-the-owner-can-do-these)
- [14. Audit: referenced but missing](#14-audit-referenced-but-missing)

---

## 1. Document identifier

The prototype calls itself RFC 0001. It does not ship under that name.

### 1.1 Why any RFC number is the wrong idea

- **It collides.** RFC 1 is Steve Crocker's "Host Software", April 1969. A document
  arguing for precision cannot open by taking the number of the most famous document
  in the series.
- **Every other number collides eventually.** The IETF is around RFC 9800 and issuing
  150 to 250 a year. Pick 9999 and it belongs to somebody else within about a year.
  There is no safe number, so the number is the wrong idea.
- **RFCs are immutable.** Once published they never change; a correction means a new
  number and an `Obsoletes` line. This site's central promise is the opposite:
  "revised in place, never quietly", same URL forever. The form fights the content.

### 1.2 The replacement

An Internet-Draft. The identifier format for an individual submission is
`draft-<surname>-<subject>-<NN>`, and every property of that document class matches
what this site already does.

| Internet-Draft property | What the site already does |
| --- | --- |
| Working document, revised in place | "A living document. Revised in place, never quietly." |
| Version suffix increments per revision | Appendix A has 4 entries. Paper 5.1 calls itself "rev 4". |
| Individual submission, not a consensus product | "Its normative language in Section 4 binds nobody but the author." |
| Expires 185 days after posting unless revised | Nothing yet. This is the part worth stealing, see 1.4. |
| Never collides with anything | The namespace is the author's surname. |

The index document becomes:

```
draft-imran-systems-and-arguments-03
```

Each position paper and implementation note gets its own draft name, so a quotation
can identify the exact revision it came from:

```
draft-imran-competence-porn-03
draft-imran-llm-gateway-01
draft-imran-algorithmic-homophily-05
```

### 1.3 The version number is already in the data

The suffix is `history.length - 1`, zero-padded to two digits. First publication is
`-00`. Nothing new to maintain and nothing that can drift, because it is computed at
build time in `src/lib/draft.ts`.

**Off-by-one, stated rather than hidden.** The prototype's footer says "rev 4" for
Competence Porn, which has 4 history entries. Internet-Drafts count from zero, so the
same document is `-03`. The two numbers disagree by one for the reason they always
disagree: one counts publications, the other counts revisions after the first. Use
`-03`, drop "rev 4" from the footer, and state the rule in the colophon so nobody has
to work it out.

### 1.4 Expiry, the part that does real work

A real Internet-Draft expires 185 days after it is posted. That single rule is the
most useful thing the form offers a site whose argument is that unrevised claims
decay, and the RFC framing could not express it at all.

- `Expires` is computed as `revised + 185 days` and printed in the masthead of every
  document.
- A paper past its expiry says so on its own face, above the abstract. Not hidden, not
  `noindex`ed, not deleted. Just labelled.
- CI warns at 30 days out, so the list of things going stale arrives before they do.
- The date ships in `index.json`, the feeds and the JSON-LD, so a machine reader gets
  it alongside `confidence`.

Expiry is derived, not a fifth `state`. A paper can be *holding* and expired at once,
and that combination is exactly the interesting one: a claim you still believe and
have not looked at in six months.

### 1.5 The masthead

Before:

```
Off the Bit
Request for Comments: 0001
Category: Informational
ISSN: not assigned, deliberately
Obsoletes: every CV I have written
Updates: your priors, if it earns it
```

After:

```
Off the Bit
Internet-Draft
draft-imran-systems-and-arguments-03
Intended status: Informational
Expires: 12 February 2027
Obsoletes: every CV I have written
Updates: your priors, if it earns it
```

**Do not impersonate the IETF.** Keep "Off the Bit" where a real draft says "Network
Working Group", and do not paste the standard I-D boilerplate about IETF working
documents, because it would be false. The prototype's Status of This Memo is already
the right instinct; it gains one sentence saying the form is borrowed and the document
has no standing with the IETF. Borrowing a document form is a stylistic choice.
Claiming its provenance is a lie, and on this site of all sites.

### 1.6 Knock-on changes

| Surface | Change |
| --- | --- |
| URLs | **None.** `/papers/competence-porn` stays fixed while the suffix moves from `-03` to `-04`. That separation is the whole reason the identifier can carry a version. |
| Section numbers | Kept. Section 5.1 says where a paper sits in the index; the draft name says which document and which revision. Different questions, both worth answering. |
| `<title>` | Stays human-first: "Mosthofa Imran: Systems, Arguments, and Known Failure Modes". A slug leading the SERP row helps nobody. The identifier goes in the masthead and in JSON-LD `alternateName`. |
| Running head | Full identifier on desktop, `Internet-Draft` on narrow screens. The bar is 46 px and the name is 36 characters. |
| Feed entry titles | `draft-imran-competence-porn-03: Competence Porn` |
| Feed entry IDs | **Must not include the version.** `tag:mosthofaimran.com,2025:papers/competence-porn` stays keyed to the slug. Put the suffix in and every revision spawns a duplicate entry in every reader. |
| Signatures | `/papers/competence-porn-03.md.asc`. Versioned, because a signature is over exact bytes and the bytes change. |

Runner-up, for the record: continue the Internet Experiment Notes series, which ran
1977 to 1982 and stopped at IEN 207, making this IEN 208. Elegant, genuinely
unclaimed, and rejected because it cannot express a revision and needs a paragraph of
explanation before the joke lands.

---

## 2. Three domains

| Host | Role | Behaviour |
| --- | --- | --- |
| `mosthofaimran.com` | Canonical | Serves. Indexed. Every canonical, feed ID, mailbox and signature URL points here. All content was written against it. |
| `johnefemer.com` | Alias | Serves identical bytes. Canonical in the HTML points at the primary. |
| `imran.com.bd` | Alias | Same. Long DNS lead time, see 2.2. |
| `www.*` (all three) | Redirect | 301 to their own apex, then the alias rules apply. |

### 2.1 How aliasing works here

One Cloudflare Pages project accepts all three as custom domains. Nothing in the
application is host-aware, and nothing needs to be: the canonical tag is baked into
the HTML at build time from `astro.config.mjs`, so whichever host delivered the bytes,
the page still names `mosthofaimran.com` as the original. Search engines consolidate
on that. This is the textbook use of cross-domain canonical.

**The trap worth naming.** The obvious instinct is to also put
`X-Robots-Tag: noindex` on the alias hosts, belt and braces. Do not. A page that is
`noindex` and also canonicalises to another URL can propagate that `noindex` to the
canonical target, which would deindex the primary site. Pick one mechanism.
Cross-domain canonical alone is the correct one, and it is what the aliases get.

If the aliases should not serve at all, the flip is a single Redirect Rule per alias
zone sending everything to the primary with a 301. That eliminates duplicate content
entirely at the cost of the alias disappearing from the address bar. Serving is the
current decision; the alternative is one rule away at any point.

### 2.2 Details that bite

- ~~**`.com.bd` has a long lead time.**~~ **Resolved, T00 cancelled.** `imran.com.bd`
  was already an active Cloudflare zone in the John Efemer account. No BTCL work is
  needed. The domain is attached to the Pages project and serving.
- **security.txt lists all three.** RFC 9116 wants a `Canonical` line for every URI the
  file is reachable at, so three lines, not one. A scanner that fetches it from an
  alias and finds only the primary listed treats the file as untrustworthy.
- **The CV gate is host-agnostic.** A form posted from `johnefemer.com` hits `/api/cv`
  on that host, and the mailed link points at the primary. `form-action 'self'`
  permits exactly this and nothing else.
- **Sitemaps list primary URLs only.** robots.txt is served on all three and points at
  the one sitemap.
- **HSTS preload is close to irreversible.** Primary only, and only after a week of
  clean serving. Aliases get HSTS without preload until the domains are certain.
- **Three zones, free plan, no cost.** Each alias needs its nameservers at Cloudflare
  for apex support.

---

## 3. Architecture

The whole reading path is files on a CDN. One small function handles the only thing
that cannot be a file, so the gate failing cannot take the document down.

| Layer | Choice | Why |
| --- | --- | --- |
| Generator | Astro 5, `output: 'static'` | Content collections with Zod give the `BUILD.md` section 2 schema enforced at build. A paper without `retires` fails `npm run build`. |
| Content | Markdown plus `@astrojs/mdx` | Papers stay plain Markdown so the mirrors and signatures cover the real source. |
| Hosting | Cloudflare Pages | Three custom domains on one project. `_headers` and `_redirects` honoured natively. |
| Gate runtime | Pages Functions | Scoped to two paths via `_routes.json` so nothing else invokes a function. |
| Token store | D1 | Supports `UPDATE ... RETURNING`, the single-atomic-burn primitive. KV cannot do it. |
| PDF store | R2, private | No public bucket URL, no signed link. The function streams it. |
| Mail | Resend | MailChannels' free Workers relay closed in 2024. Resend's free tier covers this and verifies the domain with SPF, DKIM and DMARC. |
| Retention | Cron Worker | Pages Functions have no scheduled handler. A short Worker on a daily trigger executes the 12-month delete section 6.4 promises. |
| CI/CD | Actions then wrangler | Checks first, deploy only on green. Native Pages Git integration stays off so a failing check cannot ship. |

Cloudflare now steers new projects toward Workers with static assets rather than
Pages. Pages is the decision here, it is stable, and it handles this shape well. If
the site and the gate should ever become one Worker with one deploy, the migration is
mostly moving `functions/` to a single fetch handler. Nothing in this plan forecloses
it.

---

## 4. Repository layout

```
imran-site/
├─ src/
│  ├─ content/
│  │  ├─ config.ts            # Zod schema, BUILD.md section 2, plus derived expiry
│  │  ├─ papers/              # 14 papers
│  │  ├─ impl/                # 5 implementation notes
│  │  └─ errata/              # 4 entries
│  ├─ layouts/                # Rfc, Paper, Impl
│  ├─ components/             # Head, JsonLd, Masthead
│  ├─ pages/                  # see section 5
│  ├─ lib/
│  │  ├─ draft.ts             # identifier, version and expiry, section 1
│  │  ├─ ld.ts                # JSON-LD builders
│  │  └─ text.ts              # markdown to plain text
│  └─ styles/rfc.css          # lifted verbatim from the prototype
├─ public/
│  ├─ _headers  _redirects  _routes.json
│  ├─ robots.txt  pgp.asc
│  ├─ .well-known/security.txt
│  └─ papers/*.md, *-NN.md.asc
├─ functions/
│  ├─ api/cv.ts   api/cv/forget.ts
│  └─ cv/[token].ts
├─ workers/cv-janitor/        # daily cron, retention delete
├─ scripts/
│  ├─ check-errata.mjs  check-budget.mjs  check-expiry.mjs
│  ├─ placeholders.mjs
│  └─ worklog.mjs             # appends a templated entry, section 11
├─ integrations/csp-hashes.ts
├─ docs/
│  ├─ PLAN.md  TASKS.md  WORKLOG.md  PLACEHOLDERS.md
│  └─ intitial-handoff/       # preserved, untouched
├─ .github/workflows/deploy.yml
├─ migrations/0001_cv_token.sql
└─ wrangler.toml  astro.config.mjs
```

---

## 5. Route map

Every view in the prototype becomes a real page. The hash router does not survive into
`dist/`.

| URL | Source | Notes |
| --- | --- | --- |
| `/` | `pages/index.astro` | The index draft. Sections 1 to 14 and appendices. |
| `/papers/` | `papers/index.astro` | Section 5 complete, sorted by confidence. |
| `/papers/<slug>/` | `papers/[slug].astro` | 14 pages. URL never changes as the version suffix moves. |
| `/papers/<slug>.md` | `papers/[slug].md.ts` | Canonical Markdown. What the signature covers. |
| `/papers/index.json` | `papers/index.json.ts` | Versioned envelope. Referenced in three places today, missing from the handoff. |
| `/impl/<slug>/` | `impl/[slug].astro` | 5 notes. Slugs already fixed by llms.txt. |
| `/impl/<slug>.md` | `impl/[slug].md.ts` | As above. |
| `/errata/` | `errata/index.astro` | Section 7 as a page. `/#s7` keeps working. |
| `/cv/` | `pages/cv.astro` | Static. Excluded from Functions routing. |
| `/feed.xml` | `feed.xml.ts` | Papers and notes. |
| `/errata.xml` | `errata.xml.ts` | Corrections only. |
| `/revisions.xml` | `revisions.xml.ts` | Built from each paper's `history`. |
| `/llms.txt` | `llms.txt.ts` | Generated from collections, so it cannot drift. |
| `/llms-full.txt` | `llms-full.txt.ts` | All papers and notes, front matter preserved. |
| `/sitemap-index.xml` | `@astrojs/sitemap` | `lastmod` from `revised`, not file mtime. |
| `/404` | `pages/404.astro` | Same document furniture, no apology. |
| `/api/cv` | `functions/api/cv.ts` | POST, form-encoded, always 202. |
| `/api/cv/forget` | `functions/api/cv/forget.ts` | POST, same-day deletion. |
| `/cv/<token>` | `functions/cv/[token].ts` | 200 with the PDF, or 410 Gone. |

**Collision, handled at T24.** The static page `/cv/` and the function route
`/cv/<token>` share a prefix. `_routes.json` includes `/api/*` and `/cv/*`, then
explicitly excludes `/cv/` and `/cv/index.html`. Excludes win, so the page is a static
asset and only a real token path wakes a function. Getting it wrong means either a
broken page or a function invoked on every visit, so it gets its own test.

---

## 6. The gate, translated

`BUILD.md` section 4 specifies Fastify, PostgreSQL and Redis, none of which run on
Cloudflare. Every property in its section 4.3 table survives the translation. The
interesting part is that Redis disappears rather than being replaced.

### 6.1 Schema and the burn

```sql
CREATE TABLE cv_token (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  token_hash  BLOB    NOT NULL UNIQUE,  -- sha256; the raw token is never stored
  email       TEXT    NOT NULL,         -- lowercased at insert; SQLite has no CITEXT
  issued_at   INTEGER NOT NULL,         -- unix seconds
  expires_at  INTEGER NOT NULL,
  redeemed_at INTEGER,
  src_net     TEXT,                     -- truncated to /24 before insert
  revoked     INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX cv_token_email  ON cv_token (email, issued_at);
CREATE INDEX cv_token_net    ON cv_token (src_net, issued_at);
CREATE INDEX cv_token_expiry ON cv_token (expires_at) WHERE redeemed_at IS NULL;

-- single atomic burn: two simultaneous requests, exactly one winner
UPDATE cv_token SET redeemed_at = unixepoch()
 WHERE token_hash = ?1 AND redeemed_at IS NULL
   AND revoked = 0 AND expires_at > unixepoch()
 RETURNING id, email;
```

### 6.2 Rate limiting without Redis

The table already records `email`, `src_net` and `issued_at`, so both limits are
indexed counting queries rather than a second datastore.

```sql
-- three per address per day
SELECT count(*) FROM cv_token WHERE email = ?1   AND issued_at > ?2;
-- sixty per source network per hour
SELECT count(*) FROM cv_token WHERE src_net = ?1 AND issued_at > ?2;
```

One behavioural difference, stated rather than hidden: a Redis counter counts
*attempts*, this counts *issued tokens*, so malformed addresses are uncounted. They
also send no mail, so the limit that matters is unaffected. Cloudflare's Rate Limiting
binding sits in front as the cheap outer guard, which restores attempt-counting at the
edge.

### 6.3 Properties preserved

| Property | Spec mechanism | Here |
| --- | --- | --- |
| Token unguessable | 256-bit CSPRNG | `crypto.getRandomValues`, 32 bytes, base64url |
| Breach does not leak links | Store SHA-256 only | `crypto.subtle.digest` into a BLOB |
| Single use under concurrency | Atomic UPDATE RETURNING | Same statement, D1 |
| No enumeration oracle | Always 202 | Same, one identical HTML acknowledgement regardless of outcome |
| Not indexable | X-Robots-Tag, robots.txt | `_headers` rule on `/cv/*` plus the header in the response |
| No object storage leak | App streams the PDF | R2 private binding, streamed |
| Retention honoured | Daily DELETE plus forget | Cron Worker plus `/api/cv/forget` |
| One tenant cannot spend the budget | Two limit dimensions | Address and /24, plus the edge rate limiter |

### 6.4 The constraint the prototype hides

The form is `<form onsubmit="return false">` with no handler, and the budget is zero
bytes of JavaScript in the reading path. Those two facts together mean production
needs a plain `<form method="post" action="/api/cv">`, and the function must accept
`application/x-www-form-urlencoded` and reply with an HTML acknowledgement page, not a
JSON body. A JSON 202 rendered as raw text in the browser would be the site's first
broken promise.

The acknowledgement must be byte-identical for a valid address, a rate-limited one and
a malformed one, or it becomes the enumeration oracle section 4.3 promises it is not.
`form-action 'self'` in the CSP already permits exactly this and nothing else.

---

## 7. SEO surface

| Element | Implementation |
| --- | --- |
| Canonical | Absolute, always the primary host, baked at build. One URL form: lowercase, trailing slash, apex. This is what makes the aliases in section 2 safe. |
| Titles | Human-first, section number as prefix: "5.1 Competence Porn". Never the draft slug, see 1.6. |
| Open Graph | Full set, with `article:published_time` and `article:modified_time` on papers. |
| Social images | Built with satori and resvg into static PNGs carrying section number, title, confidence, state and expiry. Font embedded at build only, so the zero-webfont rule holds for the page. |
| JSON-LD | `WebSite` and `Person` on the index; `TechArticle` per paper with `alternateName` (the draft identifier), `datePublished`, `dateModified`, `expires`, `license`, `citation` from `seeAlso`, and `additionalProperty` for `confidence` and `state`. |
| Sitemap | `lastmod` from `revised`, so a reformat cannot claim a revision. Primary URLs only. |
| Retracted papers | Stay indexed, retraction in the description. Nothing is `noindex`ed except `/cv/*`. Section 2.2 says nothing is deleted, and hiding a retraction from search would break that. |
| Anchors | `#s1` to `#s14`, `#sa`, `#sb`, `#toc`, `#s93` all preserved, tested at T13. |

---

## 8. Machine-reader surface

Open to all crawlers, with the attribution request stated everywhere a machine might
look for terms.

```
# robots.txt
User-agent: *
Content-Signal: search=yes, ai-input=yes, ai-train=yes
Allow: /
Disallow: /cv/
Disallow: /api/

User-agent: GPTBot
User-agent: ClaudeBot
User-agent: PerplexityBot
User-agent: Google-Extended
User-agent: Applebot-Extended
User-agent: CCBot
Allow: /

Sitemap: https://mosthofaimran.com/sitemap-index.xml
```

Named allows are redundant against `User-agent: *`, and stated anyway so the policy is
legible rather than inferred.

The attribution ask is not expressible as a directive, so it travels three ways: in
prose at the top of `llms.txt`, in `usageInfo` on every JSON-LD node, and as a header
on every response.

```
Link: <https://creativecommons.org/licenses/by/4.0/>; rel="license"
```

**The rule that matters.** Every machine-readable artefact carries `confidence`,
`state` and `expires` in the same object as the claim. A model reading `index.json`,
`llms-full.txt` or the JSON-LD cannot get the claim without the numbers attached. That
is the strongest available form of the request the site makes in section 9.2, enforced
by the generator rather than asked for in a sentence.

---

## 9. Headers and CSP

```
# public/_headers
/*
  Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
  Content-Security-Policy: default-src 'none'; img-src 'self'; style-src 'self';
    base-uri 'none'; form-action 'self'; frame-ancestors 'none'
  X-Content-Type-Options: nosniff
  Referrer-Policy: no-referrer
  Permissions-Policy: interest-cohort=(), geolocation=(), camera=(), microphone=()
  Link: <https://creativecommons.org/licenses/by/4.0/>; rel="license"

/cv/*
  X-Robots-Tag: noindex, nofollow, noarchive
  Cache-Control: no-store, private
```

### 9.1 The JSON-LD conflict

The spec's CSP has no `script-src`, so `default-src 'none'` governs. But `script-src`
applies to every `<script>` element including `type="application/ld+json"` data
blocks, which are not executed but are still blocked and still fire a violation.
Strict CSP and structured data are in direct tension.

Resolution: an Astro integration hooks `astro:build:done`, computes the SHA-256 of
each page's JSON-LD block, and appends a per-path `script-src 'sha256-...'` rule to
`_headers`. The policy stays strict, the structured data validates, and the browser
console stays clean. The fallback, if that proves fragile, is `script-src 'none'` and
a console warning, since crawlers parse JSON-LD from source and do not enforce CSP.

`_headers` applies per path, not per host, which is fine: all three domains want
identical headers. Anything host-specific would need a zone-level Transform Rule, and
section 2.1 explains why the one you would reach for first is the one to avoid.

### 9.2 Redirects

```
# public/_redirects
https://www.mosthofaimran.com/*  https://mosthofaimran.com/:splat  301
/sitemap.xml                     /sitemap-index.xml                301
/papers/index.html               /papers/                          301
```

The sitemap redirect exists because robots.txt in the handoff advertises
`/sitemap.xml` and Astro emits an index file. Cheaper to redirect than to break a
published URL.

---

## 10. Budgets and CI

Every row in `BUILD.md` section 6 becomes a check that fails the build. A budget
nobody enforces is a preference.

| Budget | Limit | Enforced by |
| --- | --- | --- |
| Index HTML, uncompressed | under 60 KB | `check-budget.mjs`. The prototype is 82 KB but that is five views in one file. |
| CSS, one file, inlined | under 12 KB | Same script. |
| JS in the reading path | 0 bytes | Fails on any `<script>` that is not `application/ld+json`. |
| Third-party requests | 0 | Fails on any off-origin `src`, `href` or `url()`, excepting `rel=license` and prose references. |
| Webfonts | 0 | Fails on any `@font-face`. |
| LCP on 3G | under 1.2 s | Lighthouse CI, simulated slow 3G, index plus one paper. |
| Contrast, both schemes | AA | axe-core via pa11y-ci, run twice with the colour scheme forced. |
| Tap targets | 44 px | Lighthouse assertion. |
| Print | renders | Manual, once, at T20. Not automatable and not worth pretending otherwise. |

Beyond the budget table:

- **Schema.** A paper with no `retires`, a retracted paper with no `retraction`, or a
  draft claiming confidence above 0.7, each fail the build.
- **Errata.** If any paper's `confidence` or `state` differs from `origin/main` and no
  file was added under `src/content/errata/`, the PR fails. Changing a published claim
  silently is the one thing this site exists not to do.
- **Expiry.** `check-expiry.mjs` warns for anything within 30 days of its 185-day
  window, per section 1.4. Warns, never fails; an expired paper is a fact about the
  paper, not a broken build.
- **Links.** lychee over `dist/`, internal fatal, external warn.
- **Routing.** Asserts `/cv/` is a static asset and `/cv/deadbeef` reaches the
  function and returns 410.
- **Placeholders.** Reports the ledger count. Reports, does not fail, per the decision
  in section 12.

---

## 11. How each task runs

One task, validated, deployed, logged, then stop and report. Nothing starts before the
previous thing is live and checked. The loop is nine steps and it does not vary.

```
1  branch     git switch -c t07-papers-migrated
2  build      the one thing, nothing adjacent
3  validate   run the named check; capture the output
4  PR         title "T07 papers migrated", body is the log entry
5  CI         must be green, no overrides
6  merge      squash to main
7  deploy     Actions ships it; capture the URL
8  log        npm run worklog appends the entry; close the issue
9  stop       report back, wait for go
```

### 11.1 Why a PR per task and not a commit

The errata check diffs against `origin/main`, so it needs a branch to be meaningful.
Squash-merging gives one commit per task on `main`, which makes the history and the
work log the same list. The PR body and the log entry are the same text, written once.

### 11.2 The work log

`docs/WORKLOG.md`, append-only, newest last. One entry per task, generated by
`npm run worklog` so the shape never drifts. Four fixed fields: what changed, what was
validated and how, what is live, what is next.

The "Validated" field records the check that was actually run, including deliberate
failures. A log entry that only says what was built is a changelog, and there is
already a changelog.

### 11.3 Issues and visibility

- All 31 issues created in bulk at T01, one per task, labelled by track and grouped
  into one milestone.
- Commit subjects reference them: `T07: papers migrated (#7)`.
- Issues close on merge via `Closes #7` in the PR body, so the board moves without
  extra effort.
- The milestone burndown is the honest progress bar, and it is public on the repo.

Late in the build, `WORKLOG.md` becomes the source for Appendix A, Document History.
The document's own revision log and the repository's work log are the same record kept
once.

### 11.4 When a task fails validation

The branch stays open, the log entry still gets written with what failed and why, and
the next task does not start. A journey that only records successes is the thing
Section 7 of the site exists to argue against.

---

## 12. Decisions on record

| Decision | Choice | Consequence |
| --- | --- | --- |
| Domain | mosthofaimran.com, owned | Canonical origin hard-coded through `astro.config.mjs`. Feed IDs, llms.txt links, security.txt and JSON-LD all derive from it. |
| Aliases | johnefemer.com, imran.com.bd | Serve identical bytes, canonical to the primary. No `noindex`, see 2.1. |
| Content | Prototype ships as-is | No build gate on placeholders. A ledger plus `npm run placeholders` keeps replacement cheap and visible rather than blocking launch. |
| Section 6 | Gate built now | Pages Functions, D1, R2, Resend, plus one cron Worker. Two deployables. |
| AI policy | Open, attribution asked | Named crawlers explicitly allowed, `ai-train=yes`, the confidence-carrying request in three places. |
| Naming | Internet-Draft | See section 1. |
| Cadence | One validated task at a time | See section 11 and `TASKS.md`. |

Carried forward, not re-argued: Section 7 credits corrections to A. Rahman, K. Osei
and S. Datta, and those entries publish with the rest. They are the first rows of the
ledger in `PLACEHOLDERS.md` so they are trivial to swap the moment real corrections
arrive.

---

## 13. Only the owner can do these

### 13.1 GitHub access, blocking T01 push

The CLI is authenticated as `johnefemer`. Device flow, needs a human once:

```bash
gh auth login --hostname github.com --git-protocol https --web \
  --scopes repo,workflow,read:org

gh auth switch --user mosimran
```

The repo's local identity is already set to
`Mosthofa Imran <266519494+mosimran@users.noreply.github.com>`. The GitHub noreply
form attributes commits correctly without putting a personal or employer address in
every commit. `imran@kensink.com` is the public address on the account, and it is an
employer identity that this document is explicitly not.

### 13.2 Domains

- **T00, start today:** the BTCL delegation request for `imran.com.bd`. Longest lead
  time in the plan.
- Confirm `johnefemer.com` is registered and its nameservers can move to Cloudflare.
- Nameserver moves for all three, at T27 and T28.

### 13.3 Cloudflare and Resend

Settled at T03:

| | |
| --- | --- |
| Account | `John Efemer` |
| Account ID | `f697cce1cf00f8132c900d2c643ad935` |
| Pages project | `imran-site` |
| Production URL | https://imran-site.pages.dev |

The account is close to permanent. Pages, D1, R2 and all three domain zones have to
sit in one account, and moving later means recreating the database and re-verifying
DNS.

**Token gap.** The existing wrangler OAuth session carries `pages`, `d1`, `workers`
and `zone (read)`. It has **no `r2` scope**, which T22 needs, and `zone (read)` is
likely insufficient for creating DNS records at T27. Re-authorise or mint a scoped API
token before either.

- An API token scoped to Pages Edit, D1 Edit, R2 Edit, Workers Scripts Edit, into
  Actions secrets as `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`.
- Resend account, primary domain verified, key into Pages secrets as
  `RESEND_API_KEY`.
- Sending address: `no-reply@` contradicts section 6.5, which promises replies.
  `imran@` is the consistent choice.

### 13.4 Signing key

The only key on the machine is `rsa3072/D7F30DDA5DE57D56` for `imran@mevrik.com`.
Either add a `mosthofaimran.com` UID or generate a fresh Ed25519 key. Fresh is
cleaner: the existing key is an employer identity and this document is explicitly not
that.

### 13.5 The résumé PDF

Needed at T22. It never lands in the repo or in `public/`; it goes straight to the
private R2 bucket. `.gitignore` already carries a `*.pdf` rule as a guard against a
reflexive `git add -A`.

---

## 14. Audit: referenced but missing

Twelve URLs are advertised across the prototype, llms.txt, robots.txt and security.txt
that do not exist in the handoff. Each is a 404 the day the site ships unless it is
built.

| URL | Advertised in | Task | Note |
| --- | --- | --- | --- |
| `/llms-full.txt` | index 9.2, llms.txt | T15 | Generated |
| `/papers/index.json` | index 9.1, llms.txt | T16 | Generated |
| `/revisions.xml` | index 9.1, llms.txt | T14 | From each paper's `history` |
| `/sitemap.xml` | robots.txt | T17 | 301 to the sitemap index |
| `/pgp.asc` | index 9.3, 14, security.txt | T30 | Needs a real key |
| `/rfc0001.md.asc` | index signature block | T31 | Renamed under section 1 to `/draft-imran-systems-and-arguments-03.md.asc` |
| `/papers/*.md` | index 9.3 curl example | T16 | Generated |
| `/papers/*.md.asc` | index 9.3, feed.xml | T31 | Versioned filenames |
| `/impl/*`, 5 slugs | llms.txt | T12 | Built |
| `/papers/*`, 9 slugs | llms.txt, feed.xml | T11 | Built |
| `security@...` | security.txt | T27 | Mailbox must exist |
| `github.com/mosthofaimran` | index 14 | T10 | **Wrong handle, dead link.** Anchor text says `mosthofaimran`, the `href` is bare `https://github.com/`, the account is `mosimran`. |

Two content inconsistencies found in the same pass, tracked in `PLACEHOLDERS.md`:

- The index claims "34 papers, 3 retracted". The sources between them list 14 and 1.
- Paper 5.1's footer says "rev 4" against 4 history entries, which is `-03` under the
  identifier scheme in section 1.3.
