---
section: "5.15"
title: "SOC 2 in 120 Days"
summary: "The observation window is the schedule. Everything else is procurement and configuration, and the tooling collects evidence rather than producing controls."
slug: "soc2-120-days"
published: 2026-08-31
revised: 2026-08-31
state: draft
confidence: 0.65
retires:
  - "A SOC 2 Type II report covering an observation window shorter than three months, issued by a firm a mid-market enterprise buyer's security team accepted without qualification. The arithmetic in Section 3 is the only hard constraint this paper claims, and that would remove it."
  - "Two comparable companies reaching the same report on the same schedule at similar total cost, one using a compliance automation platform and one not. That would make Section 4 a vendor preference rather than a scheduling argument."
  - "Evidence that the exceptions section of a Type II report is not read during enterprise procurement, which would make the failure mode in Section 7 cosmetic."
  - "My own first attempt at this schedule slipping for a reason not listed in Section 5. The plan is falsified by the thing it did not anticipate, not by the things it did."
history:
  - { date: 2026-08-31, note: "Section 3 redrawn. The timeline is now a drawn figure rather than an ASCII one, and the proportional bar chart beside it is dropped because the drawing carries the proportions itself. Section 1 gained the envelope table and section 8 was corrected on the author's own evidence. No claim and no confidence value moved.", confidenceAfter: 0.65 }
  - { date: 2026-08-31, note: "First publication. Written as a plan rather than a postmortem, and the abstract says so. Confidence set at 0.65 because the adjacent work is mine and the report is not yet.", confidenceAfter: 0.65 }
seeAlso: ["5.16", "5.13", "5.4"]
---

<div class="memo"><b>Abstract.</b> A SOC 2 Type II report attests that controls operated
over a period, and the shortest period most audit firms will attest to is three months.
That single fact fixes the schedule: get the controls operating by day 30, let the window
run to day 120, and accept that the report itself arrives after it. Compliance automation
platforms of the Vanta class collapse evidence collection, which used to be the line item
that ate the calendar. They do not produce controls, they do not decide scope and they
cannot shorten the window. <b>Confidence 0.65.</b> I have operated platforms to ISO 27001,
GDPR and Bank Negara Malaysia RMiT, carried them through the security reviews banking and
telecom clients run before contract, and worked on compliance alongside partner
organisations holding signed Type II reports. I have not owned such a programme end to
end. Section 8 says what that distinction is worth.</div>

## 1. The claim

One hundred and twenty days from a standing start to the close of a SOC 2 Type II
observation window, for the Security category, over one product in one cloud account. The
work is not hard. The work is arithmetic plus procurement, and almost every plan that slips
does so on procurement.

Three things this does not claim.

**It does not claim a report in your hand on day 120.** The window closes on day 120.
Fieldwork overlaps the last month of it, and the signed report follows the close by two to
four weeks depending on the firm. Anyone selling you a report on day 120 is selling you a
Type I and hoping you do not read the cover page.

**It does not claim ISO 27001 on the same schedule.** ISO 27001 certifies a management
system through a Stage 1 and a Stage 2 audit against an accredited certification body. It
is a different object with a different calendar, and the two schedules nest rather than
compete.

<table class="rt">
<thead><tr><th style="width:150px">Claim</th><th>Scope</th><th style="width:110px">Envelope</th></tr></thead>
<tbody>
<tr><td class="hd" data-l="Claim">Two quarters</td><td data-l="Scope">ISO 27001 and SOC 2 together, readiness assessment starting in week one, control owners named rather than volunteered.</td><td class="num" data-l="Envelope">~180 days</td></tr>
<tr><td class="hd" data-l="Claim">This paper</td><td data-l="Scope">SOC 2 alone. Security only, one product, one cloud account, one legal entity.</td><td class="num" data-l="Envelope">120 days</td></tr>
</tbody>
</table>

The outer number is the one I would put in writing to an employer, because it is the one
that covers both frameworks and leaves room for the certification body's calendar. The
inner number is what the SOC 2 half of that envelope actually costs, and it is stated
separately here so that the outer number can be checked rather than taken. A schedule you
cannot decompose is a schedule nobody can hold you to.

**It does not claim the controls are good.** It claims they are attested. A report says an
auditor tested a control and describes what they found. It does not say the control was
the right one, and Section 7 is about the distance between those two sentences.

## 2. What the attestation actually is

Precision here saves a quarter, so it is worth four paragraphs.

A SOC 2 report is written by a licensed CPA firm under AICPA attestation standards. It is
not a certificate and there is no certifying body. There is a firm, an opinion and a
report with your controls printed in it.

The report is scoped to Trust Services Criteria. **Security** is mandatory and is the
common criteria set. **Availability**, **Confidentiality**, **Processing Integrity** and
**Privacy** are elective, and each one you elect adds controls you must operate and
evidence for the life of the company.

<table class="rt">
<thead><tr><th style="width:100px">Report</th><th>What it says</th><th>What it costs you in calendar</th></tr></thead>
<tbody>
<tr><td class="hd" data-l="Report">Type I</td><td data-l="Says">The controls were designed appropriately as at one date.</td><td data-l="Calendar">Days, once the controls exist. No window.</td></tr>
<tr><td class="hd" data-l="Report">Type II</td><td data-l="Says">The controls operated effectively across a stated period, tested by sampling that period.</td><td data-l="Calendar">The period. Three months at the floor, twelve at the steady state.</td></tr>
</tbody>
</table>

The buyer wants Type II. A Type I buys you a conversation and a line in a questionnaire.
It does not close an enterprise security review, because the reviewer's question is not
"did you configure this" but "did you keep doing it".

## 3. The arithmetic

<figure>
<div class="dia" tabindex="0" role="group" aria-label="Diagram, scrollable">
<svg viewBox="0 0 640 208" role="img" aria-label="A 120 day SOC 2 timeline in three segments. Day 0 to day 30 is readiness work and is compressible. Day 30 to day 120 is the observation window, ninety days, which no amount of engineering shortens. The signed report follows around day 145 on the audit firm's calendar. Fieldwork runs inside the window rather than after it, and both long poles, audit firm capacity and the risk assessment, sit in the readiness segment.">
<defs>
<marker id="dfa" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10z" fill="currentColor"/></marker>
<pattern id="dfh" width="6" height="6" patternTransform="rotate(45)" patternUnits="userSpaceOnUse"><line x1="0" y1="0" x2="0" y2="6" stroke="currentColor" stroke-width="1.4" opacity=".24"/></pattern>
</defs>
<text class="w" x="28" y="15" font-size="9" letter-spacing=".9">LONG POLES: AUDIT FIRM CAPACITY &#183; THE RISK ASSESSMENT</text>
<text class="a" x="162" y="39" font-size="11.5" font-weight="600">Window opens. Nothing after this is backfill.</text>
<text class="d" x="162" y="54" font-size="9.5">Open it before the controls are perfect.</text>
<line class="sa" x1="151" y1="60" x2="151" y2="78" stroke-width="1.25"/>
<circle class="a" cx="151" cy="60" r="2.75"/>
<rect x="28" y="78" width="123" height="48" rx="2" fill="url(#dfh)" stroke="currentColor" stroke-width="1.25"/>
<text x="89" y="100" font-size="11" text-anchor="middle">readiness</text>
<text class="d" x="89" y="115" font-size="9.5" text-anchor="middle">compressible</text>
<rect class="ab sa" x="151" y="78" width="370" height="48" rx="2" stroke-width="1.5"/>
<text class="a" x="336" y="99" font-size="12" font-weight="600" text-anchor="middle">observation window &#183; 90 days</text>
<text class="d" x="336" y="115" font-size="9.5" text-anchor="middle">elapsed time, not work. Nothing shortens it.</text>
<rect x="521" y="78" width="103" height="48" rx="2" fill="none" stroke="currentColor" stroke-width="1.25" stroke-dasharray="4 3"/>
<text x="572" y="100" font-size="9.5" text-anchor="middle">report issued</text>
<text class="d" x="572" y="115" font-size="9.5" text-anchor="middle">~25 days</text>
<line class="sd" x1="28" y1="142" x2="624" y2="142" stroke-width="1"/>
<g class="sd" stroke-width="1"><line x1="28" y1="137" x2="28" y2="147"/><line x1="151" y1="137" x2="151" y2="147"/><line x1="521" y1="137" x2="521" y2="147"/><line x1="624" y1="137" x2="624" y2="147"/></g>
<g class="d" font-size="9.5"><text x="28" y="161">day 0</text><text x="151" y="161" text-anchor="middle">30</text><text x="521" y="161" text-anchor="middle">120</text><text x="624" y="161" text-anchor="end">~145</text></g>
<line class="sd" x1="398" y1="147" x2="398" y2="177" stroke-width="1"/>
<line class="sd" x1="398" y1="177" x2="512" y2="177" stroke-width="1.25" marker-end="url(#dfa)"/>
<text class="d" x="624" y="197" font-size="9.5" text-anchor="end">fieldwork runs inside the window, not after it</text>
</svg>
</div>
<figcaption>Figure 1. The only irreducible segment is the ninety days in the middle, and it
is the majority of the schedule. Everything left of day 30 is procurement and
configuration, both compressible. Everything right of day 120 belongs to the audit firm.
Most plans that slip do so on the two long poles, and neither of them is engineering.</figcaption>
</figure>

The window is the schedule. Once that is understood, the plan writes itself backwards: the
only question that matters in week one is what has to be true on day 30, because the day 30
date is the one that decides the day 120 date.

This inverts the instinct. The instinct is to get the controls right and then start the
clock. The correct move is to start the clock at the earliest defensible moment and repair
in flight, because a control operating imperfectly for ninety days produces a report with
an exception in it, and a perfect control operating for thirty days produces no report at
all.

## 4. What the platform does, and what it does not

Compliance automation platforms are the reason the number is 120 rather than 300. They are
also routinely misread as doing the whole job, so both columns matter.

<table class="rt">
<thead><tr><th>The platform does this</th><th>The platform does not do this</th></tr></thead>
<tbody>
<tr><td class="hd" data-l="Does">Connects to the cloud accounts, identity provider, HR system, endpoint agent, code host and ticket tracker, and reads their state continuously.</td><td data-l="Does not">Decide what is in scope. Scope is a commercial decision about what you are willing to be audited on, and it belongs to whoever signs the contracts.</td></tr>
<tr><td class="hd" data-l="Does">Turns each control into a test that passes or fails today, with a timestamp and a history.</td><td data-l="Does not">Make a failing control pass. A dashboard reporting an unencrypted volume has done its entire job.</td></tr>
<tr><td class="hd" data-l="Does">Ships policy templates a small company can adopt in an afternoon instead of a month.</td><td data-l="Does not">Make an adopted policy true. A policy nobody follows is an exception waiting to be written into your report.</td></tr>
<tr><td class="hd" data-l="Does">Tracks training, policy acknowledgement, background checks and onboarding per person.</td><td data-l="Does not">Perform your access reviews. Somebody still has to read the list and remove the people who should not be on it.</td></tr>
<tr><td class="hd" data-l="Does">Hands the auditor a portal with the evidence already assembled. This is the quarter of the project that used to be spent taking screenshots.</td><td data-l="Does not">Replace the auditor. The opinion is signed by a CPA firm, and the platform is not one.</td></tr>
<tr><td class="hd" data-l="Does">Keeps a vendor register and chases subprocessor documentation.</td><td data-l="Does not">Assess the vendor. Collecting a report is not reading it.</td></tr>
</tbody>
</table>

Vanta, Drata, Secureframe, Sprinto and the open implementations differ on integration
coverage, on how much of the policy set is opinionated, and on whether the auditor
relationship is bundled. They do not differ on the line above: all of them automate
evidence, none of them automate control.

The choice matters less than the date you make it. Any of them, connected on day 5, beats
the best of them connected on day 40.

## 5. The schedule

<table class="rt">
<thead><tr><th style="width:90px">Days</th><th>Work</th><th style="width:1%">Long pole</th></tr></thead>
<tbody>
<tr><td class="n" data-l="Days">0 to 10</td><td class="hd" data-l="Work">Scope. Which product, which cloud accounts, which legal entity, which criteria. Security only unless a signed contract already names another category. Control owners named by person, with calendar time allocated.</td><td data-l="Long pole"></td></tr>
<tr><td class="n" data-l="Days">0 to 10</td><td class="hd" data-l="Work">Engage the audit firm. Book the fieldwork dates before the window opens.</td><td data-l="Long pole"><span class="chip warn">Yes</span></td></tr>
<tr><td class="n" data-l="Days">5 to 20</td><td class="hd" data-l="Work">Connect the platform to everything it can reach. Read the failing list without flinching. Most of it is configuration and most of the configuration is a day's work each.</td><td data-l="Long pole"></td></tr>
<tr><td class="n" data-l="Days">10 to 30</td><td class="hd" data-l="Work">Close the technical gaps. Multi-factor everywhere, encryption at rest and in transit, log retention set to a number you can defend, backups restored rather than configured, production access reduced to the people who need it.</td><td data-l="Long pole"></td></tr>
<tr><td class="n" data-l="Days">10 to 30</td><td class="hd" data-l="Work">Close the human gaps. Policies adopted and acknowledged, training assigned, background checks run, onboarding and offboarding that produce a ticket rather than a memory.</td><td data-l="Long pole"></td></tr>
<tr><td class="n" data-l="Days">20 to 30</td><td class="hd" data-l="Work">Risk assessment and vendor register. Nobody automates these two and auditors read both closely.</td><td data-l="Long pole"><span class="chip warn">Yes</span></td></tr>
<tr><td class="n" data-l="Days">30</td><td class="hd" data-l="Work">Window opens. From this date forward nothing is backfill.</td><td data-l="Long pole"></td></tr>
<tr><td class="n" data-l="Days">30 to 120</td><td class="hd" data-l="Work">Operate. One access review inside the window, one restore actually executed, one incident response exercise, change management on every merge that reaches production.</td><td data-l="Long pole"></td></tr>
<tr><td class="n" data-l="Days">90 to 120</td><td class="hd" data-l="Work">Fieldwork. The auditor asks for populations, samples them, and finds the thing you forgot. Answer in days, not weeks.</td><td data-l="Long pole"></td></tr>
<tr><td class="n" data-l="Days">120</td><td class="hd" data-l="Work">Window closes. Report follows.</td><td data-l="Long pole"></td></tr>
</tbody>
</table>

Two rows carry the long pole marker and neither is technical. Audit firm capacity is an
external dependency you do not control, and the risk assessment is the deliverable that
cannot be produced by an integration because it is an argument about your own business.

## 6. Rules

Normative language, applied to this programme.

**6.1.** The observation window <span class="kw">MUST</span> open before the controls are
perfect. Ninety days of an imperfect control produces a report with an exception. Thirty
days of a perfect one produces nothing.

**6.2.** The first report <span class="kw">MUST</span> cover Security only, unless a
signed contract already names another category. Categories are cheap to add to the second
report and expensive to carry through the first.

**6.3.** Every control <span class="kw">MUST</span> have an owner who is a person. A
control owned by "engineering" is owned by nobody, and that is discovered in week eleven.

**6.4.** Evidence <span class="kw">SHOULD</span> be a byproduct of work that would happen
anyway. An access review that exists only for the auditor will not survive its second year,
and the second year is where the exceptions appear.

**6.5.** The audit firm <span class="kw">MUST</span> be engaged before the window opens
rather than before it closes. Their capacity is the schedule's only dependency you cannot
buy your way out of late.

**6.6.** A failing control <span class="kw">MUST NOT</span> be closed by narrowing its
description until it passes. That is the single move that turns an attestation into a lie.
The exceptions section exists so that you never have to make it.

**6.7.** The platform's readiness percentage <span class="kw">SHOULD</span> be read as a
coverage metric rather than a security metric. It measures how much of the estate the
platform can see, and it goes down when you connect something new, which is the correct
direction.

**6.8.** Anything the platform cannot reach <span class="kw">MUST</span> be written down.
The unmanaged laptop, the contractor's own machine, the legacy virtual machine nobody logs
into. An unlisted system is undiscovered rather than out of scope.

## 7. The named failure mode

**Evidence complete, control absent.** The dashboard reads green because every automated
test passes, and every automated test is a test of configuration. Configuration is the part
that automates. The controls that fail in practice are the human ones: an access review
performed by clicking approve on a list nobody read, an incident response plan exercised
once in week three and never again, a vendor register that stopped being updated in month
two.

The tell is timestamps. Work that actually happened is spread across the window. Work that
was assembled for the auditor shares a date. A reviewer who has read a hundred of these
reports checks the spread before they check the content, and so should you, monthly, while
there is still time to fix it.

This is the same failure as the one in paper 5.13, arriving through a different door. A
measurement that nobody acts on is not a measurement, and a control that produces evidence
without producing a decision is not a control.

## 8. What I have not done

I have built and operated platforms under ISO 27001, GDPR and Bank Negara Malaysia RMiT
requirements for banking and telecom clients, and I have taken those systems through the
security reviews and audits those clients run before they will sign.

I have also worked on compliance alongside partner organisations that hold signed SOC 2
Type II reports, which is where the specifics in Sections 4 through 7 come from. That work
is real and it is the reason this paper is not theory. It is also not the same thing as
having owned the programme: my position in it was a partner's, contributing to somebody
else's scope, somebody else's control owners and somebody else's opinion letter.

The distinction matters enough to print. Working inside a Type II estate teaches you what
the evidence looks like, where the sampling bites and which controls fail in month five.
Owning the programme end to end teaches you what it costs to be the person who books the
firm, sets the scope and signs off the risk assessment. I have the first and I have
contributed to the second. That is why the confidence value is 0.65 rather than 0.85, and
it moves when the balance changes. This page will say which way and why.
