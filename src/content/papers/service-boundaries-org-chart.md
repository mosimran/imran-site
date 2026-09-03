---
section: "5.12"
title: "Your Service Boundaries Are an Org Chart"
summary: "Conway's law, observed in the wild across three reorganisations."
slug: "service-boundaries-org-chart"
published: 2025-09-18
revised: 2026-08-14
state: holding
confidence: 0.85
retires:
  - "A system of comparable size whose service graph remained materially unchanged across a reporting-line reorganisation, sustained for four quarters, with no deliberate effort to hold the architecture in place."
  - "Evidence that distributed and asynchronous working has flattened the communication cost gradient enough that team boundaries no longer predict interface boundaries."
  - "A demonstration that the correlation runs the other way in practice, with organisations reliably reshaping their reporting lines to match an architecture chosen first, at a rate high enough to make the inverse manoeuvre in Section 4 the normal case rather than the rare one."
history:
  - { date: 2026-08-14, note: "Text written: where the convergence shows first, why the architecture document loses, the inverse manoeuvre, and the objection about sample size and causal direction. Retirement conditions added. Confidence unchanged.", confidenceAfter: 0.85 }
  - { date: 2025-09-18, note: "Listed in Section 5 with a title, a summary and a confidence value. No text.", confidenceAfter: 0.85 }
seeAlso: ["5.9", "5.5", "5.7"]
---

<div class="memo"><b>Abstract.</b> Conway's law is usually quoted as an observation about
other people's systems. It is more useful as a design constraint with a predictable
timescale. Across three reorganisations I watched the service graph converge on the
reporting graph within roughly two quarters, in every case, regardless of what the
architecture documents said. The practical consequence is that a boundary you want must
be paid for in organisational structure, not in diagrams. <b>Confidence 0.85.</b> Three cases in
one company is not a sample, and the causal direction is not settled. Both are Section 5.</div>

## 1. The claim

An interface hardens where communication is expensive. That is the mechanism in one
sentence, and everything else follows from it.

Inside a team, changing a function signature costs a conversation. Across a team
boundary it costs a ticket, a sprint boundary, a compatibility window and, if the teams
report to different managers, a negotiation about priority. Engineers are efficient. They
route around expense. So the seams in the codebase migrate, over months, to sit exactly
where the organisational expense is, and the architecture document becomes a description
of a system that no longer exists.

The observation is Conway's. What I am adding is that the timescale is short enough to be
useful, and that the direction of causation is asymmetric in a way that gives you a
lever.

## 2. What the convergence looks like

The pattern is subtler than services getting renamed, and it shows up in four places
before it shows up in the deployment topology.

<table class="rt">
<thead><tr><th>Where it shows first</th><th>Symptom</th></tr></thead>
<tbody>
<tr><td class="hd" data-l="Where">Shared modules</td><td data-l="Symptom">A library owned by two teams grows a seam down the middle. Both halves are still in one repository, both are still deployed together, and no change ever crosses the seam.</td></tr>
<tr><td class="hd" data-l="Where">API versioning</td><td data-l="Symptom">Endpoints crossing a team boundary acquire versions and deprecation policies. Endpoints inside one team keep changing in place, and nothing breaks.</td></tr>
<tr><td class="hd" data-l="Where">Data</td><td data-l="Symptom">A table two teams write to becomes a table one team writes to and the other reads through a view, then through an event, then through a copy.</td></tr>
<tr><td class="hd" data-l="Where">On-call</td><td data-l="Symptom">The rotation splits before the service does. The rotation boundary is the most honest architecture diagram an organisation produces, because it is the one with consequences attached.</td></tr>
</tbody>
</table>

<figure>
<pre>
  quarter 0        reporting lines
                   A ---- B        C

  architecture     [ ingest -- enrich -- serve ]
                        one service, three modules

  quarter 2        reporting lines
                   A       B ---- C

  architecture     [ ingest ] -> [ enrich -- serve ]
                        seam appeared where A left
</pre>
<figcaption>Figure 1. The reorganisation happened in quarter 0. The seam was
visible in the code by quarter 2, and nobody proposed it in a document.</figcaption>
</figure>

## 3. Why the architecture document loses

Three reasons, and none of them involve anyone behaving badly.

**3.1. The document has no enforcement surface.** A boundary that is not enforced by a
compiler, a repository permission, a deployment unit or an on-call rotation is a
suggestion. Suggestions decay at the rate of staff turnover.

**3.2. Local incentives are correct and global ones are diffuse.** An engineer avoiding a
cross-team negotiation to ship this week is making the right call for this week. The
architecture erodes one correct local decision at a time, which is why it is invisible
in review.

**3.3. Reorganisations are faster than refactors.** A reporting line changes in an
afternoon. A service boundary changes over two quarters. The organisation will always be
ahead, so the code is always converging on a target that has already moved.

## 4. Using it rather than lamenting it

The lever is that the causation is asymmetric. Organisation shapes architecture reliably
and quickly. Architecture shapes organisation weakly and slowly. So the manoeuvre is to
choose the boundary you want and then move the people, which is a management action
rather than an engineering one.

- **Before designing the service graph, draw the team graph you can actually get.** If
  you cannot get it, design for the one you have. A boundary you cannot staff is a
  boundary you will maintain by hand until you stop.
- **Never let two teams own one deployment unit.** It will grow a seam anyway, and the
  seam will be placed by expedience rather than by design. Split it deliberately or merge
  the ownership.
- **Watch the on-call rotation as the leading indicator.** When someone proposes
  splitting a rotation, the service split is roughly two quarters away whether or not
  anyone has written it down.
- **Price a desired boundary in headcount.** "We want ingest isolated" translates to "we
  need someone to own ingest". If that role does not exist, the isolation will not
  survive its first deadline.
- **When a reorganisation is announced, schedule the architecture review inside the same
  quarter.** The drift is going to happen. The choice is whether it is designed or
  discovered.

<div class="mtr">
<div class="r"><span class="k">Reporting line change</span><span class="b"><i style="width:8%"></i></span><span class="v">days</span></div>
<div class="r"><span class="k">Rotation split</span><span class="b"><i style="width:30%"></i></span><span class="v">weeks</span></div>
<div class="r"><span class="k">Interface hardens</span><span class="b"><i style="width:65%"></i></span><span class="v">~1 quarter</span></div>
<div class="r"><span class="k">Deployment unit splits</span><span class="b"><i class="f" style="width:100%"></i></span><span class="v">~2 quarters</span></div>
</div>

<p class="dim">Figure 2. The sequence I have observed three times. The ordering is
the claim; the durations are approximate and drawn from three cases, which is
not a sample.</p>

## 5. The strongest objection

<div class="note"><b>Three reorganisations in one organisational culture is an anecdote,
and the direction of causation is not established.</b> Both halves of that are fair. My
three cases share an employer, a market and a hiring pipeline, so what I may have
observed is a property of one company rather than of organisations. And the causal claim
is genuinely underdetermined: it is equally consistent with the evidence that managers
reorganise <em>in anticipation</em> of architectural pressure they can already see, which
would make the reporting change a symptom rather than a cause and would invert the advice
in Section 4 entirely. I hold 0.85 because the predictive value has been high for me,
not because the mechanism is settled. A well-constructed study across several
organisations would move this number in either direction, and I would rather have it
moved than defended.</div>

## 6. What this paper does not claim

Boundaries should not follow the org chart as a matter of preference. Sometimes the right
architecture cuts against it, and then the work is to change the org chart, which is the
whole point of Section 4. The stronger argument that microservices are themselves an
organisational artefact is a separate paper and I am not making it here.

The effect is also not inevitable. Resisting it works. It costs continuous effort, and
the failure I keep watching is that the effort is assumed rather than budgeted.
