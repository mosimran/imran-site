---
section: "5.19"
title: "The Judge Is Grading Prose"
summary: "Automated verifiers read the narration an agent produces about its work rather than the work. Change the narration, leave the actions untouched, and the score moves."
slug: "judge-grading-prose"
published: 2026-09-01
revised: 2026-09-01
state: holding
confidence: 0.85
retires:
  - "A judging setup that scores from observable environment state alone, never reading the agent's own account of what it did, reaching agreement with human raters comparable to current narration-reading judges. That would show the narration is a convenience rather than the thing being graded."
  - "Evidence that the fluency correlation reverses under training: agents optimised against an LLM judge becoming measurably better at the task rather than at the write-up, on a held-out measure the judge never saw."
  - "A replication of the unfaithful reasoning attack that fails, or succeeds only at rates small enough to be inside annotator noise, on judges of the current generation."
  - "A demonstration that step-level credit signals do identify causally important steps once the causal ground truth is defined differently, which would make Section 3 an artefact of one definition rather than a property of the signals."
history:
  - { date: 2026-09-01, note: "Published. Two independent results, arrived at by different methods, that turn out to be the same finding.", confidenceAfter: 0.85 }
seeAlso: ["5.20", "5.13", "5.15"]
---

<div class="memo"><b>Abstract.</b> When you cannot check an agent's work directly, you ask
another model to check it. That judge does not observe the work. It reads the account the
agent wrote of the work, and those are different objects. Two separate research groups found
the consequence by different routes. One rewrote agents' reasoning while leaving every action
and observation identical and inflated judge false positives by up to 90 percent. The other
audited every signal used to score individual agent steps and found none of them beats chance
at identifying which steps mattered, while the same signals track how fluent the agent sounds
at a rank correlation of 0.75. <b>Confidence 0.85.</b> The two results are strong and they
agree. The gap is that both are recent, and Section 7 is an objection I can only partly
answer.</div>

## 1. The claim

Here is the situation everyone ends up in. You have an agent doing something long and
multi-step, there is no unit test for "did it do the right thing", and you have thousands of
runs. So you put a model in front of the transcript and ask it to score the run, and now you
have a number, and the number goes on a dashboard.

The number is real. It is a measurement of something. The question this paper is about is
what.

An agent produces two streams. It takes **actions**, which change the world and can be
observed by anything watching the environment. It also produces **text about what it is
doing and why**, which changes nothing. Your judge is fed a transcript, and a transcript is
mostly the second stream.

**The claim: an automated judge scores the account rather than the work, and this is
measurable, not philosophical.**

<figure>
<div class="dia">
<svg viewBox="0 0 640 246" role="img" aria-label="An agent produces two streams. Actions go into the environment and change observable state. Narration is text that changes nothing. The judge is fed the transcript, which is dominated by narration, and produces a score. A thick line from narration to judge shows the narration carries the score. A dashed thin line from environment state to judge shows the observable evidence is mostly not consulted. Rewriting narration alone moved judge false positives by up to ninety percent.">
<defs>
<marker id="jf" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10z" fill="currentColor"/></marker>
<marker id="ja" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path class="a" d="M0 0 L10 5 L0 10z"/></marker>
</defs>
<rect x="12" y="76" width="104" height="54" rx="3" fill="none" stroke="currentColor" stroke-width="1.5"/>
<text x="64" y="99" font-size="11" text-anchor="middle">agent</text>
<text class="d" x="64" y="115" font-size="9" text-anchor="middle">one run</text>

<line class="sd" x1="116" y1="92" x2="196" y2="52" stroke-width="1.25" marker-end="url(#jf)"/>
<text class="d" x="126" y="56" font-size="9">actions</text>
<line class="sa" x1="116" y1="114" x2="196" y2="152" stroke-width="2.5" marker-end="url(#ja)"/>
<text class="a" x="126" y="152" font-size="9">narration</text>

<rect x="200" y="26" width="160" height="52" rx="3" fill="none" stroke="currentColor" stroke-width="1.25"/>
<text x="280" y="47" font-size="10.5" text-anchor="middle">environment state</text>
<text class="d" x="280" y="63" font-size="9" text-anchor="middle">observable, checkable</text>

<rect class="ab sa" x="200" y="128" width="160" height="52" rx="3" stroke-width="1.75"/>
<text class="a" x="280" y="149" font-size="10.5" text-anchor="middle">text about the work</text>
<text class="d" x="280" y="165" font-size="9" text-anchor="middle">changes nothing</text>

<line class="sd" x1="360" y1="52" x2="452" y2="92" stroke-width="1" stroke-dasharray="4 3" marker-end="url(#jf)"/>
<text class="d" x="366" y="70" font-size="9">rarely consulted</text>
<line class="sa" x1="360" y1="154" x2="452" y2="114" stroke-width="2.5" marker-end="url(#ja)"/>
<text class="a" x="368" y="146" font-size="9">this is the transcript</text>

<rect x="456" y="76" width="98" height="54" rx="3" fill="none" stroke="currentColor" stroke-width="1.5"/>
<text x="505" y="99" font-size="11" text-anchor="middle">judge</text>
<text class="d" x="505" y="115" font-size="9" text-anchor="middle">a model</text>
<line class="sd" x1="554" y1="103" x2="624" y2="103" stroke-width="1.25" marker-end="url(#jf)"/>
<text class="d" x="566" y="96" font-size="9">score</text>

<line class="sd" x1="12" y1="204" x2="624" y2="204" stroke-width="1" opacity=".4"/>
<text class="d" x="12" y="222" font-size="9.5">Rewriting only the lower path, with every action and observation left byte for byte identical,</text>
<text class="d" x="12" y="234" font-size="9.5">inflated judge false positives by up to 90 percent across 800 trajectories.</text>
</svg>
</div>
<figcaption>Figure 1. Two streams leave the agent and only one of them can be wrong without
anything happening. The judge is downstream of the harmless one.</figcaption>
</figure>

## 2. Somebody changed only the story

The cleanest test of this is the obvious one, and a group ran it. Take a set of agent runs.
Leave every action and every observation exactly as it was. Rewrite only the reasoning text,
the part that describes progress. Then re-score.

Across 800 trajectories on web tasks, manipulated reasoning inflated the false positive rate
of state of the art judges **by up to 90 percent**. Fabricating signals of task progress
worked better than merely changing the writing style, which tells you the judge is
responding to content in the narration, not to polish.

Sit with the setup for a second, because the control is what makes it damning. The agent did
identical things. The world ended up in an identical state. The only thing that moved was
the agent's account of itself, and the grade moved with it. The authors' conclusion is that
evaluation needs "judging mechanisms that verify reasoning claims against observable
evidence", which is a polite way of saying current ones do not.

## 3. Somebody else measured what the signals track

The second result comes at it from training rather than evaluation, and lands in the same
place.

If you want to train an agent, you need to know which of its steps deserve credit. Three
signals are commonly used: a judge model's per-step score, outcome-conditioned logprob
ratios, and the policy's own confidence. A study audited all three in ALFWorld against causal
ground truth built by executed replay, which means re-sampling the agent's alternatives at
each decision point and rolling forward to see what actually changed.

<table class="rt">
<thead><tr><th style="width:240px">Signal</th><th>What the audit found</th></tr></thead>
<tbody>
<tr><td class="hd" data-l="Signal">LLM judge, per step</td><td data-l="Finding">Does not identify causally important steps better than chance</td></tr>
<tr><td class="hd" data-l="Signal">Outcome-conditioned logprob ratio</td><td data-l="Finding">Same. Conditioning on the outcome added no causal information, partial correlation of minus 0.004 in one model</td></tr>
<tr><td class="hd" data-l="Signal">The policy's own confidence</td><td data-l="Finding">Same</td></tr>
<tr><td class="hd" data-l="Signal">All of them, against fluency</td><td data-l="Finding">Median rank correlation of <b>plus 0.75</b> with how fluent the policy sounds</td></tr>
</tbody>
</table>

Read the last two rows together. The signals correlate with the prose at 0.75 and with the
causation at roughly zero. They are working. They are measuring something real and stable.
It is the writing.

The study went further and ran a seven-arm pre-registered training experiment on those
signals. No arm reliably beat the untrained policy, and what differences existed between
checkpoints were explained by training dose rather than by the content of the credit signal.
Sparser credit keeps fewer examples, and that was the whole effect.

## 4. Why this is a hard problem and not an oversight

It would be comfortable to conclude that judges are lazily built. The uncomfortable version
is that the narration is the only thing available at the scale you need.

Checking the actual work requires an oracle: a way to know the right answer independently.
For a unit test you have one. For "did this agent handle the customer's refund correctly
across nine tool calls" you do not, which is precisely why you reached for a judge. The judge
exists because the oracle does not, and then it grades the only artefact that scales, which
is the text.

<figure>
<pre>
   what you want to grade          what is cheap to grade
   ----------------------          ----------------------
   did the world end up right      does the account read as though
   were the steps necessary        the world ended up right
   was the reasoning sound         does the account read as sound

   needs an oracle                 needs a model and a transcript
   does not scale                  scales to a million runs

   and the second one is           and it correlates with fluency
   what you deployed               at 0.75
</pre>
<figcaption>Figure 2. The substitution is the only one that scales, which is why it is
everywhere and why noticing it does not immediately fix it.</figcaption>
</figure>

## 5. What this costs you in practice

Three specific ways this shows up in a system you are running.

**Your quality metric drifts up while quality does not.** If anything in your loop optimises
against the judge, even loosely, the thing that improves is the narration. This is Goodhart
with an unusually short feedback loop, because the agent producing the text and the model
grading it were trained on overlapping distributions and share a sense of what a good
explanation looks like.

**Your worst runs look average.** An agent that fails and describes the failure clearly
scores worse than one that fails and describes success. You are inverting the signal you
most need.

**Your training signal is noise with a shape.** On the ALFWorld evidence, training on
step-level credit did not beat leaving the policy alone. If you are spending compute on
that, the study says you are buying a smaller dataset.

## 6. What to do instead, in order of cost

**Grade the world, not the write-up, wherever you can.** For any run where the outcome leaves
a trace, a database row, a file, an API call with a checkable effect, assert on the trace.
This is more work per task type and it is the only thing in this list that is actually
sound.

**Feed the judge observations and withhold the narration.** If the judge sees the tool calls
and their real returns but not the agent's commentary, the attack in Section 2 has nothing to
act on. You will lose some judgement quality on genuinely ambiguous runs. That is the trade,
and it is worth measuring rather than assuming.

**Test your own judge the way the paper did.** Take fifty scored runs, rewrite the reasoning
text to sound more confident and successful, change nothing else, and re-score. If the number
moves, you have quantified your exposure in an afternoon and you can put a figure on it.

**Sample and read.** Twenty full transcripts a week, by a person, chosen at random rather
than from the tails. It does not scale, which is the point: it is the only thing in your loop
that is not made of the same material as the thing it is checking.

## 7. The strongest objection, partly unanswered

The objection is that human raters read the narration too, and we accept them.

That is fair and it is not a full defence. A human reading an agent's confident account is
also being told a story, and human annotation of agent runs has its own well-documented
reliability problems. If narration-reading were disqualifying, it would disqualify the
baseline the judges are validated against.

What I can say is that the failure modes differ in a way that matters. A human reader is not
optimised against by the same gradient, gets suspicious at a rate an automated judge does
not, and, most importantly, does not scale, so nothing in your system can quietly learn to
please them a million times. A judge sitting in a loop is a target for exactly that pressure,
and a person sampling twenty runs a week never accumulates enough interactions to become one.

That is a difference in kind, and it is smaller than I would like, which is the reason this
paper holds at 0.85 rather than higher.

## 8. What this paper does not claim

It does not claim LLM judges are useless. A judge that catches obvious garbage at a million
runs an hour is doing something no person can, and removing it makes things worse rather than
better.

It does not claim the researchers overstated. Both papers state their scope narrowly: 800
trajectories on web tasks in one, ALFWorld in the other. Whether the effect holds at your
task and your judge is a question about your system, and Section 6 says how to find out in an
afternoon.

And it does not claim anybody is being fooled on purpose. Nothing in Section 3 involves an
agent trying to deceive. The signals simply track fluency, because fluency is what a language
model can see.
