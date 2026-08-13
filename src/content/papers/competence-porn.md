---
section: "5.1"
title: "Competence Porn"
summary: "Watching a skilled person work occupies the same reward slot as being one, and the industry has industrialised the confusion."
slug: "competence-porn"
revised: 2026-08-14
state: holding
confidence: 0.8
published: 2025-09-03
retires:
  - "A longitudinal study showing heavy consumers of technical content outperform matched peers on blind, time-boxed debugging tasks."
  - "Evidence the effect is generational rather than structural, appearing at equal rate in cohorts who entered the field before ranked feeds existed."
  - "A large publisher of technical content disclosing what fraction of the architectures it demonstrated reached production and survived twelve months, where that fraction is high."
history:
  - { date: 2026-08-14, note: "Sections 3, 4 and 5 written. They had been outlined and left unwritten since first publication, which is a longer gap than the argument deserved. Confidence unchanged: the new sections develop the claim rather than strengthen its evidence.", confidenceAfter: 0.80 }
  - { date: 2026-06-11, note: "Section 6 rewritten after a correction from a reader in bank operations. The effect is strongest where tooling is locked down rather than where it is abundant, which narrows the mechanism.", confidenceAfter: 0.80 }
  - { date: 2026-02-08, note: "Retirement conditions added. They should have shipped with the first version, and their absence is itself an instance of the thing this paper is about." }
  - { date: 2025-11-22, note: "A passage about bootcamp graduates removed. It was unsupported and aimed at the wrong people." }
  - { date: 2025-09-03, note: "Published.", confidenceAfter: 0.70 }
seeAlso: ["5.2", "5.4", "5.3"]
---

<div class="memo"><b>Abstract.</b> The feedback loop that once rewarded building has been
rerouted to reward the performance of building. The performance is cheaper to produce,
faster to distribute, and structurally unfalsifiable. This paper states the mechanism,
gives its strongest counter-argument the floor, and lists the evidence that would retire
it. <b>Confidence 0.80.</b> The gap from 0.95 is Section 6.</div>

## 1. The claim

**A pilot logs hours. A surgeon logs procedures. We log tabs.**

Somewhere in the last decade this industry discovered that watching a competent person
work is more pleasurable than being one, and, more importantly, that from the inside the
two feel nearly identical. A twelve minute video of someone untangling a difficult module
ends in the same warm, settled feeling as having untangled it yourself. That is not a
defect in you. It is the business model of the medium, and it works because it is pointed
at something real: the pleasure of watching craft is one of the oldest pleasures there is.

Notice what a demo is engineered to remove. There is no data migration. There is no
colleague who left in 2019 carrying the only working mental model of the billing service.
There is no compliance officer, no partial failure, no clock skew, no forty page
procurement questionnaire asking whether the vector store is FIPS validated. A demo is a
jet engine bench tested at sea level and sold as a mountain crossing. Everyone involved
knows this. Nobody is lying. The removal is what makes it watchable.

## 2. Why the numbers look fine

We have more available knowledge per practitioner than at any point in this industry's
history, and a persistent, widely reported sense among practitioners that they are behind.
Those two facts are not in tension. They are the same fact. The supply of things that
resemble learning has outgrown the hours in which learning can actually occur, and the
surplus has to go somewhere. It goes into the feeling.

## 3. Who absorbs the cost

Not, mostly, the person watching. This is the part of the argument I had to rewrite after
the correction recorded in the June 2026 revision, and it is where the paper stopped
being about individuals.

The cost lands on whoever inherits the decision. A demonstrated architecture arrives in a
design review carrying the authority of having been seen working, and the evidence for it
is a recording in which the hard parts were removed by construction. The person who
adopts it pays the removed costs later, one at a time, and pays them in an environment
where the demonstration is no longer available to argue with.

<figure>
<pre>
  what the demo removed        who pays it back

  data migration        ->  the team, in month four
  partial failure       ->  whoever is on call
  compliance review     ->  a person you never met
  the departed colleague->  everybody, forever
  procurement           ->  the deal, six weeks late
</pre>
<figcaption>Figure 1. The demonstration is honest about what it shows. The
liability is in what it removed, and the removal is invisible precisely because
it is what made the demonstration watchable.</figcaption>
</figure>

The reader correction that produced the June revision was this: the effect is strongest
where tooling is locked down, not where it is abundant. An engineer in a bank with a
restricted toolchain watches more demonstrations, not fewer, because watching is the only
form of access available. That inverts the naive version of the mechanism, in which
abundance causes substitution. Constraint causes it too, and by a different route.

## 4. What survives contact with production

The useful test is not whether a technique is good. It is whether the demonstration
carried the information you would need to operate it. Almost none do, and the gap is
systematic rather than accidental.

<table class="rt">
<thead><tr><th>What a demonstration shows</th><th>What operating it requires</th></tr></thead>
<tbody>
<tr><td class="hd" data-l="Shows">The happy path, end to end</td><td data-l="Requires">The failure paths, which are the majority of the code and none of the runtime</td></tr>
<tr><td class="hd" data-l="Shows">A fresh, empty system</td><td data-l="Requires">Behaviour at year three, with accumulated data and two migrations behind it</td></tr>
<tr><td class="hd" data-l="Shows">One operator who wrote it</td><td data-l="Requires">A rotation of people who did not, at 03:00, holding a runbook</td></tr>
<tr><td class="hd" data-l="Shows">A bounded, chosen problem</td><td data-l="Requires">An unbounded, inherited one with a compliance constraint attached</td></tr>
<tr><td class="hd" data-l="Shows">Success</td><td data-l="Requires">A named failure point, which Principle 4.7 asks for and demonstrations never give</td></tr>
</tbody>
</table>

This is the same structure as 5.2. Assembly produces the knowledge of what a thing does
and not of how it fails; watching produces even less, and produces it with more
confidence, because watching has no compile step to disagree with you.

## 5. The remedy, which is not "log off"

Abstinence advice is both unrealistic and wrong. Watching skilled people work is a
legitimate and efficient way to learn, and the apprenticeship objection in Section 6 is
strong enough that I will not argue otherwise. The remedy is to attach a consequence to
the watching, because the consequence is the only thing the medium removed that you can
put back yourself.

- **Convert one thing per week into a claim with a cost.** Not notes. A change to
  something you own, small enough to ship, that can fail in front of somebody.
- **Predict the failure mode before you look it up.** Write one sentence on how the
  demonstrated system breaks. Then find a postmortem. The gap between your sentence and
  the postmortem is the measurement, and it is the only calibration signal available.
- **Prefer artefacts with the hard parts left in.** Postmortems, migration write-ups,
  capacity notes with a stated breaking point. They are less pleasurable, which is the
  point: the pleasure was being produced by the removals.
- **Count what you shipped, not what you consumed.** A pilot logs hours because hours
  flown is the quantity that predicts competence. The industry has no equivalent, so the
  substitute measure is whatever is easiest to count, and what is easiest to count is
  consumption.

None of this is a cure and I am not claiming it as one. It is an attempt to reintroduce
the feedback loop with consequences attached, which is the distinction Section 6 says I
cannot yet state cleanly.

## 6. The strongest objection, unanswered

**Apprenticeship.** All pedagogy involves watching. The apprentice watches the master, and
this has worked for several thousand years. I do not yet have a clean line between
apprenticeship and spectatorship, and until I do, this paper is weaker than its prose
sounds. The distinction I am reaching for involves the presence of a feedback loop with
consequences attached, but I cannot yet state it in a way that survives a determined
counterexample. This objection is the entire reason confidence sits at 0.80 rather than
0.90.

## 7. What this paper does not claim

Technical content is not worthless. The sharpest version of the objection above is that
it is the primary way most people learn, and I have no answer to that. The producers are
not dishonest either: the removals are what make the form work, and everybody involved
knows they are there.

Section 4 is an argument, not a measurement, and it should be read as one. The retirement
conditions state the evidence that would end this paper, and the first of them is the
study I would most like somebody else to run.
