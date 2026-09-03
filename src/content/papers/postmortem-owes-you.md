---
section: "5.11"
title: "What a Postmortem Owes You"
summary: "A document that names no decision is a weather report."
slug: "postmortem-owes-you"
published: 2025-12-02
revised: 2026-08-14
state: holding
confidence: 0.9
retires:
  - "An organisation publishing narrative-only postmortems, naming no decision and no owner, that nonetheless shows a falling rate of repeat incidents in the same subsystem over eighteen months."
  - "Evidence that requiring a named decision measurably suppresses incident reporting, so that the cost in disclosure exceeds the gain in correction."
  - "A study showing that action items with an owner and a verification date are completed at the same rate as those without, which would remove the mechanism this paper rests on."
history:
  - { date: 2026-08-14, note: "Text written: the three failure modes, the four obligations, and the culturally expensive part. Retirement conditions added. Confidence unchanged.", confidenceAfter: 0.9 }
  - { date: 2025-12-02, note: "Listed in Section 5 with a title, a summary and a confidence value. No text.", confidenceAfter: 0.9 }
seeAlso: ["5.6", "5.13", "5.7"]
---

<div class="memo"><b>Abstract.</b> The product of a postmortem is a decision. Everything
else in the document (the timeline, the graphs, the contributing factors) exists to make
that decision legible and to let a reader disagree with it. A postmortem that names no
decision has recorded the weather. It reads as diligence, it costs several engineer-days
to produce, and the same incident recurs because nothing changed that a future engineer
can trip over. <b>Confidence 0.90.</b> Section 5 is the part I cannot resolve: a rule that demands a
decision will get some manufactured ones.</div>

## 1. The claim

Ask of any postmortem: what is now different? Not "what did we learn", which is
unfalsifiable, and not "what will we do", which is a forecast. What is different, today,
in a way another engineer would notice without reading this document.

If the honest answer is nothing, the incident is unresolved regardless of how good the
write-up is. This is uncomfortable because the write-up is often genuinely excellent.
Timeline theatre is the most convincing artefact in engineering: precise, chronological,
full of real detail, and structurally incapable of changing anything.

## 2. Three failure modes

**2.1. The weather report.** A minute-by-minute account, accurate throughout, ending in a
paragraph of reflection. It documents that a thing happened. It commits to nothing. It
is the most common form and the hardest to criticise, because every individual sentence
is true.

**2.2. Root-cause singularity.** The search terminates at the first satisfying
explanation, usually the last change before the alert. Incidents in systems of any size
are conjunctions: a latent defect, a configuration drift, a missing signal, and a human
decision made with the information available at the time. Stopping at one of the four
means the other three are still armed.

**2.3. Action items with no owner, no date and no test.** "Improve monitoring." "Consider
adding a circuit breaker." An item that cannot fail cannot be completed. Six months
later the list is still open and nobody can say whether that matters.

<figure>
<pre>
  incident
     |
     v
  narrative -------------> archive  (weather report)
     |
     +--> contributing factors
              |
              +--> decision
                      |
                      +--> owner
                      +--> verification date
                             |
                             v
                    something a future
                    engineer trips over
</pre>
<figcaption>Figure 1. The upper path is the common one. Only the lower path
changes the probability of recurrence.</figcaption>
</figure>

## 3. What the document owes the reader

Four obligations. They are ordered by how often they are skipped.

<table class="rt">
<thead><tr><th>&#167;</th><th>Obligation</th></tr></thead>
<tbody>
<tr><td class="n" data-l="Item">1</td><td data-l="Obligation"><b>The decision that changed.</b> Stated as a single sentence a reader can disagree with. "We now retry at the gateway only, and the SDK returns errors." If no decision changed, say that explicitly and say why, which is a legitimate and much rarer outcome than the silence suggests.</td></tr>
<tr><td class="n" data-l="Item">2</td><td data-l="Obligation"><b>The signal that would have caught it earlier, and whether it exists now.</b> Every incident has a moment where the system knew and nobody was told. Name the metric, the threshold and the destination. If the answer is that no such signal is practical, that is a finding.</td></tr>
<tr><td class="n" data-l="Item">3</td><td data-l="Obligation"><b>The person who can veto the fix.</b> Not the owner of the action item. The person whose objection would stop it. Naming them converts a silent stall into a visible disagreement, and disagreements can be resolved.</td></tr>
<tr><td class="n" data-l="Item">4</td><td data-l="Obligation"><b>The date the fix is verified in production.</b> Verified, not merged. A fix that has not been exercised against the failure mode is a hypothesis with a commit hash.</td></tr>
</tbody>
</table>

## 4. The part that is culturally expensive

A postmortem should name the moment of the missed decision, including where it was
missed by the reviewer rather than the author. This is where blamelessness is most often
misapplied. Blamelessness means the consequence to the individual is zero. It does not
mean the record is vague. A document that will not say "this was approved in review, and
the review did not ask about the retry budget" has removed the only detail from which
the review process could learn.

Erratum 7.3 on this site is that exact case, written about me, and it is the reason I
hold this claim at 0.90 rather than lower. I have watched the vague version fail and the
specific version work, in the same organisation, eight months apart.

<div class="mtr">
<div class="r"><span class="k">Named decision</span><span class="b"><i style="width:100%"></i></span><span class="v">required</span></div>
<div class="r"><span class="k">Signal + threshold</span><span class="b"><i style="width:100%"></i></span><span class="v">required</span></div>
<div class="r"><span class="k">Veto holder</span><span class="b"><i style="width:100%"></i></span><span class="v">required</span></div>
<div class="r"><span class="k">Verify date</span><span class="b"><i style="width:100%"></i></span><span class="v">required</span></div>
<div class="r"><span class="k">Minute-by-minute timeline</span><span class="b"><i style="width:34%"></i></span><span class="v">optional</span></div>
</div>

<p class="dim">Figure 2. The inversion this paper asks for. The optional row is
the one most templates make mandatory.</p>

## 5. The strongest objection

<div class="note"><b>Demanding a decision produces manufactured decisions.</b> This is the
objection I cannot fully answer. Under a rule that every postmortem must name a change,
teams will name a change, and some fraction of those will be theatre: a lint rule, an
extra alert nobody will act on, a runbook paragraph. That is worse than honesty, because
it consumes the review budget and creates the appearance of correction. The version of
the rule I actually believe in is that the document must answer the question, and that
"nothing changed, and here is why" must be an acceptable answer that a senior person is
willing to sign. Whether that survives contact with a organisation under audit pressure,
I do not know. There is also a second objection with force: for genuinely novel failures
in an immature system, the correct output really is understanding, and the decision
follows a quarter later.</div>

## 6. What this paper does not claim

Timelines are the evidence a decision rests on rather than useless detail, and a decision
without them is an assertion. Nothing here argues for shorter documents, or for writing
one after every incident. The four obligations in Section 3 are not sufficient either. My
claim about them is weaker than it may read: a document missing any of the four has, in
my experience, failed to change the system it describes, which is not the same as saying
that a document containing all four succeeds.
