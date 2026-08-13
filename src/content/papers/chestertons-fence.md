---
section: "5.7"
title: "Chesterton's Fence Has a Git Blame"
summary: "Read the commit message before you delete the guard clause."
slug: "chestertons-fence"
published: 2026-02-14
revised: 2026-08-14
state: holding
confidence: 0.8
retires:
  - "A codebase of substantial age where the instrument-then-remove procedure in Section 4 produced no measurable reduction in regressions from cleanup work, compared against a matched period of direct deletion."
  - "Evidence that guard clauses whose recorded reason has decayed are, in aggregate, no more likely to be load-bearing than newly written ones, which would make the caution in this paper an expensive superstition."
  - "Tooling that reliably reconstructs the intent behind a change from the surrounding artefacts, at accuracy high enough that the decay ladder in Section 2 stops mattering."
history:
  - { date: 2026-08-14, note: "Text written: the decay ladder, the obligation on the author, the instrument-then-remove procedure, and the objection that this makes deletion too expensive. Retirement conditions added. Confidence unchanged.", confidenceAfter: 0.8 }
  - { date: 2026-02-14, note: "Listed in Section 5 with a title, a summary and a confidence value. No text.", confidenceAfter: 0.8 }
seeAlso: ["5.11", "5.9", "5.4"]
---

<div class="memo"><b>Abstract.</b> The parable says do not remove a fence until you know
why it was built. In software the answer is usually recoverable, for a while, from the
commit, the pull request, the issue and the incident it followed. The parable is
therefore easier to obey here than anywhere else, and it is still routinely disobeyed,
because the recoverable context decays on a schedule nobody plans around. This paper is
about the case the parable does not cover: when the history is one line and a date, and
the honest answer to "why is this here" is that nobody knows.
<b>Confidence 0.80.</b> Section 5 is why it is not higher: I cannot separate a
load-bearing fence from a decorative one before instrumenting it.</div>

## 1. The claim

Two claims, and the second is the one that is actually contested.

The weak claim: before deleting a guard clause, a retry, a sleep, a null check or a
special case, spend ten minutes on `git log -S` and the linked pull request. This is
cheap, it works more often than people expect, and it is not interesting.

The strong claim: the context that would answer the question decays predictably, and the
decay is fast enough that the parable's advice is unavailable for most code older than
about three years. What is needed for that case is a procedure, not more diligence.

## 2. The decay ladder

Every reason for a line of code lives somewhere. The places are ordered by how long they
survive, and the ordering is stable across every organisation I have worked in.

<figure>
<pre>
  survives longest
    |  inline comment naming the failure
    |  test asserting the behaviour
    |  commit message with the reason
    |  pull request description
    |  issue tracker entry
    |  incident channel / chat thread
    |  the person who wrote it
  survives shortest
</pre>
<figcaption>Figure 1. The decay ladder. Everything below the third rung depends on
a system, an account or a person outliving the code, and none of them
reliably do.</figcaption>
</figure>

The bottom four rungs share a property: they are outside the repository. They depend on a
vendor account still existing, a chat retention policy, a tracker migration that preserved
comments, or a person still answering email. The repository is the only artefact with the
same lifetime as the code, which is why the top three rungs are the only ones worth
relying on.

<div class="mtr">
<div class="r"><span class="k">Inline comment</span><span class="b"><i style="width:100%"></i></span><span class="v">code&#8217;s life</span></div>
<div class="r"><span class="k">Commit message</span><span class="b"><i style="width:92%"></i></span><span class="v">repo&#8217;s life</span></div>
<div class="r"><span class="k">Pull request body</span><span class="b"><i style="width:55%"></i></span><span class="v">vendor&#8217;s life</span></div>
<div class="r"><span class="k">Issue tracker</span><span class="b"><i style="width:35%"></i></span><span class="v">migration</span></div>
<div class="r"><span class="k">Chat thread</span><span class="b"><i class="f" style="width:18%"></i></span><span class="v">retention</span></div>
<div class="r"><span class="k">The author</span><span class="b"><i class="f" style="width:12%"></i></span><span class="v">tenure</span></div>
</div>

<p class="dim">Figure 2. The bars rank expected survival rather than measured
half-lives. The ranking is the claim; the lengths are only a drawing of it.</p>

## 3. The obligation this puts on the author

Most writing about Chesterton's fence addresses the person removing it. The larger gain
is on the other side, because it is cheap at the moment of writing and impossible
afterwards.

A guard clause should carry its reason at the top of the ladder, in one line, naming the
failure rather than the behaviour:

<figure>
<pre>
  // Rejects zero-length batches. The 2024-11
  // ingest incident: an empty batch advanced the
  // offset without a write, so replay skipped the
  // window silently.
  // Test: batch_empty_does_not_advance_offset.
  if (batch.isEmpty()) return
</pre>
<figcaption>Figure 3. Four lines that make the fence removable by someone who was
not there. The test name is the load-bearing part.</figcaption>
</figure>

A test that fails when the guard is removed is better than any comment, because it
enforces rather than explains. The comment is for the case where the reason is not
expressible as an assertion, which is more common than test-first advice admits: rate
limits, ordering assumptions about an external system, and workarounds for defects in
software you do not control.

## 4. The procedure for the decayed case

When the history is genuinely thin, the parable gives no guidance beyond "do not remove
it", which taken literally means codebases only accumulate. The alternative is to convert
the unknown into an observation.

<table class="rt">
<thead><tr><th>&#167;</th><th>Step</th></tr></thead>
<tbody>
<tr><td class="n" data-l="Step">1</td><td data-l="Step"><b>Instrument, do not delete.</b> Leave the guard in place and emit a counter with a distinguishing label every time it fires. This is a small, reversible, obviously safe change.</td></tr>
<tr><td class="n" data-l="Step">2</td><td data-l="Step"><b>Wait one full business cycle.</b> Not a week. Whatever period contains your month-end close, your quarterly batch, your annual reconciliation. Fences are usually built for the rare path, which is exactly the path a two-week observation misses.</td></tr>
<tr><td class="n" data-l="Step">3</td><td data-l="Step"><b>Read the fires.</b> If the counter is non-zero, you now have the reason, expressed as the inputs that reach it, which is better evidence than the original commit message would have been.</td></tr>
<tr><td class="n" data-l="Step">4</td><td data-l="Step"><b>If it is zero, remove with the evidence attached.</b> The commit message says the counter ran for the named period at the named volume and never fired. That message is now the top rung of the ladder for whoever revisits this.</td></tr>
<tr><td class="n" data-l="Step">5</td><td data-l="Step"><b>Keep the rollback cheap for one more cycle.</b> Removal is a change like any other, and it deserves the same rollback plan as a feature.</td></tr>
</tbody>
</table>

The procedure has a cost, and the cost is the objection.

## 5. The strongest objection

<div class="note"><b>This turns every cleanup into a quarter-long project, and most fences
are cargo cult.</b> Both are substantially true. A large fraction of guard clauses in any
old codebase are defensive habit, copied from a neighbouring function, protecting against
nothing. Applying Section 4 to all of them would make deletion so expensive that nobody
deletes, and a codebase that cannot shrink is its own failure mode. I do not have a
reliable test that separates a load-bearing fence from a decorative one before the
instrumentation runs, which is the entire reason this sits at 0.80. The partial answer I
use is to apply the procedure only where the guard touches money, ordering, retention or
an external contract, and to delete freely elsewhere. That heuristic is a judgement call
wearing a rule's clothing, and I know it.</div>

## 6. What this paper does not claim

Old code has no special claim on survival, and `git blame` is not sufficient: Section 2
exists because it usually is not. The ordering in Figure 1 is not a measurement. It is
what I have seen hold everywhere I have looked, which is a weaker thing.

The procedure in Section 4 is not novel either. It is ordinary feature-flag practice
pointed at a deletion instead of a release, which is the one place almost nobody points
it.
