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

- [ ] **P09** Implementation 3.2 measurements
  <br>41 ms / 180 ms gateway overhead, 14 ms redaction, 0.31% failover, falls over at
  ~11k rps.
  <br>`impl/llm-gateway §4`.

- [ ] **P10** Paper count inconsistency
  <br>The index claims "34 papers, 3 retracted"; the sources between them list 14 and
  1. Closed by T09, which makes the count generated from the collection so it cannot
  disagree with itself again.

- [ ] **P11** Bodies missing for 17 of 19 documents
  <br>Only paper 5.1 and implementation note 3.2 have full bodies in the prototype.
  The rest have front matter, abstract and retirement conditions. Nothing is invented
  to fill them.

## Contradicted by the real CV

Found when the résumé PDF was checked before upload, 2026-08-13. The site carries the
prototype's illustrative biography; the CV carries the real one. Both are handed to the
same reader, so they cannot disagree.

- [ ] **P15** Location: site says "Dhaka, Bangladesh (UTC+6)", CV says Kuala Lumpur
  <br>`index §14`, masthead, `llms.txt`, `security.txt` languages, the OG card.
  The timezone claim about overlapping with CET mornings and US Pacific evenings is
  computed from the wrong city.

- [ ] **P16** Tenure: site says "Eleven years of production engineering", CV says 15+
  <br>`index` abstract.

- [ ] **P17** Title: site says "Lead Solutions Architect", CV says "Senior AI Engineering
  and Delivery Leader"
  <br>masthead, `index §14`, `llms.txt`, the OG card, the email signature.

- [ ] **P18** Employer and scale: CV names Mevrik (UK) and ~3M conversations per month;
  site §3.1 claims 40M events/day and §3.2 claims 3.1M calls/day
  <br>Different units, so not necessarily a contradiction, but they read as one.

## Low

- [ ] **P12** Confidence values on all 14 papers
  <br>Currently illustrative. They are the site's central claim about itself, so they
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
