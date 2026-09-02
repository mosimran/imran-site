# Placeholder ledger

The handoff prototype carries illustrative content. The decision on record is that it
ships as-is and gets replaced afterwards, so this file is a tracked-debt register
rather than a launch gate. `npm run placeholders` reports the open count; it never
fails a build.

Ordered by how visible the eventual correction would be. Tick the box when the real
thing lands, and leave the row in place: this file follows the same rule as Section 7
of the site, where nothing is deleted.

---

## High: identity and attribution

- [ ] **P01** Errata 7.1 credited to A. Rahman and K. Osei
  <br>`index §7`, `errata.xml`. Corrections attributed to named people who did not
  send them. First thing to swap when a real correction arrives.

- [ ] **P02** Errata 7.4 credited to S. Datta
  <br>`index §7`, `errata.xml`. Same.

- [x] **P03** OpenPGP fingerprint `REPL ACEM EWIT HREA LFIN GERP RINT 0000 0000 0000`
  <br>`index §9.3`. Closed by T30.

- [x] **P04** SSH signing fingerprint `SHA256:replace-with-real-ssh-signing-key-fingerprint`
  <br>`index §9.3`. Closed by T30.

- [x] **P05** The PGP signature block, currently dotted filler
  <br>`index`, signature section. Closed by T31.

- [x] **P19** Attribution of the paper bodies
  <br>`src/content/papers/*`. Raised as an open question when the fourteen bodies were
  written on 2026-08-14. Closed the same day by the author: this is a personal site, the
  positions in Section 5 are his, and they are attributed to him as they already were in
  the masthead, the JSON-LD and the feed. No disclosure row, no Appendix B note.
  <br>The reading pass over the fourteen bodies is tracked separately as issue #39. It is
  ordinary editorial work rather than a placeholder, so it does not belong in this file.

## Medium: figures and claims

- [ ] **P06** Errata 7.3, the June 2025 ingest incident
  <br>`index §7`, `errata.xml`. A self-correction describing an incident and a
  postmortem.

- [ ] **P07** Errata 7.2, the 5.10 retraction
  <br>`index §7`, `errata.xml`.

- [ ] **P08** Section 3 figures
  <br>40M events/day, 3 regulated tenants, 3.1M calls/day, p99 overhead 180 ms, 89%
  fewer nodes, p99 340 ms to 11 ms, 14B rows, query p95 9.4 s to 380 ms, 6 sites, 0
  failed installs since 2024-09.
  <br>`index §3`, `llms.txt`, `feed.xml`. The handoff's own `BUILD.md` section 8 says
  to replace every one of these with a number defensible in an interview.
  <br>**2026-09-02: 3.1 is done, 3.2 through 3.5 remain.** The Mevrik note was written from
  source material supplied by the owner, and its two invented figures (40M events/day, 3
  regulated tenants) are replaced with measured ones. Erratum 7.11.
  <br>**The stack was incomplete, not invented, and this row said otherwise for part of a day.**
  ClickHouse and MinIO are in the platform. The denial was inferred from one document about a
  future rebuild and from a résumé read as an exhaustive inventory, and neither supports it.
  Erratum 7.12. The lesson for the remaining rows is that a stack is confirmed by asking the
  owner, not by grepping a document for absence.
  <br>The note also introduces a distinction this row should carry from here: it separates
  **measurements** from **design targets** and labels each. Latency and throughput numbers in
  it are targets the build is held to and are marked as such. A target published as a
  measurement is the same defect as an invented figure, wearing better clothes.

- [ ] **P09** Implementation 3.2 measurements
  <br>41 ms / 180 ms gateway overhead, 14 ms redaction, 0.31% failover, falls over at
  ~11k rps.
  <br>`impl/llm-gateway §4`.

- [ ] **P10** Paper count inconsistency
  <br>The index claims "34 papers, 3 retracted"; the sources between them list 14 and
  1. Closed by T09, which makes the count generated from the collection so it cannot
  disagree with itself again.

- [ ] **P11** Bodies missing for 4 of 19 documents
  <br>Was 17 of 19. All fourteen papers in Section 5 now carry a body, at least one
  figure and retirement conditions, written 2026-08-14 and recorded in erratum 7.5.
  Implementation notes 3.1, 3.3, 3.4 and 3.5 still carry front matter only; note 3.2 has
  a full body. Nothing is invented to fill the remaining four.
  <br>**2026-08-31: now 5 of 22.** Papers 5.15 and 5.16 arrived with full bodies;
  implementation note 3.6 arrived without one, for the reason recorded at P22.

- [ ] **P20** Publication dates and revision histories on papers 5.2 through 5.14
  <br>`src/content/papers/*`. The `published` dates and the pre-2026-08-14 history rows
  are the prototype's illustrative dates, carried forward so that the index, the home
  page and erratum 7.1 continue to agree with each other. The `revised` dates are real:
  every paper was substantively revised on 2026-08-14 and says so in its own revision
  history. Swap the publication dates for real ones, or drop the field and let the
  masthead say the text has no recorded first publication.

## Contradicted by the real CV

Found when the résumé PDF was checked before upload, 2026-08-13. The site carries the
prototype's illustrative biography; the CV carries the real one. Both are handed to the
same reader, so they cannot disagree.

Rechecked 2026-08-31 against the current résumé and covering letter, which are not the
documents this section was first written against. Three of the four rows changed. The
old reading stays on each row: this file does not delete, for the same reason Section 7
does not.

- [x] **P15** Location: site says "Dhaka, Bangladesh (UTC+6)", CV says Kuala Lumpur
  <br>`index §14`, masthead, `llms.txt`, `security.txt` languages, the OG card.
  The timezone claim about overlapping with CET mornings and US Pacific evenings is
  computed from the wrong city.
  <br>**Closed 2026-08-31, by the CV changing rather than the site.** The current résumé
  and covering letter both say Dhaka, Bangladesh, and the letter says so twice. The site
  was right. UTC+6 and the overlap claim stand as published.

- [x] **P16** Tenure: site says "Eleven years of production engineering", CV says 15+
  <br>`index` abstract.
  <br>**2026-08-31: the gap grew.** The current résumé opens with "seventeen years", so the
  two documents are now six years apart rather than four. Only the owner knows which number
  is the stale one. Moving it changes a published claim and needs erratum 7.7.
  <br>**Closed 2026-08-31 by the author.** Eleven was wrong; the career spans fifteen years
  and more. The abstract now reads "Over fifteen years of production engineering", which is
  true and does not contradict the résumé's seventeen. Recorded as erratum 7.7.

- [x] **P17** Title: site says "Lead Solutions Architect", CV says "Senior AI Engineering
  and Delivery Leader"
  <br>masthead, `index §14`, `llms.txt`, the OG card, the email signature.
  <br>**2026-08-31: the CV's title changed again.** It now reads "Chief Technology Officer"
  in the header and "Head of Engineering and Delivery, 2022 to present" in the experience
  section, which are a positioning statement and a job title respectively. The site carries
  a third string. One erratum, owner's call.
  <br>**Corrected 2026-08-31: eight places, not six.** Counted mechanically rather than from
  memory. `index.astro` masthead, `index.astro` §14 Role row, the meta description, the
  `og:image:alt`, the `twitter:image:alt`, `lib/ld.ts` `jobTitle` in the JSON-LD,
  `llms.txt.ts`, and the text baked into the share card by `scripts/make-social.mjs`. The
  card is the one that needs a regeneration rather than an edit.
  <br>**Closed 2026-09-01.** The site now reads "Head of Engineering and Delivery" in all
  eight places, which is the résumé's own title and needs no interpretation to defend.
  "Lead AI Solutions Engineer" was offered by the author and rejected in discussion: Solutions
  Engineer conventionally denotes pre-sales, and Section 3 describes architecture, delivery and
  reliability ownership. Recorded as erratum 7.9.
  <br>**Still open after the 2026-08-31 pass.** The tenure figure beside it was corrected
  that day and this one was not, because only the tenure correction was supplied. Erratum
  7.7 says so on its own face rather than leaving the omission to be noticed.

- [ ] **P18** Employer and scale: CV names Mevrik (UK) and ~3M conversations per month;
  site §3.1 claims 40M events/day and §3.2 claims 3.1M calls/day
  <br>Different units, so not necessarily a contradiction, but they read as one.
  <br>**2026-08-31: unchanged and still unreconciled.** The current résumé keeps three
  million conversations a month, adds 99.9 percent availability and mean time to recovery
  under thirty minutes, neither of which appears on the site. Note 3.1 is the place to
  reconcile all of it at once, and that is a P08 job.

## Compliance thread, opened 2026-08-31

- [ ] **P21** Confidence values on papers 5.15 and 5.16
  <br>`src/content/papers/soc2-120-days.md`, `soc2-scope-hack.md`. Set to 0.65 and 0.60 by
  the drafter, which is a category error: a confidence value is the author's credence and
  nobody else can hold it for him. Both are low enough that the schema classes them as
  drafts, so nothing is overclaimed while this row is open. Owner to confirm or move.
  <br>**2026-08-31, later the same day:** section 8 of 5.15 was strengthened by the author,
  who has worked on compliance alongside partner organisations holding signed Type II
  reports. The evidence base under the paper is therefore wider than it was when 0.65 was
  set, and 0.65 was deliberately left unmoved: a confidence value is the author's to raise,
  not the drafter's. This row is now the reason the number may be too low rather than too
  high.

- [ ] **P22** Measurements and failure modes for implementation 3.6
  <br>`src/content/impl/compliance-evidence.md`. The note is `unwritten` because the
  résumé supplies the frameworks and none of the numbers. It stays unwritten until an audit
  programme produces figures that would survive an interview. Nothing is invented to fill
  the row.

- [x] **P23** The share card's draft identifier drifted from the document's
  <br>`public/og-cover.jpg`, `public/og-cover.webp`, `scripts/make-social.mjs`. The card
  carried `draft-imran-systems-and-arguments-03` while the document had reached `-05`. The
  identifier was typed into the card generator instead of derived, and the generator is
  hand-run because it needs macOS system fonts. Found on 2026-08-31 while validating the
  masthead. Closed the same day: the generator now reads the identifier out of
  `dist/index.html`, stamps what it used, and `scripts/check-social.mjs` fails the build if
  the stamp and the document disagree. The failure path was proven before the fix was
  trusted.

- [x] **P24** axe cannot judge contrast for text inside inline SVG
  <br>`scripts/check-a11y.mjs`, `scripts/check-contrast.mjs`. The drawn figure added to
  paper 5.15 produced 14 pa11y errors per colour scheme. axe itself reported **0 violations
  and 14 incomplete** with `contrastRatio: 0`: it cannot resolve the backdrop of an SVG
  text node, so it declines to judge, and pa11y surfaces that as an error. Counting it as a
  defect would be as wrong as silencing it. The a11y gate now separates and prints those
  results instead of failing on them, and `check-contrast.mjs` asserts the real ratios by
  parsing the tokens out of the stylesheet. Every pair passes AA in both schemes; the
  window fill opacity moved from .13 to .09 to lift the tightest pair from 4.58:1 to
  4.85:1. Both the check and its failure path were run before it was trusted.

## Low

- [ ] **P12** Confidence values on all 14 papers
  <br>Currently illustrative. Sixteen papers as of 2026-08-31; the two added that day are
  tracked separately at P21 because they were never illustrative, only unconfirmed. They are the site's central claim about itself, so they
  want a deliberate pass.

- [ ] **P13** Acknowledgement to the operations engineer in Chattogram
  <br>`index §12`.

- [ ] **P14** security.txt `Expires: 2027-08-13`
  <br>`.well-known/security.txt`. Wants annual rotation, and a reminder that outlives
  this file.

---

## How the report works

`scripts/placeholders.mjs` counts unticked boxes in this file and prints the open
items grouped by weight. It exits 0 always. The only thing it can fail on is a
malformed row, because a ledger that cannot be parsed is a ledger nobody reads.
