---
section: "5.8"
title: "RAG Is a Search Problem in a Trench Coat"
summary: "The chunking strategy is doing more work than the embedding model."
slug: "rag-search"
published: 2026-01-30
revised: 2026-08-14
state: holding
confidence: 0.7
retires:
  - "A published evaluation on a realistic corpus in which swapping the embedding model, holding chunking, query construction and retrieval strategy fixed, produces a larger gain in answer accuracy than fixing chunking while holding the model fixed."
  - "Context windows and attention costs reaching a point where whole-corpus prompting is economically routine, which would remove the retrieval stage this paper is about rather than improve it."
  - "Evidence that retrieval recall of the answer-bearing passage is not the binding constraint in production systems, for example generation reliably recovering answers absent from the retrieved context."
history:
  - { date: 2026-08-14, note: "Text written: where the losses enter the pipeline, the recall measurement that makes the argument decidable, the order of work, and the long-context objection. Retirement conditions added. Scoped deliberately narrower than the retracted 5.10; see erratum 7.2. Confidence unchanged.", confidenceAfter: 0.7 }
  - { date: 2026-01-30, note: "Listed in Section 5 with a title, a summary and a confidence value. No text.", confidenceAfter: 0.7 }
seeAlso: ["5.2", "5.13", "5.4"]
---

<div class="memo"><b>Abstract.</b> Retrieval-augmented generation is an information
retrieval pipeline with a language model at the end of it. Most of the quality is decided
by the classic parts: how documents are split, what metadata survives the split, how the
query is constructed, and whether ranking is hybrid. Those decisions are usually made in
one afternoon by whoever set the system up, and then never revisited, while the team
spends the following two quarters comparing embedding models. This paper is deliberately
narrower than the claim I got wrong in 5.10, and erratum 7.2 is the reason.
<b>Confidence 0.70.</b> The gap from 1.0 is Section 5.</div>

## 1. The claim

If the passage containing the answer is not in the retrieved set, nothing downstream
recovers it. Not a better reranker, not a larger model, not a more elaborate prompt. That
is a hard ceiling, and it is set by decisions that happen before any embedding is
computed.

The claim is therefore about attention, not about technology: the marginal engineering
hour in most retrieval systems is better spent on chunking, query construction and
evaluation than on the embedding model, and teams reliably spend it the other way because
the model is the part with a leaderboard.

## 2. Where the losses actually happen

<figure>
<pre>
  document
     |  split            <- most loss enters here
     v
  chunk  (metadata kept? structure respected?)
     |  embed            <- the part everyone tunes
     v
  vector  ->  index      <- recall ceiling set here
     |
  query  (as typed? expanded? filtered?)
     |  retrieve k     <- k set once, never tuned
     v
  rank   (dense only? hybrid?)
     |
     v
  assemble context     <- order, truncation
     |
     v
  generation
</pre>
<figcaption>Figure 1. Six decisions before generation. Five of them are ordinary
information retrieval and predate the current vocabulary by decades.</figcaption>
</figure>

**2.1. Splitting.** Fixed-size windows with a fixed overlap are the default in every
starter template, and they cut through tables, headings, list items and the sentence that
defines the term used in the next paragraph. A split that respects document structure
(sections, table boundaries, list integrity) usually beats any model change, and it costs
a day.

**2.2. Metadata loss.** The chunk arrives at the index having forgotten which document,
which version, which section, which effective date and which tenant it came from. Every
one of those is a filter that would have removed most of the false positives, and the
loss is silent because the pipeline still returns plausible results.

**2.3. The query is used raw.** Users type fragments, misspellings and internal jargon.
The corpus is written in formal prose. Dense retrieval is good at bridging that gap and
lexical retrieval is good at exact identifiers, part numbers and error codes, which is
precisely where dense retrieval fails and precisely what users paste in.

**2.4. `k` was chosen once.** Almost always 3, 5 or 10, on the first day, and it is never
tuned against a measurement because there is no measurement.

## 3. The measurement that changes the conversation

Retrieval quality and answer quality are different numbers and must be measured
separately. Almost every team measures the second and infers the first, which makes every
regression ambiguous.

<table class="rt">
<thead><tr><th>&#167;</th><th>Step</th></tr></thead>
<tbody>
<tr><td class="n" data-l="Step">1</td><td data-l="Step"><b>Build an evaluation set of real questions</b>, fifty is enough to start, taken from what users actually asked rather than what the corpus makes easy.</td></tr>
<tr><td class="n" data-l="Step">2</td><td data-l="Step"><b>Label the answer location</b>, not the answer. For each question, record which passage of which document contains it. This is the expensive part and it is done once.</td></tr>
<tr><td class="n" data-l="Step">3</td><td data-l="Step"><b>Measure recall@k of the answer-bearing passage.</b> This number is the ceiling on the whole system. If it is 0.6, no amount of generation work takes the system above 0.6.</td></tr>
<tr><td class="n" data-l="Step">4</td><td data-l="Step"><b>Only then measure answer quality</b>, and treat any gap between recall and answer accuracy as a generation problem rather than a retrieval one.</td></tr>
</tbody>
</table>

Once step 3 exists, the argument about embedding models resolves itself empirically in an
afternoon, in either direction, which is the outcome this paper actually wants.

<div class="mtr">
<div class="r"><span class="k">Structure-aware splitting</span><span class="b"><i style="width:90%"></i></span><span class="v">large</span></div>
<div class="r"><span class="k">Metadata filters</span><span class="b"><i style="width:75%"></i></span><span class="v">large</span></div>
<div class="r"><span class="k">Hybrid lexical + dense</span><span class="b"><i style="width:65%"></i></span><span class="v">solid</span></div>
<div class="r"><span class="k">Tuning k, reranking</span><span class="b"><i style="width:40%"></i></span><span class="v">moderate</span></div>
<div class="r"><span class="k">Newer embedding model</span><span class="b"><i class="f" style="width:20%"></i></span><span class="v">small</span></div>
</div>

<p class="dim">Figure 2. My ordering of expected marginal gain, not a measurement.
It is a hypothesis this paper asks you to test with Section 3, and it is exactly
the kind of ordinal claim that ought to carry a confidence value.</p>

## 4. The order of work this argues for

1. Evaluation set with labelled answer locations. Nothing else is decidable without it.
2. Fix splitting so it respects document structure, and keep document, section, version
   and tenant on every chunk.
3. Add lexical retrieval alongside dense, and fuse the rankings. Identifiers and error
   codes stop disappearing.
4. Use the metadata as filters before ranking rather than as display fields after it.
5. Tune `k` and add reranking against the measurement from step 1.
6. Then, and only with a number to compare against, consider the embedding model.

## 5. The strongest objection

<div class="note"><b>Long context may make the retrieval stage vestigial.</b> If it becomes
economical to put a whole corpus, or a whole document set, in front of the model, then
splitting strategy stops being a quality decision and becomes a cost decision, and this
paper is about a transitional period rather than about a property of the problem. I do
not know how to weigh that, and it is most of the reason this sits at 0.70 rather than
higher. There is a second objection I take seriously: my ordering in Figure 2 comes from
systems with structured, versioned, tenant-scoped corpora, where metadata is unusually
valuable. On a flat corpus of undifferentiated prose the metadata rows collapse and the
ordering may invert. And I am aware that the last time I made a confident claim in this
area I had to retract it in full, which is recorded in erratum 7.2 and is the reason this
paper is scoped to a measurement practice rather than to a prediction about
technology.</div>

## 6. What this paper does not claim

It does not claim embedding models do not matter. It does not claim vector indexes are
unnecessary, which is the over-claim that retired 5.10. It does not claim these numbers
generalise; Figure 2 is explicitly a hypothesis. And it does not claim retrieval is
solved by classical information retrieval alone, only that the classical parts are where
the unspent engineering hours are.
