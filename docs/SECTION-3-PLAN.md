# Finishing and expanding Section 3

Rev C, 2 September 2026. Rev A's central finding was wrong and is withdrawn, erratum 7.12.
Rev B fixed that but stopped at "finish the eight". This revision adds the part the brief
actually asked for: use the résumé to expand Section 3, and set a bar each note has to clear.

- [1. The bar](#1-the-bar)
- [2. Where the eight stand](#2-where-the-eight-stand)
- [3. What the résumé says Section 3 is missing](#3-what-the-résumé-says-section-3-is-missing)
- [4. What can be written without the owner, and what cannot](#4-what-can-be-written-without-the-owner-and-what-cannot)
- [5. Order of work](#5-order-of-work)
- [6. Open decisions, owner only](#6-open-decisions-owner-only)

---

## 1. The bar

Every note must show engineering capability, infrastructure reasoning and product reasoning in
the same document. Note 3.1 is the reference implementation and it clears the bar with seven
things, which is the checklist for the rest.

| | What it means | Why it is the bar |
| --- | --- | --- |
| **One constraint** | A single sentence that explains why the rest of the design looks like it does | Without it a note is a technology list. With it every decision has a reason a reader can test |
| **Decisions with enforcement** | Not "we scope by tenant" but "a table without a tenant column fails the build" | A policy is a wish. A control is a claim you can check |
| **A mechanism drawn** | One diagram of how it actually works, not a box labelled with the system's name | The picture should show the thing prose cannot: where the boundary sits, what order things run in |
| **Numbers split two ways** | Measurements and design targets, each labelled | A target published as a measurement is an invented figure in better clothes |
| **A named failure mode** | Trigger, blast radius, status, and whether it was designed against or learned from | Principle 4.8. A system without one is a system not yet understood |
| **Product reasoning** | Who the constraint serves and what it costs them, not only what it costs engineering | Infra choices that ignore the buyer are hobby projects |
| **What I would do differently** | The order that was wrong, the thing found too late | This is the part a reader believes, and the part that cannot be faked |

A note that lists a stack and a throughput number is a directory entry. A note that clears the
seven is an argument about how to build something.

## 2. Where the eight stand

All eight describe real systems. Rev A said otherwise about two of them and was wrong.

| § | Note | Stack | Body | Figures |
| --- | --- | --- | --- | --- |
| 3.1 | Mevrik platform | Confirmed | **Written** | Measured, errata 7.11 and 7.12 |
| 3.2 | Sovereign LLM gateway | Confirmed | Front matter | Prototype, P09 |
| 3.3 | Webhook and social ingestion | Confirmed, Rust | Front matter | Prototype |
| 3.4 | Analytics migration | Unconfirmed | Front matter | Prototype |
| 3.5 | Air-gapped delivery | Unconfirmed | Front matter | Prototype |
| 3.6 | Audit evidence programme | Unconfirmed | Stub | None |
| 3.7 | Voice AI | Confirmed | Stub | None |
| 3.8 | Custom LLM training and hosting | Confirmed | Stub | None |

**3.3 needs a title before it needs anything else.** Rust is settled. "Ingest path rewrite, PHP
to Rust" names a migration, and what earns the entry is the delivery guarantee: replay, retry,
a drainable dead-letter path, and a 100 percent receipt rate against webhooks that retry at
you. The index should say what the system does.

## 3. What the résumé says Section 3 is missing

All eight notes are one platform at one employer. The résumé describes work at three others,
with figures already published in a document the owner hands to strangers, and Section 3 does
not mention any of it. That is the expansion the brief asked for, and it is the difference
between a platform page and a body of work.

Three candidates, each demonstrating a capability the current eight do not.

**Document intelligence pipeline.** A multi-day manual process reduced to minutes at around
99.7 percent data integrity. The engineering is extraction under an accuracy bar: OCR and
layout, confidence thresholds, the human review path for anything below them, and the
measurement that makes 99.7 a number rather than a feeling. **Capability the eight lack:**
accuracy as a product constraint, and the economics of deciding what a machine may decide
alone.

**Field service and payments platform.** More than two hundred US business customers, payment
integrations across three processors, PCI-aware card handling. The engineering is money
correctness: idempotency on retry, reconciliation, the failure modes where a double charge
costs more than an outage. **Capability the eight lack:** regulated payment scope, and
integrating providers whose failure semantics differ.

**Skills and tooling platform with a registry.** Several hundred skills, a registry of more
than nine thousand tool servers, a marketplace on a revenue share. The engineering is catalogue
at scale: ingestion and validation of third-party definitions, trust and permission around
code you did not write, and search that stays useful as the registry grows. **Capability the
eight lack:** a two-sided product where the supply is untrusted, which is a different problem
from serving your own tenants.

Whether any of the three becomes a note is the owner's call. The point of listing them is that
Section 3 currently under-represents the range the résumé already claims, and the résumé is
the more conservative document.

## 4. What can be written without the owner, and what cannot

Rev B over-blocked. It marked everything "blocked on the owner" and left nothing to do, which
is wrong: 3.7 and 3.8 already carry real architecture in their bodies while marked `unwritten`,
and that is the honest middle state.

**Writable now**, from the material already supplied: the constraint, the decisions and their
enforcement, the diagram, the product reasoning, and the cross-references to the papers that
argue about each system's weak spots. That is five of the seven bar items and it is most of the
value.

**Not writable without him**, and no amount of reading substitutes:

- **Figures**, and the label on each saying measurement or design target
- **Named failure modes**, which are what he knows about where each system breaks
- **Stack confirmation** for 3.4, 3.5 and 3.6, which is a question and not a research task,
  per erratum 7.12

A note stays `unwritten` until the figures and the failure mode arrive, whatever its body says.
Section 3's rule is the rule. But a note with a written body and an honest `unwritten` state is
worth more than front matter, and it means the owner's input becomes a short answer rather than
a blank page.

## 5. Order of work

Each task writes everything writable, then stops at the figures.

| Task | Note | What lands | What it waits on |
| --- | --- | --- | --- |
| T36 | 3.3 webhook ingestion | Retitle, body, diagram | Title, figures, failure mode |
| T37 | 3.5 air-gapped delivery | Body, diagram | Stack, figures, failure mode |
| T38 | 3.7 voice AI | Body, diagram | Values for four named metrics |
| T39 | 3.8 LLM training and hosting | Body, diagram | Figures, failure mode |
| T40 | 3.2 sovereign LLM gateway | Body, diagram | Figures, P09 |
| T41 | 3.4 analytics migration | Body, diagram | Stack, figures, failure mode |
| T42 | 3.6 audit evidence programme | Body, diagram | Stack, figures, failure mode |
| T43 | Section 3 expansion | Whichever of the three in section 3 he wants | His decision first |

3.5 goes first among the unwritten because paper 5.5 already argues its case, so the note has
an argument to answer to.

Each task that changes a published figure carries an erratum. Four notes carry prototype
figures on five surfaces each: the index, the complete index, the note, `llms.txt` and
`feed.xml`. A figure correction is not a one-file edit.

## 6. Open decisions, owner only

1. **A title for 3.3.** The language is settled; the subject is not.
2. **Figures, two or three per note**, each labelled measurement or design target.
3. **A named failure mode per note.** Trigger, blast radius, status, and whether it was designed
   against or learned from. No document holds these.
4. **Stacks for 3.4, 3.5 and 3.6**, asked rather than inferred.
5. **The expansion.** Whether Section 3 gains notes for the document intelligence pipeline, the
   payments platform, or the skills registry. Each already has figures in the résumé, and each
   covers ground the current eight do not.
