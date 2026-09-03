---
section: "5.14"
title: "Kubernetes for a Bicycle"
summary: "On matching operational weight to actual load, written after I got this wrong twice."
slug: "kubernetes-for-a-bicycle"
published: 2025-03-11
revised: 2026-08-14
state: holding
confidence: 0.7
retires:
  - "A team of five or fewer engineers, with no dedicated platform role, running a full orchestration stack for eighteen months while spending less total time on the platform than on the product, measured rather than recalled."
  - "Managed orchestration reaching a point where the fixed costs listed in Section 3 are genuinely absorbed by the provider, including upgrade cadence, network policy and on-call knowledge, at which point the break-even in Section 4 moves far enough to invert the advice."
  - "Evidence that starting simple and migrating later costs more in aggregate than starting heavy, which is the inverse of the assumption this paper rests on and the one I would most like to see tested."
history:
  - { date: 2026-08-14, note: "Text written: what the fixed cost is actually made of, the ladder and its triggers, and the ecosystem objection. Retirement conditions added. Confidence unchanged.", confidenceAfter: 0.7 }
  - { date: 2025-03-11, note: "Listed in Section 5 with a title, a summary and a confidence value. No text.", confidenceAfter: 0.7 }
seeAlso: ["5.4", "5.5", "5.12"]
---

<div class="memo"><b>Abstract.</b> Operational weight has a fixed cost and a variable cost.
The fixed cost is paid whether or not the load arrives, it is mostly not the cluster, and
it is routinely estimated at a fraction of its real size. I have made this mistake twice,
in both cases having costed the infrastructure and not the practice that has to surround
it. The claim is that the sizing question is "how many operators do we
have" rather than "how many nodes do we need", not that orchestration is wrong.
<b>Confidence 0.70.</b> Section 5 has two objections I cannot weigh against each other,
and I have been burned by the second one as well.</div>

## 1. The claim

Choosing an operational model is choosing a fixed monthly cost in engineer-hours. That
cost is incurred on the quiet weeks as well as the busy ones, and it is paid by the same
people who are supposed to be building the product.

The bicycle in the title is the load. The failure is that the machinery has a minimum
operating crew rather than that it is bad machinery, and a team that cannot
staff that crew ends up operating it badly, which is worse than operating something
smaller well.

Both times I got this wrong I had done the arithmetic. Both times the arithmetic was
about the cluster. The cluster was never the expensive part.

## 2. Fixed and variable, drawn honestly

<figure>
<pre>
  effort
    ^
    |  heavy stack
    |  ------------------------------ fixed floor
    |                            /
    |                        /
    |  light stack     /
    |  ____________/
    +--------------------------------> load
                   ^
                   break-even, which is
                   further right than it looks
</pre>
<figcaption>Figure 1. The heavy stack wins eventually. The question is whether
your load reaches the crossing point before your team runs out of the hours the
floor consumes.</figcaption>
</figure>

The shape is uncontroversial. The mistake is in placing the floor, and the floor is
placed by what is on the list in Section 3 rather than by the orchestrator itself.

## 3. What the fixed cost is actually made of

<table class="rt">
<thead><tr><th>Cost</th><th>Why it is underestimated</th></tr></thead>
<tbody>
<tr><td class="hd" data-l="Cost">Upgrade cadence</td><td data-l="Why">The platform has a support window measured in months. Somebody owns that treadmill permanently, and it does not scale down when the product is quiet.</td></tr>
<tr><td class="hd" data-l="Cost">Network policy and identity</td><td data-l="Why">The default posture is usually open, so a real deployment needs policy, service identity and secret distribution designed rather than adopted. This is where most of the first quarter goes.</td></tr>
<tr><td class="hd" data-l="Cost">The build and release path</td><td data-l="Why">Registries, image provenance, signing, promotion between environments. All defensible, all work, none of it visible in the decision that started it.</td></tr>
<tr><td class="hd" data-l="Cost">Observability of the platform itself</td><td data-l="Why">You now have two systems to watch: the product, and the thing running it. Both page.</td></tr>
<tr><td class="hd" data-l="Cost">On-call knowledge</td><td data-l="Why">The largest and least tracked. Every engineer in the rotation needs a working model of the platform's failure modes, which is a training cost paid per person and again on every hire.</td></tr>
<tr><td class="hd" data-l="Cost">Bus factor on the platform</td><td data-l="Why">In a small team this is usually one person, and the fixed cost is invisible until that person takes leave.</td></tr>
</tbody>
</table>

<div class="mtr">
<div class="r"><span class="k">Cluster itself</span><span class="b"><i style="width:15%"></i></span><span class="v">costed</span></div>
<div class="r"><span class="k">Release path</span><span class="b"><i style="width:45%"></i></span><span class="v">partly</span></div>
<div class="r"><span class="k">Policy and identity</span><span class="b"><i class="f" style="width:70%"></i></span><span class="v">missed</span></div>
<div class="r"><span class="k">On-call knowledge</span><span class="b"><i class="f" style="width:100%"></i></span><span class="v">missed</span></div>
</div>

<p class="dim">Figure 2. What I costed against what it cost, both times. Drawn from
two cases in hindsight, which is not a sample.</p>

## 4. The ladder, and the triggers for climbing it

The useful discipline is naming, in advance, the observation that will move you up a
rung, rather than choosing correctly on day one. Without a named trigger the decision is made by
whoever is most enthusiastic in the room.

<table class="rt">
<thead><tr><th>Rung</th><th>Move up when</th></tr></thead>
<tbody>
<tr><td class="hd" data-l="Rung">One machine, one artifact, a service manager</td><td data-l="Trigger">A single machine's failure becomes an unacceptable outage, or deploys need to be zero-downtime.</td></tr>
<tr><td class="hd" data-l="Rung">Two or three machines, a load balancer, deploys by script</td><td data-l="Trigger">You are hand-placing more than about ten distinct workloads, or bin-packing has become a spreadsheet.</td></tr>
<tr><td class="hd" data-l="Rung">Managed container runtime</td><td data-l="Trigger">You need scheduling policy the platform cannot express: affinity, priority classes, custom autoscaling, per-tenant isolation.</td></tr>
<tr><td class="hd" data-l="Rung">Full orchestration</td><td data-l="Trigger">You have a platform owner. Not a volunteer. A role.</td></tr>
</tbody>
</table>

The last trigger is the whole paper compressed into one line. If the answer to "who owns
the platform" is a name plus the word "also", the rung is too high.

## 5. The strongest objection

<div class="note"><b>The ecosystem argument, and it is strong.</b> Orchestration is the
industry default. Choosing something smaller means every vendor integration, every hire,
every piece of tooling and every published runbook is written for a platform you are not
running, and that ongoing translation cost is real and compounding. It also affects
recruitment in a way that is difficult to price and easy to dismiss. Against that, my
counter-argument is only that the translation cost is visible while the operational floor
is not, and that people systematically overweight visible costs. I believe that, but I
cannot demonstrate it, and it is most of the distance from 0.70 to a higher number.
There is a second objection with force: premature simplicity is also a failure mode, and
migrating a running system up a rung under load is more expensive than starting one rung
high. I have watched that go badly too. Nobody has given me a principled way to weigh the
two regrets against each other, so what follows Section 4 is advice and not analysis.</div>

## 6. What this paper does not claim

Orchestration is not over-engineering. At sufficient scale it is the cheapest option
available and the fixed cost is recovered without anyone noticing. Managed offerings do
help; they absorb less of the list in Section 3 than their marketing implies, which is a
complaint about the marketing rather than about the product. The ladder in Section 4 is
one sensible ordering and not the only one.

Nor have I fully learned this. Two occurrences is a pattern, not a cure, and I would not
bet against a third.
