---
section: "5.16"
title: "The Only SOC 2 Hack Is Scope"
summary: "Every shortcut that operates on evidence fails in the exceptions section. The one that works operates on scope, and on owning less infrastructure to evidence."
slug: "soc2-scope-hack"
published: 2026-08-31
revised: 2026-08-31
state: draft
confidence: 0.6
retires:
  - "An enterprise security team accepting a compliance claim, on a deal above their standard approval threshold, without reading the report body and its exceptions section. That removes the mechanism the whole paper rests on."
  - "A company reaching a clean Type II with self-hosted database, identity and CI at comparable total engineering cost to one that bought all three managed, measured across two audit cycles rather than one."
  - "Audit firms routinely accepting evidence created after the observation window closed, which would make Section 2 wrong about what sampling catches."
  - "A startup that scoped all five trust categories on its first report and reached it on the same schedule and budget as a Security-only peer."
history:
  - { date: 2026-08-31, note: "Editorial pass, same day, after the author flagged the prose. The draft leaned on a two-beat construction, a claim followed by its own negation, about a dozen times, which reads as rhythm standing in for explanation. Each one is replaced with the concrete thing that actually happens. No claim, figure, retirement condition or confidence value moved, so this is a revision to the writing rather than to the argument.", confidenceAfter: 0.6 }
  - { date: 2026-08-31, note: "First publication. Written as a companion to 5.15: that paper is the schedule, this one is the scope. Confidence 0.60, lower than 5.15, because the cost argument in Section 4 is the part I have watched rather than measured.", confidenceAfter: 0.6 }
seeAlso: ["5.15", "5.4", "5.5"]
---

<div class="memo"><b>Abstract.</b> Startups look for the shortcut through SOC 2, and there
is one. It lives in two decisions you make in the first fortnight: what you agree to be
audited on, and how much infrastructure you own. Own less and there is less to evidence,
twice a year, for as long as the company exists. People reach instead for the evidence,
the firm or the tooling, and all three of those attempts surface in the same place: the
exceptions section, which is the part a buyer's security team actually reads.
<b>Confidence 0.60.</b> Lower than the companion paper 5.15, because Section 4 is a cost
argument I have watched play out rather than one I have measured.</div>

## 1. The claim

A bold startup can compress SOC 2 substantially, and the compression is entirely on the
input side. You choose a smaller thing to be audited on, and you choose to own fewer moving
parts. Both decisions are made in the first two weeks and neither can be revisited cheaply
afterwards.

What will not compress is the window, which paper 5.15 covers, and the evidence, which
this paper is about. Every attempt I have watched to compress the evidence turned into an
attempt to fake it, and every one of those cost more to unwind than doing the work would
have cost in the first place.

## 2. Three hacks that do not work

**Buy the cheapest opinion.** The report names the firm on its cover. Enterprise security
teams keep informal lists of firms whose reports they discount, and the report body prints
the tests performed, so a thin audit reads thin to anyone who has read a thick one. The
reviewer opens it, counts the tests, and comes back asking you the questions you paid the
firm to answer on your behalf. You are in the same meeting you were trying to skip, three
months later and several thousand dollars down.

**Backfill the evidence.** A Type II is tested by sampling across the observation window.
Sampling is the specific thing that catches backfill, because the sample is drawn from a
population you supply and the artifacts carry their own dates. Twelve access review records
created in the same afternoon is the easiest pattern in the entire discipline to spot. And
once an auditor suspects fabricated evidence, they stop testing your controls and start
testing you. That is a much longer engagement, it involves your lawyers, and it does not
end with a report.

**Claim the status without the report.** There is no such thing as being SOC 2 certified.
There is a report or there is not. The questionnaire asks for the PDF, the security review
asks for the bridge letter covering the gap since the window closed, and a badge on a
marketing site answers neither.

<figure>
<pre>
   compressible                        not compressible
   ------------                        ----------------
   trust categories                    the observation window
   systems in scope                    the sampling method
   entities in scope                   the auditor's independence
   infrastructure you own              the exceptions section
   number of vendors                   whether the buyer reads it
        |                                      |
        v                                      v
   decided in week one              discovered in month five
</pre>
<figcaption>The left column is a set of decisions. The right column is a set of facts.
Most failed programmes spent their effort on the right.</figcaption>
</figure>

## 3. The scope decisions that actually compress the work

<table class="rt">
<thead><tr><th style="width:140px">Decision</th><th>The compressing choice, and what it costs</th></tr></thead>
<tbody>
<tr><td class="hd" data-l="Decision">Trust categories</td><td data-l="Choice">Security only. Availability is the one people add reflexively, and it commits you to uptime targets you must then meet <i>and</i> evidence. Add it on the second report, when a buyer has asked for it by name.</td></tr>
<tr><td class="hd" data-l="Decision">Systems</td><td data-l="Choice">One production cloud account, one region, unless a contract says otherwise. The demo account somebody spun up in 2024 and forgot is still in scope. You have simply not found it yet, and the auditor's discovery step is designed to.</td></tr>
<tr><td class="hd" data-l="Decision">Entities</td><td data-l="Choice">The single legal entity that signs customer contracts. A group structure adopted for tax reasons does not have to be adopted for audit reasons.</td></tr>
<tr><td class="hd" data-l="Decision">People</td><td data-l="Choice">Everyone with production access, contractors included. Companies push hardest on this row and it does not move. The only lever that works is taking access away from people who do not need it, which is a fortnight of awkward conversations and then it is done.</td></tr>
<tr><td class="hd" data-l="Decision">Products</td><td data-l="Choice">The product being sold. An internal tool is separable only if it shares no data path with production, and it almost always shares one through the same database credentials.</td></tr>
<tr><td class="hd" data-l="Decision">Endpoints</td><td data-l="Choice">One operating system, one device management tool, chosen before the twentieth laptop. After the twentieth it stops being a decision and becomes a migration.</td></tr>
<tr><td class="hd" data-l="Decision">Vendors</td><td data-l="Choice">Every subprocessor touching customer data goes in the register and is reviewed. Fewer vendors is a shorter register, and this is the only lever on that row.</td></tr>
<tr><td class="hd" data-l="Decision">Time</td><td data-l="Choice">Open the window early at whatever quality you have. See 5.15 section 6.1. An exception in the report is survivable; a report that does not exist is not.</td></tr>
</tbody>
</table>

## 4. Buy the boring thing

This is the decision with the longest tail and it is usually made for the wrong reason.

Every self-hosted component is a control surface you own forever: patching, backup, access
management, monitoring, and the evidence for all four, produced twice a year, by people who
would rather be building the product. The managed equivalent moves most of that to a
subprocessor whose own report you file once and reference thereafter.

The comparison teams actually run is the monthly invoice against the cost of an instance.
That comparison is wrong by the entire audit programme. The honest version adds two audit
cycles a year, for as long as the company exists, plus the hours spent explaining a bespoke
component to a reviewer who has never seen one before and is therefore obliged to ask more
questions about it.

Self-host when the component is your product. Buy it when it is not. A startup that
self-hosts its identity provider to save a subscription has purchased a control it will pay
for in every security review it ever faces, and paper 5.4 is about exactly this shape of
invoice.

## 5. Separation of duties with four engineers

You cannot separate duties you do not have enough people to separate, and pretending
otherwise is the most common self-inflicted wound in a small company's first audit.

Write the awkward sentence into the control description yourself: there are four of us, the
founder both requests and approves production access, and here is what we do about it.
Then do something about it. A second person reviews every production change, an alert
fires on anything that bypasses review, and the founder's own approvals are listed for
someone else to look at monthly.

Audit firms see companies this size constantly and yours is not the interesting one. What
draws attention is a four-person company presenting an org chart that implies forty,
because the auditor then has to work out which parts of it are real.

An honest compensating control produces a clean finding. An invented org chart produces a
question about everything else in the report.

## 6. What it costs, and why there are no numbers here

The line items are the audit firm's fee, the compliance platform subscription, a
penetration test if a buyer asks for one by name, and engineering time. Engineering time is
the largest of the four and the one that never appears in the budget, because it is spent
by people who are already paid.

No amounts appear on this page. Audit and platform pricing move, they vary by headcount and
scope, and this site does not publish a number it cannot source. I would be inventing a
figure on a page that spends eight sections arguing against invented figures.

## 7. The named failure mode

**The logo without the report.** The badge goes on the website, the badge wins the meeting,
and then the buyer's security team asks for the report and the bridge letter. The
exceptions section says the access review was performed once during a twelve-month window.
Nobody says no. You get a remediation plan, a follow-up call in six weeks and a slot next
quarter. For a company with nine months of runway, next quarter is a no delivered politely
enough that you keep forecasting the deal.

The slower version does more damage. The team concludes that the report is paperwork,
runs the next cycle as paperwork, and by year three the controls live entirely inside the
compliance dashboard. Then something breaks at two in the morning and the dashboard is
where you find out they had stopped being real in year two.

## 8. When not to do this at all

If no buyer has asked for it, a SOC 2 is a cost with no revenue behind it and an operating
burden that never ends. Start when a named buyer asks, or when the same request keeps
arriving from one segment. Seeing a badge on a competitor's homepage is envy
with a budget line attached rather than a trigger.

The bold move for a startup nobody has asked yet is to say so out loud, publish what it
actually does about security, and spend the quarter on the product. You will have one
awkward sales call about it. You will also still have a product.
