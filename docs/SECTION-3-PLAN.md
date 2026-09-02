# Finishing Section 3

Rev A, 2 September 2026.

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

Every note was checked against two sources the owner supplied: the current résumé, and the
Mevrik engineering material used to write 3.1.

| § | Note | Corroborated? | Figures |
| --- | --- | --- | --- |
| 3.1 | Mevrik platform | Yes, written 2026-09-02 | Measured, erratum 7.11 |
| 3.2 | Sovereign LLM gateway | **Yes**, capability confirmed | Prototype, P09 |
| 3.3 | Ingest path rewrite, PHP to Rust | **No** | Prototype |
| 3.4 | Analytics migration to ClickHouse | **No** | Prototype |
| 3.5 | Air-gapped delivery pipeline | **Yes** | Prototype |
| 3.6 | Audit evidence programme | **Yes** | None |
| 3.7 | Voice AI for customer service | **Yes** | None |
| 3.8 | Custom LLM training and hosting | **Yes** | None |

Six of the eight describe capability the résumé and the Mevrik material both support. Two do
not, and section 2 is about those.

**Every technology named in Section 3 was checked against the résumé's technical range.**
That range lists Node.js, Python, TypeScript, PHP, React, Next.js, PostgreSQL, MongoDB, Redis
and Kafka. Eight technologies currently claimed in Section 3 appear nowhere in it: Rust,
ClickHouse, RabbitMQ, OpenSearch, MinIO, Ollama, Airflow and cosign.

Absence from a résumé is not proof a system never existed, and a résumé compresses. It is a
reason to ask rather than a reason to conclude.

## 2. The two notes that cannot be written

Erratum 7.11, published on 2026-09-02, states that Rust, ClickHouse and RabbitMQ **were never
part of the Mevrik platform.** That erratum was written from the owner's own source material.

Section 3.3 is titled *Ingest path rewrite, PHP to Rust*. Section 3.4 is *Analytics migration
to ClickHouse*. Neither technology appears in the résumé, and the site has now published a
correction saying neither was used.

That leaves three possibilities and only the owner can say which:

1. **They describe real work at a different employer**, in which case they stand and need
   their own figures. Erratum 7.11 scoped its denial to the Mevrik platform, so this is
   entirely consistent.
2. **They describe real work mis-described by the prototype**, in which case the titles and
   stacks are wrong and the notes should be retitled to what actually happened.
3. **They are prototype inventions in full**, in which case they are two systems that do not
   exist, published for a year, and they need retiring rather than writing.

**No note will be written for either until that is answered.** Writing them under the current
titles would mean inventing a Rust rewrite and a ClickHouse migration, which is the single
thing this site exists not to do, and it would be doing it immediately after publishing an
erratum that says those technologies were not used.

## 3. What each remaining note needs

**3.2 Sovereign LLM gateway.** Capability confirmed: multi-model routing, redaction before
routing, per-tenant quotas, self-hosted and hosted backends behind one control plane. The
architecture can be written now from the Mevrik material. What is missing is the figures,
P09, and a stack check: OpenSearch and Ollama are currently claimed and the Mevrik material
describes pgvector for retrieval instead.

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

One note per task, in the order that front-loads the decisions.

| Task | Note | Blocked on |
| --- | --- | --- |
| T36 | 3.3 and 3.4 decision, then act on it | **Owner** |
| T37 | 3.5 air-gapped delivery | Figures |
| T38 | 3.7 voice AI | Figures |
| T39 | 3.8 custom LLM training and hosting | Figures |
| T40 | 3.2 sovereign LLM gateway, stack corrected | Figures, P09 |
| T41 | 3.6 audit evidence programme | Figures |

3.5 goes first among the writable ones because paper 5.5 already argues its case, so the note
has an argument to answer to.

Each task that changes a published figure carries an erratum, as 7.11 did. Four notes carry
prototype figures on five surfaces each: the index, the complete index, the note, `llms.txt`
and `feed.xml`. A figure correction is not a one-file edit.

## 6. Open decisions, owner only

1. **3.3 and 3.4.** Real elsewhere, mis-described, or invented. Nothing proceeds on those two
   until this is answered, and the answer decides whether the next step is writing, retitling
   or retiring.
2. **Figures for 3.5, 3.6, 3.7 and 3.8.** Two or three per note, and for each one whether it
   is a measurement or a target. Without them the notes stay `unwritten` however much
   architecture is written into them, because Section 3's rule is the rule.
3. **A named failure mode per note.** These cannot be sourced from documents. They are what
   the owner knows about where each system breaks.
4. **The eight unverified technologies.** Whether Rust, ClickHouse, RabbitMQ, OpenSearch,
   MinIO, Ollama, Airflow and cosign belong in any of these stacks. 3.1's stack was corrected
   this way and the others have not been checked with him.
