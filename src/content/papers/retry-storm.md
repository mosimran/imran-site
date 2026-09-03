---
section: "5.6"
title: "The Retry Storm You Built On Purpose"
summary: "Backoff without jitter synchronises your clients into a distributed metronome."
slug: "retry-storm"
published: 2026-07-28
revised: 2026-08-14
state: holding
confidence: 0.95
retires:
  - "A fleet of a thousand or more clients running deterministic exponential backoff with no jitter and no retry budget, surviving a sixty second dependency outage with no correlated arrival spike, measured at the dependency rather than at the client."
  - "Evidence that the default settings of the major client libraries now ship full jitter and a caller-side budget, which would make this a paper about a solved problem rather than a live one."
  - "A queueing analysis showing that at realistic client counts the benefit of jitter is dominated by other recovery effects, so that removing it changes nothing measurable."
history:
  - { date: 2026-08-14, note: "Text written: mechanism, amplification, the production signature, the remedy and the objection. Retirement conditions added. Confidence unchanged.", confidenceAfter: 0.95 }
  - { date: 2026-07-28, note: "Listed in Section 5 with a title, a summary and a confidence value. No text.", confidenceAfter: 0.95 }
seeAlso: ["5.4", "5.11", "5.13"]
---

<div class="memo"><b>Abstract.</b> Exponential backoff is presented as a politeness
mechanism. Without jitter it is a synchronisation mechanism. A single shared fault starts
every client's timer at the same instant, deterministic delays preserve that alignment
through every subsequent round, and the recovery attempt arrives as a series of spikes
that grow with the length of the outage. The failure is that retries are budgeted as a count
per call instead of as a fraction of forward traffic, rather than that engineers do not
know about jitter, and that nobody writes down which layer is allowed to retry.
<b>Confidence 0.95.</b> The missing 0.05 is Section 5: the sharper version of this
paper is about budgets alone, and I have not rewritten it that way yet.</div>

## 1. The claim

A retry is a load-generating decision made by a component that has just been told the
system is under stress. That is the whole problem in one sentence. Every other property
of retry behaviour follows from it.

Exponential backoff is the standard mitigation and it is a good one. It is also
incomplete in a specific, mechanical way. Backoff controls *when* one client retries. It
says nothing about whether a thousand clients retry at the same moment. If the delay
schedule is deterministic, and the fault that triggered it was shared, then the schedule
does not spread the load. It preserves the alignment the fault created and carries it
forward, round after round, for as long as the outage lasts.

## 2. The mechanism

A dependency returns errors starting at `t=0`. Every in-flight caller observes the
failure within one round-trip time of each other, which on a healthy internal network is
a window of a few milliseconds. That is the synchronising event. From then on, a
deterministic schedule of 1s, 2s, 4s, 8s keeps the whole population inside that same few
milliseconds at every retry boundary.

<figure>
<pre>
            0s      1s      2s      4s      8s
             |       |       |       |       |
no jitter    |#######|#######|#######|#######|
           fault    R1      R2      R3      R4
                     ^       ^       ^       ^
             every caller arrives in the same window

full jitter  |#.#..#.|..#.#..|#..#..#|.#..#.#|
             arrivals spread across the whole gap
</pre>
<figcaption>Figure 1. Deterministic backoff preserves the alignment the fault
created. Jitter destroys it. Both schedules have the same mean delay.</figcaption>
</figure>

The dependency therefore recovers into a square wave rather than into a ramp. Its first
moment of health is also the moment of peak concurrent arrival, so it fails again, which
re-synchronises the population, which produces the next spike. The system has found a
stable oscillation and will stay in it until something outside the loop intervenes.

Two amplifiers make this worse than the single-layer picture suggests.

**Amplification through layers.** Retries compose multiplicatively. Three attempts in the
SDK, inside three attempts at the gateway, inside three attempts in the calling service,
is twenty-seven rather than nine or three, and no single layer's
configuration looks unreasonable on its own.

<div class="mtr">
<div class="r"><span class="k">1 retrying layer</span><span class="b"><i style="width:11%"></i></span><span class="v">3&#215;</span></div>
<div class="r"><span class="k">2 retrying layers</span><span class="b"><i style="width:33%"></i></span><span class="v">9&#215;</span></div>
<div class="r"><span class="k">3 retrying layers</span><span class="b"><i class="f" style="width:100%"></i></span><span class="v">27&#215;</span></div>
</div>

<p class="dim">Figure 2. Worst-case request amplification for three attempts per layer.
The multiplier is the product of the layers, not the sum.</p>

**The load grows while the outage lasts.** Callers that would have arrived during the
outage do not disappear. They queue in the client, in the connection pool, in the
upstream's own inbound buffer. The longer the dependency is down, the larger the
population that arrives in the first post-recovery window.

## 3. What it looks like in production

The signature is specific enough to be diagnosed from a graph without reading any code.

<table class="rt">
<thead><tr><th>Signal</th><th>What a retry storm looks like</th></tr></thead>
<tbody>
<tr><td class="hd" data-l="Signal">Arrival rate at the dependency</td><td data-l="Pattern">Periodic spikes at 1s, 2s, 4s, 8s offsets from the fault, not a smooth ramp.</td></tr>
<tr><td class="hd" data-l="Signal">Ratio of attempts to distinct calls</td><td data-l="Pattern">Rises well above 1.0 and stays there. This is the single most useful number and almost nobody emits it.</td></tr>
<tr><td class="hd" data-l="Signal">Recovery shape</td><td data-l="Pattern">Health flaps. The dependency comes up, dies inside one window, comes up again.</td></tr>
<tr><td class="hd" data-l="Signal">Client-side latency</td><td data-l="Pattern">p99 grows by the sum of the backoff schedule, so it looks like the dependency got slow when in fact the caller is waiting on its own timers.</td></tr>
</tbody>
</table>

The third row is why this is rarely caught in testing. A load test drives a synthetic
client population with independently random start times, which is jitter arriving by
accident. The synchronising event is absent from the test because the test never has a
single shared fault.

## 4. The remedy, in the order it matters

The order is deliberate. The first item is the cheapest and the third is the one that
actually holds.

**4.1. Jitter, and specifically full jitter.** Sleep a uniform random value in
`[0, base * 2^n]` rather than the value itself. Equal jitter and decorrelated jitter are
both defensible; the important property is that the delay is drawn from a distribution
rather than computed, so that no two callers share a wake time except by coincidence.

**4.2. A retry budget at the caller, expressed as a fraction.** Not "three attempts per
call". A token bucket refilled from forward traffic, permitting retries only while
retries stay under roughly ten percent of successful requests over a sliding window. A
count-based limit rises with load exactly when it should fall. A fraction-based budget
falls with success exactly when it should.

**4.3. Exactly one retrying layer, named in the design document.** This is the rule that
survives reorganisation, because it is a written decision rather than a configuration
value. Every other layer converts failures into errors and returns them. If nobody can
say which layer owns retries, the answer is all of them.

<figure>
<pre>
  caller  ->  gateway  ->  service  ->  store
    [R]         [ ]          [ ]        [ ]
     |
     +-- retries here, with a budget and jitter
         every other hop fails fast and reports
</pre>
<figcaption>Figure 3. One retrying layer. The choice of which layer matters less
than the fact that it is written down.</figcaption>
</figure>

**4.4. Emit the attempt-to-call ratio.** If the number is not on a dashboard, the storm
is invisible until it is an incident. See 5.13.

## 5. The strongest objection

<div class="note"><b>Jitter is textbook, and this paper is scolding people for something
they already know.</b> That is close to right, and it is what keeps the confidence off
1.0. Nearly every engineer who reads this can define jitter. The claim survives on a
narrower footing: knowing about jitter has not translated into budgets, and budgets are
the part that actually bounds the blast radius. Jitter spreads the same total load;
only a budget reduces it. I hold 0.95 rather than 1.0 because the sharper version of
this paper would be about budgets alone, and I have not yet rewritten it that way. There
is also a real cost I have understated: full jitter adds tail latency to the common case
of a single transient error, and for small fleets that cost can exceed the benefit.</div>

## 6. What this paper does not claim

Retries are not the problem. A system without them converts every transient fault into a
user-visible error, which is worse than a storm you can bound. Jitter alone is not the
remedy either, and Section 4.2 exists because of that. The ten percent figure is a
starting point that has held for me across several systems rather than a derived
constant, and I would expect it to be wrong for anything with a very different ratio of
read to write traffic.

Nor is any of this novel. The mechanism is well described in the literature. What the
paper claims is a gap between that description and what is actually configured in
production, and erratum 7.3 records me falling into that gap myself, in code I reviewed
and approved.
