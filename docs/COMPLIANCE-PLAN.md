# The compliance thread

Rev A, 31 August 2026.

Two documents exist outside this repository and are handed to the same reader as the
site: a résumé and a covering letter, both aimed at a CTO mandate whose stated KPIs are
certification, platform IP, uptime and retention. The site does not mention compliance
anywhere. That is the gap this plan closes.

The site's rule applies to the closing of it. Nothing here invents a number, and where
the résumé and the site disagree about a fact, the disagreement is recorded rather than
edited away.

- [1. What the two documents say that the site does not](#1-what-the-two-documents-say-that-the-site-does-not)
- [2. Where each fact lands](#2-where-each-fact-lands)
- [3. Why no new top-level section](#3-why-no-new-top-level-section)
- [4. The two papers](#4-the-two-papers)
- [5. Contradictions between the résumé and the site](#5-contradictions-between-the-résumé-and-the-site)
- [6. Open decisions, owner only](#6-open-decisions-owner-only)

---

## 1. What the two documents say that the site does not

Compared line by line against `src/pages/index.astro`, the five implementation notes and
the fourteen papers as they stood on 2026-08-30.

| Claim in the résumé or letter | Present on the site | Where it could live |
| --- | --- | --- |
| ISO 27001, GDPR and BNM RMiT platform operation | No | Implementation 3.6 |
| Enterprise security reviews and audit evidence programmes | No | Implementation 3.6 |
| DevSecOps: dependency and image scanning, secret management, least privilege, environment isolation, release gating | Partly, scattered through 3.2 and 3.5 | Implementation 3.6 |
| A view on the schedule a certification programme runs on | No | Paper 5.15 |
| A view on turning delivery work into repeatable IP | No | Not yet placed, see section 6 |
| Vendor risk assessment | No | Implementation 3.6 |
| Incident response and post-incident review as standing practice | Yes, paper 5.11 | Already covered |
| Team grown four to eighteen, six internal promotions, eight-week enablement track | No | Not yet placed, see section 6 |
| Four self-funded products in production | No | Not yet placed, see section 6 |
| Mevrik: three million conversations a month, 99.9 percent, MTTR under thirty minutes | Contradicted, see section 5 | Implementation 3.1 |
| Affidavit Mapp, NuForce360, GenX Digital, earlier ventures | No | Section 6 holds the résumé; the site is not a career history |

The site is deliberately not a career history, so most of the missing rows should stay
missing. Two of them are arguments, and arguments are what Section 5 is for.

## 2. Where each fact lands

**Implementation 3.6, `/impl/compliance-evidence/`.** The compliance record is a system
the author operated, so it belongs in Section 3. Section 3 admits a system only with the
numbers it produced and a named failure mode, and the résumé supplies neither. It
therefore ships in state `unwritten`: front matter, a stack, and a page that says what is
missing. This is the same handling as 3.1, 3.3, 3.4 and 3.5, and it is the handling the
site's own rule requires. Inventing an audit statistic to fill the row would break the
one thing the site is for.

**Papers 5.15 and 5.16.** The arguments are separable from the record and can be
published in full, because an argument needs a confidence value and retirement conditions
rather than measurements. Both ship as drafts.

**Section 6 stays as it is.** The résumé is already access controlled and already carries
the career history. Duplicating it into the public document would make the gate
pointless.

## 3. Why no new top-level section

A "Section 15, Compliance" was considered and rejected. Section 14 is the author's
address and the appendices follow it, so a new numbered section either lands after the
appendices, which reads wrong, or forces a renumber. A renumber breaks `#s14` and every
other published anchor, and `URLs never change` is a hard constraint rather than a
preference. Appending to Section 3 and Section 5 is additive, breaks nothing, and puts
each piece where its own evidence standard already applies.

The cost of the decision is that a reader looking for the compliance material has to know
it lives in two places. Appendix A now names both, and the two papers cross-reference the
implementation note.

## 4. The two papers

| | 5.15 | 5.16 |
| --- | --- | --- |
| Title | SOC 2 in 120 Days | The Only SOC 2 Hack Is Scope |
| Identifier | `draft-imran-soc2-120-days-00` | `draft-imran-soc2-scope-hack-00` |
| Subject | The schedule, and why the observation window is the whole constraint | The scope, and why every evidence shortcut fails in the exceptions section |
| State | draft | draft |
| Confidence | 0.65 | 0.60 |
| Retirement conditions | 4 | 4 |

The confidence values are the reason both are drafts rather than holdings. The schema
refuses a draft above 0.7, and neither claim deserves more than that yet: the adjacent
work is the author's, the SOC 2 report is not. Section 8 of 5.15 says so on the page
rather than in this file.

**The 120-day number against the letter's two quarters.** The covering letter says two
quarters to ISO 27001 and SOC 2 together is aggressive but achievable. Paper 5.15 claims
120 days for SOC 2 alone, Security only, one product, one cloud account. These are
different scopes and the numbers are consistent, but a reader holding both documents
will notice the seam, so 5.15 section 1 states the relationship explicitly instead of
leaving it to be found.

## 5. Contradictions between the résumé and the site

The placeholder ledger already carried four of these under "Contradicted by the real CV",
recorded on 2026-08-13 against an earlier version of the résumé. The current résumé
changes three of them. `PLACEHOLDERS.md` now reflects the current document; the rows are
updated in place with the old reading kept, because that file follows the same
no-deletion rule as Section 7.

| | Site says | Résumé says | Status |
| --- | --- | --- | --- |
| P15 | Dhaka, Bangladesh, UTC+6 | Dhaka, Bangladesh | Agrees. Closed. |
| P16 | Eleven years of production engineering | Seventeen years | Closed 2026-08-31. Author confirms fifteen years and more; abstract now reads "Over fifteen years". Erratum 7.7. |
| P17 | Lead Solutions Architect | Chief Technology Officer, and Head of Engineering and Delivery at Mevrik | Open |
| P18 | 40M events/day, 3.1M calls/day | 3M conversations a month | Open, different units |

P16 and P17 are changes to claims already published in the masthead, the abstract, the
JSON-LD, `llms.txt`, `security.txt` and the social card. Changing them is a Section 7
event and needs an erratum. Which way each one resolves is the owner's call, not the
drafter's: the site's number could be the stale one or the conservative one, and only the
owner knows which.

**P16 resolved on 2026-08-31.** Eleven was simply wrong. The abstract now reads "Over
fifteen years of production engineering", which is true, agrees with the author, and does
not contradict the résumé's seventeen. Erratum 7.7 carries the correction and also states
that P17 was left open, because an erratum that quietly fixes one of two known defects is
the shape of problem this site exists to avoid.

## 6. Open decisions, owner only

1. **The role string.** ~~Tenure and title.~~ Tenure closed on 2026-08-31 at over
   fifteen years. The title has not: the site says Lead Solutions Architect, the résumé
   says Chief Technology Officer in its header and Head of Engineering and Delivery in its
   experience section. Three strings, six published places, one erratum when it moves.
2. **Confidence on 5.15 and 5.16.** 0.65 and 0.60 are the drafter's estimates of the
   author's credence, which is a contradiction in terms. Registered as P21.
3. **Measurements for 3.6.** The note stays unwritten until an audit programme produces
   numbers that would survive an interview. Registered as P22.
4. **The three unplaced claims** in section 1: platform IP from delivery work, the
   hiring and enablement record, and the four self-funded products. Each could be a
   paper, and none of them should be one until the author decides it is a claim he wants
   attacked.
