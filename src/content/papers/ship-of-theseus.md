---
section: "5.9"
title: "The Ship of Theseus Passes Its Integration Tests"
summary: "Strangler-fig migrations, and the moment nobody can name when the new system became itself."
slug: "ship-of-theseus"
published: 2026-08-09
revised: 2026-08-14
state: draft
confidence: 0.55
retires:
  - "A completed incremental migration of substantial size where no identity declaration was made, and where ownership, invariants and the decommissioning of the old path nonetheless resolved cleanly within a year of the last route moving."
  - "Evidence that end-to-end invariants are preserved by route-level verification in practice, which would remove the specific decay this paper is worried about."
  - "A demonstration that the residual old system is retired at similar rates whether or not a decommissioning date was declared in advance, which would make Section 4 ceremony."
history:
  - { date: 2026-08-14, note: "Text written and published as a draft. The mechanism is stated, the evidence is thin, and the objection in Section 5 is unanswered. Open questions listed in Section 6 rather than hidden. Confidence unchanged.", confidenceAfter: 0.55 }
  - { date: 2026-08-09, note: "Listed in Section 5 with a title, a summary and a confidence value. No text.", confidenceAfter: 0.55 }
seeAlso: ["5.12", "5.7", "5.11"]
---

<div class="memo"><b>Abstract.</b> Incremental migration removes the risky cutover, which
is its entire justification and a real one. It also removes the moment at which anyone
verifies the system as a whole, declares the old guarantees ended, and names who owns the
new ones. This paper argues that the missing moment has costs, and that they are paid
quietly: invariants that were only ever true end to end, ownership that never transfers,
and an old path that is never decommissioned because no date was ever set for it.
<b>This is a draft.</b> The mechanism is stated, the evidence is thin, and the objection
in Section 5 is unanswered. <b>Confidence 0.55.</b></div>

## 1. The claim

A strangler-fig migration proceeds route by route. Each move is small, reversible, and
independently verified, which is why the pattern works and why it has largely replaced
the big-bang rewrite. Nothing in this paper disputes that.

What the pattern does not produce is a point in time at which someone says: the system is
now the new system, its guarantees are these, and this person owns them. In a big-bang
cutover that moment is unavoidable and expensive, and its expense is what buys the
verification. Incremental migration makes the moment optional, and optional
organisational moments do not happen.

## 2. What decays in the gap

**2.1. Invariants that were only ever end-to-end.** Consider a property like "every
accepted order appears in exactly one settlement batch". In the old system that held
because one process owned both sides. Route-level verification checks that the new order
path matches the old order path and that the new settlement path matches the old
settlement path. It does not check the property that spans them, because that property
was never a route.

<figure>
<pre>
  old system            invariant held here
  [ orders -- settle ]  <---- one owner, one process

  during migration
  [ orders ] --> new    each route verified
  [ settle ] --> old    against its own old half
        ^
        +-- nobody verifies the span

  after
  [ orders -- settle ]  invariant assumed, not checked
</pre>
<figcaption>Figure 1. Route-level equivalence does not compose into system-level
equivalence, and the gap is invisible while both halves pass.</figcaption>
</figure>

**2.2. Ownership that never transfers.** The old system has an owner. The new one has a
migration team. When the last route moves, the migration team disbands and ownership
arrives at whoever is nearest, usually by accident, usually discovered during the first
incident.

**2.3. The old path that never dies.** A residual route left for a "long tail" client, a
batch job, a reconciliation script. It has no owner and no decommissioning date. It
accumulates the property of being the thing nobody understands, which is where 5.7 picks
up.

**2.4. The documentation describes neither system.** During migration every document is
provisional. Provisional documents are not maintained, and the migration is long enough
that the habit of not maintaining them outlives it.

<div class="mtr">
<div class="r"><span class="k">Route-level correctness</span><span class="b"><i style="width:90%"></i></span><span class="v">verified</span></div>
<div class="r"><span class="k">Spanning invariants</span><span class="b"><i class="f" style="width:20%"></i></span><span class="v">assumed</span></div>
<div class="r"><span class="k">Ownership</span><span class="b"><i class="f" style="width:25%"></i></span><span class="v">implicit</span></div>
<div class="r"><span class="k">Old path retired</span><span class="b"><i class="f" style="width:15%"></i></span><span class="v">pending</span></div>
</div>

<p class="dim">Figure 2. What incremental migration verifies well against what it
leaves open. Ordinal and impressionistic; this is a draft and the bars are a
hypothesis rather than a finding.</p>

## 3. Why "it is done when the last route moves" is not enough

Because the last route is chosen by difficulty, not by importance. Migrations move the
easy traffic first, which means the final routes are the ones with the most unusual
requirements and the least understood behaviour, and the project reaches its lowest
morale and highest cost at exactly the point where the remaining work is hardest to
verify. "Ninety percent migrated" is a statement about routes and almost never a
statement about risk.

## 4. The proposal: identity by declaration

The remedy I am proposing, and the part I am least sure of, is to reintroduce the moment
deliberately, without reintroducing the risky cutover that the pattern exists to avoid.
It is a document and a date, not a deployment.

<table class="rt">
<thead><tr><th>&#167;</th><th>Declaration</th></tr></thead>
<tbody>
<tr><td class="n" data-l="Item">1</td><td data-l="Item"><b>Name the spanning invariants at the start</b>, before the first route moves, and build a check for each that runs against the live system throughout the migration rather than against either half.</td></tr>
<tr><td class="n" data-l="Item">2</td><td data-l="Item"><b>Publish a route ledger</b>: every route, its state, its verification, its owner. One page. It is the only honest answer to "how far along are we".</td></tr>
<tr><td class="n" data-l="Item">3</td><td data-l="Item"><b>Declare a date on which the old guarantees end</b>, and name the person to whom the new ones transfer. This is the moment. It costs a meeting.</td></tr>
<tr><td class="n" data-l="Item">4</td><td data-l="Item"><b>Set the decommissioning date before the migration starts</b>, with an owner, and treat slipping it as a decision that needs a reason rather than as a default.</td></tr>
</tbody>
</table>

## 5. The strongest objection, unanswered

<div class="note"><b>The missing moment may not matter, and wanting one may be aesthetic
rather than operational.</b> This is the objection that keeps the paper at 0.55 and in
draft. Gradualism's entire benefit is that there is no discontinuity, and asking for a
declaration could be nostalgia for the ceremony of a cutover dressed up as a risk
argument. Every cost I list in Section 2 has an alternative explanation that has nothing
to do with the missing moment: spanning invariants decay in systems that never migrate at
all, ownership drifts under reorganisation regardless (see 5.12), and old code survives
for ordinary reasons of priority. I have not separated the migration-specific effect from
the background rate, and until I do, this paper is a hypothesis with a plausible
mechanism and no evidence. That is what a draft is, and it is why the confidence is where
it is.</div>

## 6. Open questions

Stated plainly, because this document is not finished and pretending otherwise would be
the failure mode the rest of the site is about.

- Is the spanning-invariant decay measurable, and does it differ from the background rate
  in comparable systems that did not migrate?
- Does the declaration in Section 4 change behaviour, or does it become a ceremony that
  is performed and ignored?
- Is there a version of the route ledger that survives the migration and becomes the
  ownership document, or does it die with the project?
- Does this apply below some size? A four-route migration probably needs none of this,
  and I do not know where the threshold is.

## 7. What this paper does not claim

It does not claim big-bang rewrites are better. They are worse, and the pattern this
paper criticises is the correct default. It does not claim incremental migrations fail.
Most of the ones I have seen succeeded. The claim is about what they leave behind, and at
0.55 it is a claim I would not want quoted without its confidence value attached.
