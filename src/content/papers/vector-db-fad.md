---
section: "5.10"
title: "Vector Databases Are a Fad"
summary: "Withdrawn in full. See errata 7.2."
slug: "vector-db-fad"
published: 2025-05-20
revised: 2026-08-14
state: retracted
retraction:
  date: 2025-11-14
  reason: "The central claim failed. Retrieval quality at scale turned out to depend on index properties the author had dismissed, and the operational story matured faster than predicted."
  erratum: "7.2"
history:
  - { date: 2026-08-14, note: "Original text restored to this page, struck through, per the rule that nothing here is deleted. Section 5 added, stating what actually failed. Section 6 states the narrower claim that survived. The retraction itself is unchanged and remains in force." }
  - { date: 2025-11-14, note: "Retracted in full. Text retained, struck through, with the reason attached. See erratum 7.2." }
  - { date: 2025-05-20, note: "Published at confidence 0.65." }
seeAlso: ["5.8", "5.4"]
---

<div class="memo"><b>Retracted in full on 2025-11-14.</b> The text below is the original
argument, retained rather than deleted, per Section 2.2 of the index draft. It is wrong.
Section 5 of this page records what failed and what survived. Do not quote any part of
Sections 1 to 4 without this notice attached.</div>

## 1. The claim, as originally published

<s>Vector search is a feature, not a product. The index structures involved are published
algorithms with open implementations, the storage layer is a solved problem, and the query
patterns are narrow. General-purpose databases will absorb the capability within two
years, at which point a separate stateful system exists only to serve a workload its
neighbour can already handle. Standing up a second database with its own operational
model, backup story, upgrade cadence and on-call knowledge is a cost that this workload
does not justify.</s>

## 2. The supporting argument, as originally published

<s>Three points were offered. First, that approximate nearest neighbour search is a
well-understood problem with published algorithms, so no vendor holds a durable
advantage. Second, that the operational surface of a dedicated store is the real cost and
it is paid whether or not the workload grows, which is the argument in 5.14 applied to a
storage layer. Third, that the corpora most teams actually hold are small enough that
brute-force or lightly indexed search inside an existing database is sufficient, and that
the category was being sized by the largest deployments rather than the median
one.</s>

## 3. What the paper predicted

<s>That within two years, most production retrieval workloads would be served by vector
extensions to databases teams already ran, and the standalone category would consolidate
to a small number of vendors serving genuinely large deployments.</s>

## 4. What was already weak at publication

<s>The paper's own hedge was that a sufficiently large corpus with strict latency targets
might justify a specialised store. That hedge was stated in one sentence and not
developed, which in hindsight was where the whole argument was.</s>

## 5. What actually failed

This section was added at retraction. It is not struck through, because it is the only
part of this page that is currently believed.

**5.1. The index was not a commodity.** The paper treated approximate nearest neighbour
search as a solved algorithmic problem and therefore as undifferentiated. What matters in
production is not the core algorithm but the properties around it: filtered search that
stays accurate when a predicate removes most of the corpus, incremental index maintenance
under continuous writes, quantisation that trades memory for recall in a controllable way,
and predictable behaviour at the recall and latency point a product actually needs. These
are engineering properties, they differ substantially between implementations, and the
paper dismissed the entire category of them in a subordinate clause.

**5.2. The operational story matured faster than predicted.** The argument rested on a
second stateful system being expensive to run. Managed offerings, sensible defaults and
better operational tooling arrived inside the prediction window and reduced that cost
enough to change the decision.

**5.3. The prediction was directionally right and useless.** General-purpose databases did
gain credible vector capability, which is the thing the paper said would happen. It did
not follow that the specialised systems were a fad, and the paper's confidence came from
the first observation while its conclusion depended on the second.

<table class="rt">
<thead><tr><th>The paper said</th><th>What was true</th></tr></thead>
<tbody>
<tr><td class="hd" data-l="Claimed">The algorithm is published, so the product is undifferentiated</td><td data-l="True">The algorithm is published. Filtered search accuracy, incremental maintenance and quantisation behaviour are not, and they are what a deployment lives or dies on.</td></tr>
<tr><td class="hd" data-l="Claimed">A second stateful system is too expensive to operate</td><td data-l="True">It was, at the time of writing, and stopped being so inside the prediction window.</td></tr>
<tr><td class="hd" data-l="Claimed">Therefore the category disappears</td><td data-l="True">General-purpose databases did gain the capability. The category did not disappear. The conclusion never followed from the premises.</td></tr>
</tbody>
</table>

## 6. What survived, stated narrowly

For corpora below roughly the size where index structure starts dominating latency, a
vector extension to a database the team already operates is usually the right first
choice, and the reasons are the ordinary ones in 5.14: one fewer system to back up,
upgrade and page about. That is a much smaller claim than the title, it is not
interesting, and it is what I should have written.

The larger lesson is recorded in erratum 7.2 and shapes 5.8: a confident prediction about
which technology category will disappear is a bet on a market, and my evidence was about
an algorithm. Those are different things, and the confidence value I published at the time
(0.65) was not low enough to reflect that I had substituted one for the other.
