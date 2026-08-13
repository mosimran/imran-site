---
section: "5.3"
title: "Algorithmic Homophily"
summary: "Your timeline is a cache with no invalidation policy. It returns the priors you arrived with, warmed."
slug: "algorithmic-homophily"
published: 2026-01-12
revised: 2026-08-14
state: revising
confidence: 0.6
retires:
  - "A demonstration that technical opinion measured inside a subscription-shaped medium is no less varied than opinion measured outside it, on the same population and the same question, which would remove the effect this paper is about rather than its explanation."
  - "Evidence that deliberate exposure to disagreement, as described in Section 5, produces no measurable change in the accuracy of technical forecasts, which would leave the paper describing something real and useless."
  - "A mechanism that accounts for the private mailing list result in erratum 7.1 and predicts that ranking is nonetheless the dominant term, which would restore the original claim rather than the narrowed one."
history:
  - { date: 2026-08-14, note: "Text written out in full. The August correction is carried into Section 3, which is marked as under rewrite and retained rather than replaced. The observation and the explanation are now stated separately, because only the explanation failed. Retirement conditions added. Confidence unchanged at 0.60.", confidenceAfter: 0.6 }
  - { date: 2026-08-02, note: "Confidence downgraded from 0.80 to 0.60. Two readers showed the effect reproduces in private mailing lists with no ranking algorithm present, which breaks the proposed mechanism. See erratum 7.1. Section 3 is under rewrite and says so at the top.", confidenceAfter: 0.6 }
  - { date: 2026-01-12, note: "Published.", confidenceAfter: 0.8 }
seeAlso: ["5.1", "5.2", "5.7"]
---

<div class="memo"><b>Abstract.</b> A ranked feed behaves like a cache with a hit-rate
objective and no invalidation policy. It returns what you already agreed with, faster
each time, and the sensation it produces is not comfort but consensus, which is why it is
hard to notice from inside. <b>This paper is being revised.</b> The mechanism proposed in
Section 3 was shown to be wrong in August 2026; the effect appears to be real and my
explanation of it was not. <b>Confidence 0.60</b>, down from 0.80. See erratum 7.1.</div>

## 1. The claim, as it now stands

Two claims, which the first version of this paper did not separate, and separating them
is most of what the revision is for.

**The observation.** Practitioners inside a given medium converge in technical opinion
faster than the underlying evidence justifies, and the convergence is experienced as
consensus rather than as narrowing. I still hold this at roughly the confidence I started
with.

**The explanation.** That ranking algorithms optimising for engagement are the cause. This
is the part that broke, and it broke cleanly rather than partially, which is the good kind
of wrong.

## 2. The observation, and why it is hard to see

Convergence is invisible from inside because the mechanism that produces it also produces
its own corroboration. The same opinion arriving from eleven directions reads as eleven
independent confirmations. It is one confirmation, resampled.

<figure>
<pre>
  what it feels like        what it is

   A  B  C  D  E             A --+
   |  |  |  |  |                 |
   +--+--+--+--+             B --+-- one source,
        |                    C --+   eleven arrivals
        v                    D --+
     consensus               E --+
</pre>
<figcaption>Figure 1. Independent confirmation and correlated resampling are
indistinguishable at the point of reading. Only provenance separates
them.</figcaption>
</figure>

The engineering consequence is specific: technology choices acquire the appearance of
settled practice before the evidence exists, and the papers, benchmarks and postmortems
that would test them arrive two years later, by which point the choice is load-bearing.
Section 5.10 of this document is a retracted paper of mine that was produced exactly this
way.

## 3. The mechanism, under rewrite

<div class="note"><b>This section is wrong and is being replaced.</b> It is retained
rather than deleted, per Section 2.2 of the index draft. Two readers demonstrated in
August 2026 that the same convergence appears in closed, chronological mailing lists with
no ranking whatsoever, which the argument below cannot account for. Erratum 7.1 records
the correction and credits it.</div>

The original argument ran as follows. Ranking optimises for engagement. Engagement
correlates with agreement, because disagreement costs attention and produces exit.
Therefore a ranked feed converges on your priors, and does so faster the more you use it.
The cache analogy did real work here: a cache with a hit-rate objective and no
invalidation policy will happily serve stale entries forever, because staleness is not on
the objective.

The mailing list result falsifies the necessity of ranking. Whatever produces the
convergence is present when ranking is absent.

**The candidate replacement**, which I am not yet confident enough to state as the
paper's position: the binding term is *selection*, not ranking. Choosing whom to read is
already a filter, it is applied once and revisited almost never, and it is applied on
criteria (clarity, seniority, agreeableness) that correlate with existing agreement.
Ranking then accelerates a process that subscription already started. If that is right,
the paper's advice barely changes and its target changes completely: the intervention
belongs at the subscription boundary rather than at the feed.

I do not yet have a way to distinguish the selection account from a third possibility,
which is that professional communities converge for ordinary social reasons that have
nothing to do with media at all. Until I can, this section stays marked.

## 4. What the revision does not change

The observation in Section 1 survives the correction, and so does the practical advice,
which is why the paper is being revised rather than retracted. Advice that survives the
falsification of its own mechanism should be treated with suspicion, and I am treating it
with suspicion: it may be surviving because it is robust, or because it was never
load-bearing on the mechanism in the first place.

## 5. The practice, offered at 0.60

- **Write down what would change your mind before reading.** This is the same discipline
  the retirement conditions on this site enforce, applied to consumption rather than to
  publication. It is the only intervention in this list I am confident about, because its
  value does not depend on which mechanism is correct.
- **Audit the subscription boundary, not the feed.** If the selection account is right,
  this is where the whole effect enters. Once a quarter, list who you read and ask which
  of them has told you something you did not want to hear.
- **Prefer artefacts with provenance.** A postmortem, a benchmark with a methodology, a
  paper with a retirement condition. These are harder to resample, because the source is
  attached.
- **Count arrivals, not sources.** When a position reaches you from many directions, the
  useful question is how many distinct pieces of evidence sit behind it, which is usually
  one.

## 6. The strongest objection

<div class="note"><b>This may be an ordinary property of professional communities,
described in a technological vocabulary that adds nothing.</b> Engineers converged on
opinions before ranked feeds, before mailing lists, and before the internet, through
conferences, employers and textbooks. If the effect appears with ranking, without ranking,
and plausibly without any medium at all, then "algorithmic" in the title is doing no work
and the honest paper is a much older one about professional consensus. I cannot currently
rule this out. It is the reason the confidence is 0.60 rather than 0.70, and it is the
reason Section 3 is marked rather than quietly rewritten.</div>

## 7. What this paper does not claim

It does not claim consensus is wrong; most consensus is correct and cheaply acquired. It
does not claim engagement optimisation is malicious. It does not, as of the August 2026
revision, claim that ranking causes the effect, and any quotation of the earlier version
saying so should be treated as withdrawn. And it does not claim a fixed timeline for the
rewrite, because the replacement mechanism is not yet good enough to publish.
