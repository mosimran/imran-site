---
section: "5.23"
title: "Measured at Concurrency One"
summary: "Inference speedups are published at the operating point that flatters them, which is a single request on an idle box. Yours has forty, and the same change can shrink, vanish or invert."
slug: "concurrency-one"
published: 2026-09-01
revised: 2026-09-01
state: holding
confidence: 0.9
retires:
  - "A convention of publishing inference optimisation results as a curve across concurrency rather than a single figure, adopted widely enough that a reader can find the operating point without asking. That would make this a paper about a fixed reporting habit."
  - "An optimisation whose benefit is genuinely flat across the batch size range, from one request to hundreds, on hardware where the memory and compute bounds differ. Section 3 claims the shape is structural, and a flat result would falsify that."
  - "Evidence that production serving for the workloads this paper is about typically runs at concurrency low enough that single-stream figures transfer directly, which would make the complaint about reporting rather than about substance."
  - "A demonstration that the arithmetic-intensity account in Section 3 predicts the wrong direction for some class of optimisation, which would mean the mechanism is more complicated than stated here."
history:
  - { date: 2026-09-01, note: "Published. The two examples move in opposite directions, which is the reason the paper is about operating points rather than about scepticism.", confidenceAfter: 0.9 }
seeAlso: ["5.17", "5.20", "5.18"]
---

<div class="memo"><b>Abstract.</b> Speculative decoding is reported at two to three times
faster, and at a hundred concurrent requests a configuration tuned for a single request can
cut throughput by thirty to forty percent instead. FP8 KV caching cuts inter-token latency
slope by 54 percent at concurrency one and delivers 14.9 percent more output throughput at
concurrency eight. Both numbers are honest. They describe different machines than yours,
because a decoder is memory bound with one request in flight and compute bound with many, and
almost every optimisation is a trade against one of those two bounds. <b>Confidence
0.90.</b> The mechanism is textbook and the examples are public. The gap is that I cannot
tell you where your own crossover is, and Section 6 is about how to find it.</div>

## 1. The claim

A vendor publishes "2.5x faster inference". You deploy it and see almost nothing, or you see
it get worse, and you assume somebody was exaggerating.

Usually nobody was. The number was real on the machine it was measured on, and the machine it
was measured on had one request running.

**The claim: for inference optimisations, the operating point is part of the result, and
reporting the number without it is reporting half a measurement.**

## 2. Why one request is the default

Not conspiracy. Convenience, and it compounds.

Benchmarking a single stream is easy. You need one prompt, one GPU and a stopwatch, and the
result is stable and reproducible. Benchmarking at concurrency forty needs a load generator,
a request mix, a definition of what you are measuring, a warm-up, and a decision about which
percentile matters. One of those is a Tuesday afternoon and the other is a week.

Single-stream numbers are also bigger, which is not usually the reason but never argues
against it.

And the audience for the announcement is often running at concurrency one. Somebody with a
model on a workstation genuinely does experience the headline figure. For them the number is
accurate, and it becomes misleading only when it travels to a team serving traffic.

## 3. The mechanism, which is the useful part

This is the bit worth actually understanding, because once you have it you can predict the
direction yourself instead of taking anyone's word.

When one request is decoding, the GPU spends most of its time moving weights and cache from
memory into compute units that are largely idle. The bottleneck is memory bandwidth. Compute
is nearly free, because you have plenty spare.

Add concurrent requests and the same weight read serves many sequences at once. Arithmetic
per byte moved climbs. Past some point the compute units are the constraint and memory has
headroom, which is the mirror image of where you started.

<figure>
<div class="dia" tabindex="0" role="group" aria-label="Diagram, scrollable">
<svg viewBox="0 0 640 262" role="img" aria-label="A schematic chart of speedup against concurrency. The vertical axis is speedup with a parity line at one times. Two curves start high at concurrency one and fall as concurrency rises. One curve settles above parity, showing a reduced but real gain. The other crosses below parity at higher concurrency, showing the optimisation making things slower. A marker at concurrency one is labelled where the headline was measured, and a shaded band at higher concurrency is labelled where you serve traffic. The curve shapes are illustrative, not measured.">
<defs><marker id="cc" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10z" fill="currentColor"/></marker></defs>
<rect class="ab" x="380" y="30" width="200" height="150" rx="2" opacity=".5"/>
<text class="a" x="480" y="24" font-size="9.5" text-anchor="middle">where you serve traffic</text>
<line class="sd" x1="60" y1="180" x2="600" y2="180" stroke-width="1.25"/>
<line class="sd" x1="60" y1="30" x2="60" y2="180" stroke-width="1.25"/>
<line class="sd" x1="60" y1="140" x2="600" y2="140" stroke-width="1" stroke-dasharray="4 3"/>
<text class="d" x="606" y="143" font-size="9">1.0x</text>
<text class="d" x="26" y="46" font-size="9">3x</text>
<text class="d" x="26" y="143" font-size="9">1x</text>
<polyline class="sa" points="76,44 130,62 200,88 290,108 380,120 470,128 580,132" fill="none" stroke-width="2"/>
<text class="a" x="470" y="120" font-size="9.5">smaller, still real</text>
<polyline points="76,52 130,80 200,112 290,138 380,152 470,162 580,168" fill="none" stroke="currentColor" stroke-width="1.75" stroke-dasharray="5 3"/>
<text class="r" x="470" y="182" font-size="9.5">below parity: now slower</text>
<circle class="a" cx="76" cy="44" r="3.5"/>
<line class="sd" x1="76" y1="44" x2="76" y2="200" stroke-width="1" stroke-dasharray="3 3"/>
<text class="d" x="66" y="214" font-size="9.5">1</text>
<text class="d" x="66" y="228" font-size="9.5">the headline was measured here</text>
<g class="d" font-size="9.5"><text x="196" y="196">8</text><text x="286" y="196">32</text><text x="376" y="196">64</text><text x="466" y="196">128</text></g>
<text class="d" x="330" y="252" font-size="9.5" text-anchor="middle">concurrent requests</text>
<text class="d" x="600" y="252" font-size="9" text-anchor="end">curve shapes illustrative, not measured</text>
</svg>
</div>
<figcaption>Figure 1. Two schematic curves. The upper one is an optimisation whose benefit
shrinks and survives. The lower one crosses parity and starts costing you. Which one you have
is not knowable from a headline figure.</figcaption>
</figure>

An optimisation that buys memory traffic at the price of extra compute therefore has its
largest effect at concurrency one and its smallest, or a negative one, under load. That is
most of them.

## 4. Two real examples, moving in opposite directions

**Speculative decoding, which can invert.** A draft model proposes several tokens and the
target model verifies them in one pass. At small batch there is idle compute to absorb the
verification, so it is close to free, and reported speedups sit around two to three times at
well-chosen settings. Raise concurrency and the compute you were borrowing is now the
bottleneck, and every rejected draft token is wasted work on a saturated unit. Reported
results have speedup dropping below 1.0x at higher concurrency when the configuration was
tuned for a single request, and a setup left unreconfigured at a hundred-plus concurrent
requests reducing throughput by **thirty to forty percent** against ordinary decoding.

Note that this is a configuration failure rather than an indictment of the technique. The
technique is good. It has an operating range, the range is not printed on the box, and a
default chosen at concurrency one is actively harmful outside it.

**FP8 KV caching, which shrinks and survives.** Here the headline and the production number
both appear in the same reporting, which is what good disclosure looks like. For
Llama-3.1-8B, a **54 percent** reduction in inter-token latency slope at concurrency one
becomes a **14.9 percent** output throughput increase at concurrency eight.

<div class="mtr">
<div class="r"><span class="k">FP8 KV, concurrency 1</span><span class="b"><i style="width:54%"></i></span><span class="v">54%</span></div>
<div class="r"><span class="k">FP8 KV, concurrency 8</span><span class="b"><i style="width:15%"></i></span><span class="v">14.9%</span></div>
</div>

<p class="dim">Figure 2. The same change, the same hardware, two operating points. Roughly a
factor of three and a half between the number you would quote and the number you would get.
Both are in the source. Only one of them travels.</p>

The reason it survives at all is worth naming, because it is a different mechanism from the
one that generated the headline. Halving cache memory lets the scheduler pack more concurrent
requests onto the card. So the benefit stops being about decoding each token faster and
becomes about serving more of them at once. A related result on 4-bit KV caching keeps around
3.2 times more cache resident in HBM at a fixed memory budget and lifts a cache hit rate from
75.2 to 86.8 percent, delivering roughly double the goodput.

**That is the general shape of an optimisation that keeps working under load: the win comes
from residency and admission rather than from per-token speed.** If a claim is about how fast
one token is produced, expect it to fade. If it is about how many requests fit, expect it to
hold or grow.

## 5. Why this is not just a benchmarking complaint

Three ways this costs money rather than just being untidy.

**Capacity plans built on single-stream numbers are wrong in the expensive direction.** If
you sized a fleet assuming a 2.5x speedup that turns out to be 1.15x under your load, you
under-provisioned by more than double, and you find out in production.

**Defaults ship tuned for the demo.** Section 4's first example is not hypothetical harm. A
speculative decoding configuration left at its out-of-the-box setting can cut throughput by a
third under real concurrency, and nothing warns you, because from inside the system
everything is working exactly as configured.

**The comparison between two vendors may be a comparison between two operating points.** If
one publishes at concurrency one and the other at concurrency thirty-two, the second looks
worse while being better for you. This is the same failure as paper 5.20, arriving through
the systems door instead of the evaluation one.

## 6. What to do, and it is genuinely cheap

**Ask one question of any performance claim: at what concurrency?** If the answer is not in
the material, the number is single-stream until proven otherwise. That assumption has been
right more often than it has been wrong.

**Measure at three points, not one.** Your median concurrency, roughly double it, and one
request. Three numbers instead of one, and the shape between them tells you which curve in
Figure 1 you are on. This is an afternoon with a load generator, and it is the difference
between knowing your crossover and discovering it.

**Re-tune the knobs that have an operating range.** Speculative decoding's draft length,
batch limits and scheduler settings were tuned by somebody with a different workload. At
minimum, run with the feature on and off under your own load before believing either.

**Prefer optimisations that work through residency.** On the evidence in Section 4, the ones
that let you fit more work on the card degrade gracefully as you add load, and the ones that
make a single stream faster degrade steeply. That is a useful prior when you have to choose
without time to measure.

## 7. The strongest objection

Plenty of real deployments do run at low concurrency. A coding agent on a developer's machine,
a batch job with one worker, an on-premise deployment sized for a handful of internal users:
all of these live near concurrency one, and for them the headline number is the right number
and this paper is noise.

That is true and it narrows the claim rather than defeating it. The complaint is that
single-stream figures get published without their operating point, so a reader cannot tell
whether they are in the population the number describes. A number
with its conditions attached serves both audiences. A number without them serves whichever
one happens to be reading.

## 8. What this paper does not claim

It does not claim these techniques do not work. Speculative decoding is a genuine advance and
FP8 caching pays at both operating points measured.

It does not claim vendors hide the curve. The FP8 example in Section 4 is drawn from
reporting that gave both numbers, which is precisely why I could use it.

And the curves in Figure 1 are illustrative. Real speedup-against-concurrency curves depend on
model size, hardware, sequence length and scheduler, and I have drawn a shape rather than
measurements, which the figure says on its face because a paper about unlabelled operating
points should not ship an unlabelled chart.
