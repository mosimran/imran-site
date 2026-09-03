---
section: "5.5"
title: "On-Premise Is Not a Downgrade"
summary: "Sovereignty as an architectural constraint, not a punishment."
slug: "on-prem"
published: 2026-03-19
revised: 2026-08-14
state: holding
confidence: 0.9
retires:
  - "A team that adopted the single-artifact discipline at design time and can show, over two years, that it consumed more total engineering hours than maintaining separate cloud and on-premise builds."
  - "Regulated estates routinely permitting outbound connections to vendor control planes, which would make the assumption list in Section 2 historical rather than current."
  - "A cloud-only system of comparable complexity demonstrating equivalent dependency hygiene, reproducibility and upgrade safety without any sovereignty constraint forcing it."
history:
  - { date: 2026-08-14, note: "Text written: the assumption ledger, the three payoffs, the rule set and the objection. Retirement conditions added. Confidence unchanged.", confidenceAfter: 0.9 }
  - { date: 2026-03-19, note: "Listed in Section 5 with a title, a summary and a confidence value. No text.", confidenceAfter: 0.9 }
seeAlso: ["5.4", "5.14", "5.12"]
---

<div class="memo"><b>Abstract.</b> On-premise delivery is expensive when it is treated as a
cloud deployment with things taken away. Treated as a constraint adopted at design time
it is not a downgrade, and the discipline it forces (one artifact, explicit
dependencies, an offline supply chain, configuration as data) improves the cloud build
as well. The cost of sovereignty is the number of assumptions you can
no longer make rather than hardware, and that number is finite, enumerable and mostly
known on day one.
<b>Confidence 0.90.</b> Section 5 holds it there: elastic workloads are a real
exception and I have not sized how large that exception is.</div>

## 1. The claim

The industry describes on-premise work in the vocabulary of loss. Legacy. Regression.
Enterprise tax. That vocabulary is not neutral, and it produces a specific engineering
failure: teams build for the cloud, ship, and then attempt to subtract their way to an
on-premise release. Subtraction is where the cost is. Almost every hour I have watched
burned on sovereign delivery was spent removing an assumption that had been free to
avoid at the start and expensive to remove later.

The claim is narrow and it is about ordering. Sovereignty adopted as a constraint before
the first architectural decision costs roughly what any other constraint costs.
Sovereignty adopted as a port costs several multiples of that, and the multiple grows
with the age of the codebase.

## 2. The assumption ledger

What actually changes between a public cloud estate and an air-gapped one is a list. It
is shorter than the folklore suggests, and each entry has a known design response.

<table class="rt">
<thead><tr><th>Assumption removed</th><th>Design response</th></tr></thead>
<tbody>
<tr><td class="hd" data-l="Removed">Outbound network egress</td><td data-l="Response">No vendor control plane, no licence phone-home, no telemetry upload, no package fetch at deploy time. Everything the system needs at run time is inside the bundle.</td></tr>
<tr><td class="hd" data-l="Removed">Managed services</td><td data-l="Response">Every managed dependency sits behind an interface the system owns, with at least one self-hosted implementation that is exercised in CI rather than kept as a claim.</td></tr>
<tr><td class="hd" data-l="Removed">Vendor-driven upgrades</td><td data-l="Response">Upgrades become signed bundles applied by the operator, with a rollback that is tested rather than documented.</td></tr>
<tr><td class="hd" data-l="Removed">Observability as a service</td><td data-l="Response">Metrics, logs and traces terminate inside the estate. Support debugging happens on evidence the customer exports deliberately, not on a dashboard you can open.</td></tr>
<tr><td class="hd" data-l="Removed">Elastic capacity</td><td data-l="Response">Capacity becomes a stated failure point rather than an autoscaling policy. See Principle 4.7.</td></tr>
<tr><td class="hd" data-l="Removed">You, as the operator</td><td data-l="Response">The operator is a person you will never meet, working a maintenance window at 02:00, holding a printed runbook. This is the entry that changes the most and gets the least attention.</td></tr>
</tbody>
</table>

That last row is the one that decides whether a sovereign product is viable. Every other
entry is an engineering problem. The operator is a design problem, and the failure mode
is a system that is correct and unoperable.

## 3. Why the constraint pays back

The interesting result is that each of these responses is independently good practice
rather than merely achievable, and a team that adopts them under sovereign
pressure ends up with a cloud build that is measurably better than the one they would
have shipped without it.

<figure>
<pre>
  source  ->  reproducible build  ->  signed bundle
                                          |
                     +--------------------+
                     |                    |
                 public cloud       air-gapped site
                 (same bytes)        (same bytes)
                     |                    |
                 config as data      config as data
</pre>
<figcaption>Figure 1. One artifact, two destinations. The moment the two paths
diverge, the second one starts rotting, because only the first is exercised
daily.</figcaption>
</figure>

Three specific payoffs, in the order I have seen them arrive.

**3.1. Dependency honesty.** A build that must run with no egress cannot pretend about
what it depends on. Transitive fetches, implicit base images and "it works on the runner"
all fail immediately rather than in year three.

**3.2. Reproducibility becomes non-optional.** Shipping a bundle to a site you cannot
reach means the bundle has to be the whole truth. That forces reproducible builds, which
in turn makes cloud incidents diagnosable, because the artifact in production is
byte-identical to one you can rebuild.

**3.3. Configuration stops living in the environment.** When the environment cannot be
inspected, configuration has to be data that travels with the deployment and can be
diffed. This removes a large class of cloud incidents whose root cause is a variable set
by hand in a console two years ago.

<div class="mtr">
<div class="r"><span class="k">Design-time constraint</span><span class="b"><i style="width:22%"></i></span><span class="v">baseline</span></div>
<div class="r"><span class="k">Port at v1</span><span class="b"><i style="width:55%"></i></span><span class="v">higher</span></div>
<div class="r"><span class="k">Port at v3</span><span class="b"><i class="f" style="width:100%"></i></span><span class="v">highest</span></div>
</div>

<p class="dim">Figure 2. The shape of the cost, not its magnitude. I do not have
defensible figures for the ratios and will not invent them; see
docs/PLACEHOLDERS.md.</p>

## 4. What this looks like as a rule set

- **One artifact.** If cloud and on-premise builds differ, they differ in configuration
  data, never in code paths selected at build time.
- **Every managed dependency behind an owned interface**, with a self-hosted
  implementation running in CI on every commit.
- **The supply chain is offline-first.** Vendored, hashed, and verifiable without a
  network. A build that needs the internet is a build that cannot ship to a bank.
- **Upgrades are signed bundles with a tested rollback**, applied by a stranger, in one
  maintenance window, with no interactive prompts.
- **Capacity is stated as the point at which the system fails**, not as a target it
  meets. The operator needs to know where the edge is, because they cannot add nodes.
- **The runbook is a deliverable**, versioned with the code, and it is wrong until
  somebody who did not write the system has followed it end to end.

## 5. The strongest objection

<div class="note"><b>For genuinely elastic workloads, on-premise is a real downgrade and
calling it a constraint is a euphemism.</b> This is correct and it bounds the paper. A
workload whose value comes from absorbing a hundred-fold burst for four hours a year is
worse on fixed hardware, and no amount of design discipline recovers that. The paper
holds for systems with predictable load envelopes, which in my experience is most
regulated workloads, but "most" is doing work in that sentence and I have not
quantified it. There is a second cost I have understated: the single-artifact discipline
slows the first six months, and for a team still searching for product fit that slowdown
can be fatal. The constraint pays back over years. Not every project has years.</div>

## 6. What this paper does not claim

On-premise is not cheaper. Total cost of ownership is usually higher, and the customer is
usually paying it deliberately, for reasons of jurisdiction, audit or counterparty risk
that have nothing to do with engineering. Nothing here says cloud teams are
undisciplined, only that the sovereign constraint removes the option of skipping the
discipline, which is a different and much weaker statement about them.

The assumption ledger in Section 2 is the list I have needed so far rather than a
complete one, across six sites, and every new estate has added to it.
