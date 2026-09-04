---
section: "5.20"
title: "How to Read a Benchmark Number"
summary: "A published score is the product of a task set, an answer key, a retry policy and a harness. Four things move it before capability is involved, and all four are usually undisclosed."
slug: "reading-a-benchmark"
published: 2026-09-01
revised: 2026-09-01
state: holding
confidence: 0.85
retires:
  - "A widely quoted agent benchmark that publishes, as a matter of routine, its answer-key audit rate, its contamination analysis, the attempt count behind every headline figure and the harness used. If disclosure becomes normal, this paper is describing a solved problem."
  - "Evidence that leaderboard rank predicts production outcome well enough to use directly: several teams whose model choice by leaderboard matched their choice by task-specific evaluation, across different task types."
  - "A demonstration that pooled multi-attempt scores and single-attempt scores rank models identically in practice, which would make the distinction in Section 4 pedantic rather than load bearing."
  - "An audit of a major benchmark finding its answer key substantially correct, suggesting the SWE-bench Verified result is an outlier rather than what happens when anybody looks."
history:
  - { date: 2026-09-01, note: "Published. The central example is a vendor retiring a benchmark its own models led, which is a stronger source than any critic.", confidenceAfter: 0.85 }
seeAlso: ["5.18", "5.19", "5.17"]
---

<div class="memo"><b>Abstract.</b> Somebody sends you a chart and you make a decision from it.
This paper is about the four things sitting between that number and anything you could call
capability. The answer key can be wrong, and on the most quoted coding benchmark in the
industry an audit found flawed tests in over 59 percent of the sampled problems, which is
why OpenAI stopped reporting against it. The model may have seen the answers. The headline
may be several attempts pooled rather than one. And the harness is a co-author of the result,
which is paper 5.18. None of the four is a scandal. All four are undisclosed by default.
<b>Confidence 0.85.</b> The examples are strong and public. The gap from 0.95 is that the
prescription in Section 6 is more expensive than I make it sound.</div>

## 1. The claim

Nobody in this story is cheating. That is what makes it worth writing down.

A benchmark number is produced by a pipeline: a set of tasks, an answer key that decides
what counts as correct, a policy for how many attempts a model gets, and a harness that
decides what the model can see and do. A capability difference between two models is one
input to that pipeline. The claim is that the other four inputs move the output by more than
the model gap you are trying to read, and that they are almost never published alongside the
number.

So when you compare 62 against 55, you are not necessarily comparing two models. You may be
comparing two attempt policies, or one contaminated model against one clean one, or two
harnesses, and the arithmetic will look exactly the same in every case.

## 2. The answer key can be wrong

This is the one that should change how you read every chart you see, because it happened on
the benchmark everybody quotes.

SWE-bench Verified is the standard for agentic coding. OpenAI audited 138 of its problems,
roughly 27.6 percent of the set, concentrating on ones models often failed. **At least 59.4
percent of the audited problems had flawed tests.** Forty-nine tests were too narrow and
rejected functionally correct submissions. Twenty-six were too wide and demanded behaviour
the issue never asked for. OpenAI's conclusion was to stop evaluating against it and publish
why.

Read the direction of that failure carefully. Tests that are too narrow reject correct work,
which means the unsolved pile was never entirely a pile of model failures. Some fraction of
every "the model could not do this" was "the grader would not accept it". Separately, a study
found more than 15 percent of Verified instances carry incomplete test patches that let
wrong or partial solutions through, so the errors run in both directions at once. Work on
test adequacy suggested leaderboard scores may be inflated by six to seven points on that
basis alone.

Six to seven points is larger than the gap that decides most procurement arguments.

## 3. The model may have seen the answer key

SWE-bench Verified draws on public GitHub issues, and its 500 tasks and their resolutions
have been sitting in public repositories for years. Any model trained on GitHub data after
mid-2024 has plausibly read them, solutions included, and contamination has been reported
across frontier models generally rather than at one lab.

This is not a fixable oversight so much as a structural property of building benchmarks from
public data and then training on public data. A benchmark's usefulness decays from the day it
is published, and the decay is invisible in the number.

The same shape shows up in speech recognition. When reference transcripts contain errors,
models that have optimised against the benchmark reproduce the erroneous transcript rather
than what the audio actually says. Part of a leaderboard lead is memorising the key rather
than doing the task, and from the outside those two look identical.

## 4. The headline may be several attempts pooled

This one is the easiest to check and the most commonly missed.

Aikido ran ten models three times each against 32 freshly disclosed CVEs, asking each to
rediscover the vulnerability from source. DeepSeek V4 Pro's headline **28 of 32 is the union
of three runs**, not one. The write-up's own finding is that running a cheaper model a few
times and pooling reliably beats a single pass of a stronger, pricier one, and that DeepSeek
V4 Flash reached 24 of 32 across three runs at more than ten times less cost than a frontier
competitor.

That is a genuinely useful result about how to spend money. It is a different result from
"this model finds 28 of 32", and the second sentence is the one that travels.

The question to ask of any score is how many attempts bought it, because pass at three and
pass at one are different quantities with the same units. If your production path gives the
model one shot, a pooled number is not a forecast of anything you will experience.

<figure>
<div class="dia" tabindex="0" role="group" aria-label="Diagram, scrollable">
<svg viewBox="0 0 640 250" role="img" aria-label="A waterfall showing a headline benchmark score of 62 reduced by four separate effects before it describes anything you would experience. Pooled attempts, a flawed answer key, contamination and harness differences each remove part of the number, and the remainder is labelled as the part attributable to capability under your conditions. The size of each bar is illustrative, not measured.">
<defs><marker id="rw" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10z" fill="currentColor"/></marker></defs>
<text class="d" x="12" y="16" font-size="9.5" letter-spacing=".9">WHAT SITS BETWEEN A PUBLISHED NUMBER AND YOUR SYSTEM</text>
<rect class="ab sa" x="12" y="30" width="228" height="30" rx="2" stroke-width="1.5"/>
<text class="a" x="24" y="50" font-size="11">headline score</text>
<text class="d" x="196" y="50" font-size="9.5" text-anchor="end">as published</text>
<rect x="12" y="72" width="196" height="26" rx="2" fill="none" stroke="currentColor" stroke-width="1.25" stroke-dasharray="4 3"/>
<text x="24" y="90" font-size="10">minus pooled attempts</text>
<text class="d" x="252" y="90" font-size="9.5">pass at three is not pass at one</text>
<rect x="12" y="110" width="168" height="26" rx="2" fill="none" stroke="currentColor" stroke-width="1.25" stroke-dasharray="4 3"/>
<text x="24" y="128" font-size="10">minus a flawed key</text>
<text class="d" x="252" y="128" font-size="9.5">59.4 percent of audited SWE-bench problems</text>
<rect x="12" y="148" width="140" height="26" rx="2" fill="none" stroke="currentColor" stroke-width="1.25" stroke-dasharray="4 3"/>
<text x="24" y="166" font-size="10">minus contamination</text>
<text class="d" x="252" y="166" font-size="9.5">public tasks, public solutions, public training data</text>
<rect x="12" y="186" width="112" height="26" rx="2" fill="none" stroke="currentColor" stroke-width="1.25" stroke-dasharray="4 3"/>
<text x="24" y="204" font-size="10">minus their harness</text>
<text class="d" x="252" y="204" font-size="9.5">see paper 5.18</text>
<line class="sa" x1="124" y1="220" x2="124" y2="238" stroke-width="1.5" marker-end="url(#rw)"/>
<text class="a" x="136" y="240" font-size="10">what is left is the part about capability, under conditions that are not yours</text>
</svg>
</div>
<figcaption>Figure 1. The bar lengths are illustrative and deliberately not measured, because
the honest answer is that nobody publishes enough to draw this to scale. That is the
complaint.</figcaption>
</figure>

## 5. Why this persists

Because every party is behaving reasonably.

<table class="rt">
<thead><tr><th style="width:170px">Party</th><th>Incentive</th><th style="width:190px">Result</th></tr></thead>
<tbody>
<tr><td class="hd" data-l="Party">Benchmark authors</td><td data-l="Incentive">Ship something useful; auditing 500 tasks properly is a year of unfunded work</td><td data-l="Result">Keys go out with errors in them</td></tr>
<tr><td class="hd" data-l="Party">Model vendors</td><td data-l="Incentive">Report the configuration that shows the model at its best, which is a normal thing to do</td><td data-l="Result">Attempt counts and harnesses go unmentioned</td></tr>
<tr><td class="hd" data-l="Party">Readers</td><td data-l="Incentive">Need one number to end an argument in a meeting</td><td data-l="Result">The caveat gets dropped in the retelling</td></tr>
<tr><td class="hd" data-l="Party">Everyone</td><td data-l="Incentive">Public data makes benchmarks cheap to build</td><td data-l="Result">The same data trains the models</td></tr>
</tbody>
</table>

The one genuinely encouraging thing in this paper is that OpenAI published the audit that
made its own strong results on that benchmark unusable. That is the behaviour you want, it
is rarer than it should be, and it is the source I would trust most in the whole argument
precisely because of who it costs.

## 6. Reading one properly

Four questions, in order of how much they change the answer.

<table class="rt">
<thead><tr><th style="width:1%">#</th><th style="width:230px">Ask</th><th>Why it moves the number</th></tr></thead>
<tbody>
<tr><td class="n" data-l="#">1</td><td class="hd" data-l="Ask">How many attempts?</td><td data-l="Why">Pooling several runs is a different quantity in the same units. If your production path is single-shot, a pooled figure forecasts nothing.</td></tr>
<tr><td class="n" data-l="#">2</td><td class="hd" data-l="Ask">Whose harness, and is it specified?</td><td data-l="Why">Same weights have moved 28 to 49 and 30 to 100 on harness changes alone.</td></tr>
<tr><td class="n" data-l="#">3</td><td class="hd" data-l="Ask">Has the key been audited, and when?</td><td data-l="Why">The best-known one had flaws in a majority of audited problems.</td></tr>
<tr><td class="n" data-l="#">4</td><td class="hd" data-l="Ask">How old is the task set?</td><td data-l="Why">Public benchmarks decay into training data. Age is a proxy for contamination.</td></tr>
</tbody>
</table>

If you cannot answer any of the four, you have a number and no idea what it is a number of,
and the correct move is to treat the leaderboard as a shortlist rather than a ranking. Take
the top three, then run your own thirty tasks in your own harness, which is the same
prescription as 5.17 and 5.18 and is starting to look like the only prescription this site
has.

I said in the abstract that this is more expensive than it sounds. Building thirty
representative tasks with a defensible answer key is genuinely a week of somebody's time, and
the reason everyone reaches for the leaderboard is that the leaderboard is free. The argument
is that a decision worth a year of inference spend deserves a week of somebody's time, and
that almost nobody is making that trade consciously.

## 7. The strongest objection

Benchmarks improved this field enormously, and a paper that makes people distrust them may do
more harm than the flaws do. A noisy shared yardstick beats everybody privately claiming
their model is best, which is the world benchmarks replaced and which was much worse.

I accept that and it is why the four questions in Section 6 are questions rather than a
recommendation to ignore scores. What fails here is measurement quoted
without its conditions, which is a reporting problem and a reading problem, and both are
fixable without burning the practice down.

## 8. What this paper does not claim

It does not claim SWE-bench is bad work. Auditing your own widely adopted benchmark and
publishing the flaws, as its ecosystem did, is how this is supposed to go.

It does not claim contaminated models are not useful. A model that memorised solutions to
real GitHub issues has memorised something genuinely valuable. It just is not the thing the
benchmark says it measured.

And it does not put a number on the total distortion. I drew Figure 1 without a scale on
purpose, because assigning sizes to those four bars would be inventing the exact kind of
figure this paper is complaining about.
