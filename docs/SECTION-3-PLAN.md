# Finishing Section 3

Rev B, 2 September 2026. Rev A's central finding was wrong and is withdrawn; see section 2.

Eight implementation notes. One is written. Four carry the prototype's figures and three
carry nothing. This is the plan to finish them, and it starts with a validation pass rather
than with writing, because the validation changed what the plan should be.

- [1. What the validation found](#1-what-the-validation-found)
- [2. The two notes that cannot be written](#2-the-two-notes-that-cannot-be-written)
- [3. What each remaining note needs](#3-what-each-remaining-note-needs)
- [4. The source-of-truth rule](#4-the-source-of-truth-rule)
- [5. Order of work](#5-order-of-work)
- [6. Open decisions, owner only](#6-open-decisions-owner-only)

---

## 1. What the validation found

Every note was checked against the résumé and the Mevrik engineering material, then checked
again with the owner, which is the step that mattered.

| § | Note | Status | Figures |
| --- | --- | --- | --- |
| 3.1 | Mevrik platform | Written 2026-09-02 | Measured, errata 7.11 and 7.12 |
| 3.2 | Sovereign LLM gateway | Real, needs writing | Prototype, P09 |
| 3.3 | Webhook and social ingestion service | Real, needs writing and retitling | Prototype |
| 3.4 | Analytics migration to ClickHouse | Real, needs writing | Prototype |
| 3.5 | Air-gapped delivery pipeline | Real, needs writing | Prototype |
| 3.6 | Audit evidence programme | Real, needs writing | None |
| 3.7 | Voice AI for customer service | Real, needs writing | None |
| 3.8 | Custom LLM training and hosting | Real, needs writing | None |

All eight describe real systems. None of them is fiction.

## 2. Rev A was wrong, and how

Rev A of this plan concluded that 3.3 and 3.4 could not be corroborated and might describe
systems that do not exist. That conclusion is withdrawn. It rested on two inferences, both bad.

**Absence from one engineering document was read as absence from the platform.** The document
described a future greenfield rebuild. What a rebuild plans to use says nothing about what a
running system has used for years. ClickHouse is in the platform. So is MinIO.

**A résumé was treated as an exhaustive inventory.** It is not, and it was never meant to be.
A résumé states capability at a level a reader absorbs in four minutes, while a production
platform runs on a great deal more technology than any résumé would list. Building a list of
"unverified technologies" from what a two-page document omits was not validation. It was
reasoning from silence and calling it evidence.

Erratum 7.12 records the same error where it did public damage, inside erratum 7.11.

**The correction to draw from it.** Documents are evidence of what they assert and not evidence
of what they omit. The only source that settles what a system uses is the person who built it,
and that question should have been asked before a denial was published.

**What 3.3 actually is**, from the owner: a webhook ingestion microservice used by several
platforms. It receives API and social media callbacks, including Facebook's, with full replay,
retry and fault tolerance, and it is the reason a 100 percent delivery receipt rate against
those webhooks is claimable. That is a more interesting system than the title suggests, and the
title is the thing that needs fixing rather than the note's right to exist.

## 3. What each remaining note needs

**3.2 Sovereign LLM gateway.** Capability confirmed: multi-model routing, redaction before
routing, per-tenant quotas, self-hosted and hosted backends behind one control plane. The
architecture can be written now from the Mevrik material. What is missing is the figures, P09, and a
stack confirmation from the owner rather than an inference from a document.

**3.3 Webhook and social ingestion service.** A shared microservice behind several platforms,
taking API and social media callbacks with replay, retry and fault tolerance. The engineering
is delivery-guarantee work: idempotent receipt, ordered replay, backpressure, and a dead-letter
path that a person can drain.

**Rust is confirmed**, for the reused parts of the service. So the current title is not wrong
about the language; it is wrong about the subject. "Ingest path rewrite, PHP to Rust" names a
migration, and what earns a Section 3 entry is the delivery guarantee the service provides, not
the language it was moved to. A reader scanning the index should see what the system does.

**3.4 Analytics migration to ClickHouse.** Real: ClickHouse is in the platform. Needs figures
and a named failure mode.

**3.5 Air-gapped delivery pipeline.** Capability confirmed by both sources. Signed
reproducible bundles, same charts as the cloud deployment, installed by an operator with no
network path back. Needs figures, a stack check on cosign, and a named failure mode. This is
the note paper 5.5 is drawn from and it should be the strongest of the set.

**3.6 Audit evidence programme.** Capability confirmed. ISO 27001 clauses 4 to 10, Annex A
themes, GDPR, BNM RMiT, DevSecOps controls, evidence as a continuous practice. Needs figures
and a named failure mode.

**3.7 Voice AI.** Capability confirmed and detailed in the résumé. Streaming speech to text,
intent and slot handling, retrieval grounding, text to speech, barge-in, Bangla and Banglish
code-switched audio, live handoff under SLA routing, telephony at carrier concurrency, PII
redaction on stored audio. The résumé names the tracked metrics without giving values: end to
end latency, word error rate on Bangla audio, containment rate, escalation rate.

**3.8 Custom LLM training and hosting.** Capability confirmed. Self-managed GPU serving for
data that cannot leave, LoRA and PEFT fine tuning measured against a prompted baseline,
batching and quantisation, routing across self-hosted and commercial models, promotion gated
on evaluation, model registry with versioning and rollback.

## 4. The source-of-truth rule

3.1 established a discipline the rest of Section 3 should follow, and it is the reason that
note is defensible.

**Two kinds of number, marked separately.** Measurements are things observed in production.
Design targets are things the build is held to. Both are legitimate on the page and they are
not interchangeable, so every figure says which it is. A target published as a measurement is
the same defect as an invented figure and is more tempting, because it is a real number that
was simply never observed.

**A named failure mode is required by Principle 4.8.** Not a risk register entry: a failure
with a trigger, a blast radius and a status. Where a control was designed in advance rather
than learned from an incident, the note says so rather than implying scar tissue it does not
have.

**Nothing is written from memory.** Each note cites back to the résumé or the Mevrik material
the owner supplied. Where neither covers a claim, the claim does not appear.

## 5. Order of work

One note per task. Every one is blocked on the owner for figures and a named failure mode,
because those cannot come from a document.

| Task | Note | Needs |
| --- | --- | --- |
| T36 | 3.3 retitled and written | A title, figures, failure mode |
| T37 | 3.5 air-gapped delivery | Figures, failure mode |
| T38 | 3.7 voice AI | Values for the four metrics the résumé already names |
| T39 | 3.8 custom LLM training and hosting | Figures, failure mode |
| T40 | 3.2 sovereign LLM gateway | Stack confirmation, figures, P09 |
| T41 | 3.4 analytics migration | Figures, failure mode |
| T42 | 3.6 audit evidence programme | Figures, failure mode |

Each task that changes a published figure carries an erratum. Four notes carry prototype
figures on five surfaces each: the index, the complete index, the note, `llms.txt` and
`feed.xml`. A figure correction is not a one-file edit.

## 6. Open decisions, owner only

1. **3.3's title.** The language is settled: Rust, for the reused parts. What remains is what
   to call it, because the current title names a migration rather than the delivery guarantee
   that makes it worth a Section 3 entry.
2. **Figures, two or three per note**, and for each one whether it is a measurement or a
   design target. Without them the notes stay `unwritten` however much architecture is written
   into them.
3. **A named failure mode per note.** These are what the owner knows about where each system
   breaks, and no document holds them.
4. **Stack confirmation per note**, asked rather than inferred. Three are now settled by
   asking: 3.1's list is expanded, 3.2 names its model backends (Ollama, GPT-4o and Qwen,
   covering self-hosted and commercial behind one control plane), and 3.3 is Rust. 3.4, 3.5 and
   3.6 have not been checked with him. The lesson of 7.12 is that this is a question, not a
   research task.
