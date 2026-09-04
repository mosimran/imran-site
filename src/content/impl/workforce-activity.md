---
section: "3.10"
title: "Attendance as a ledger, and the line it eventually bills"
summary: "One append-only record of who was where, projected into payroll truth, a dispatch estimate and a liveness indicator, and carried through to the invoice line it justifies."
slug: "workforce-activity"
revised: 2026-09-04
state: production
stack: ["append-only ledger", "projections", "mobile capture", "geofencing", "payroll export", "revenue attribution"]
result: []
fallsOverAt: "The roster. Exceptions like late and absent are differences from an expectation, so a deployment without scheduling generates false exceptions from the first hour and the feature is rejected before anyone sees it work. The limit is organisational readiness rather than load."
failures:
  - { id: "5.1", status: fixed, note: "Overnight shifts split across a date boundary. Timestamps are stored in UTC and a working day is a local calendar day, so a shift beginning at nine in the evening and ending at five the next morning becomes two days of partial hours, or one day of zero. Payroll totals are wrong in a way that nobody notices until somebody is paid wrong. A shift inherits the day it opened on, which is the rule a human already uses when they say what day they worked." }
  - { id: "5.2", status: fixed, note: "A geofence that blocks rather than flags. Location drifts indoors, in basements and in steel-framed buildings, so a hard boundary check refuses a check-in from somebody standing at the site. The worker is then stranded at the start of their day with no way to proceed, which converts a data quality nicety into an operational outage. The check-in is accepted and marked for review, and integrity becomes a field on the record rather than a gate in front of it." }
  - { id: "5.3", status: fixed, note: "A scheduled job marking people offline. Liveness derived by a periodic sweep means the sweep is now load-bearing: if it stalls, everyone appears present forever, and if it runs against a stale clock, everyone appears absent at once. Both are system-wide and neither is visible in the data being swept. Liveness is computed at read time from the last heartbeat, which cannot fail separately from the thing asking the question." }
  - { id: "5.4", status: fixed, note: "Revenue double counted on crew work. When two people complete one job and each is credited with the line, the totals say twice the money was earned. Bonus schemes and utilisation reports built on that number reward sending more people, which is precisely backwards. Credit is fractional and sums to one, so a job is worth what it was worth however many people attended." }
  - { id: "5.5", status: accepted, note: "Unclosed shifts have to stop somewhere and every choice is wrong for somebody. Accruing to the present moment turns one forgotten check-out into forty hours of overtime. Discarding the shift loses a day somebody worked. It stops accruing at the rostered end, which is correct for the common case of a forgotten tap and wrong for genuine unrostered overtime, and it is visible as an exception so a person can restore what the rule removed." }
  - { id: "5.6", status: open, note: "Two reports can define the same word differently and both be internally consistent. If a utilisation view and an attendance summary each decide what counts as late, and one uses a grace period the other does not, they disagree about identical underlying records and both look correct to whoever built them. The answer is that a definition is a shared object rather than a constant in two files, and enforcing that across reports written months apart is a discipline nobody has automated here." }
  - { id: "5.7", status: open, note: "Attribution defaults quietly become measurement. The chain that decides who a line of work belongs to falls back through several rules, and the last of them was whoever created the record. In an operation where one office administrator enters most work, that rule attributes nearly all field revenue to a person who has never been to a site. It is disabled, which fixes the visible symptom and not the underlying one: a fallback that is wrong often enough to disable is a fallback that was answering a question nobody had asked." }
---

<div class="memo"><b>How to read this note.</b> This is the reference design for turning field
attendance into payroll and into billable lines: the constraints it operates under, the standard
decisions, and the failure modes this shape has. It is a solution path for a system like the one
built rather than a disclosure of that system's internals. Schema, table and field names,
identifiers, client versions, thresholds, customer configuration and the internal document
numbering are deliberately absent.
<br><br>This note publishes no measurements, and section 4 names the ones that would matter.</div>

## 1. The constraint

Three consumers want to know where somebody was, and they do not want the same answer.

**Payroll** wants a defensible record. It is the input to money paid to a person, it is retained
for years, it will be produced in a dispute, and it must never change after the fact without the
change itself being recorded.

**Dispatch** wants a working estimate, right now. It is deciding who to send, and an answer that
is approximately right immediately beats an answer that is exactly right in an hour.

**The screen** wants to know whether a person is currently connected, which is neither of those.
It is a property of the last few minutes and it is worthless tomorrow.

One field cannot hold all three. The instinct is a single status enum with values like present,
en route, on break and offline, and it fails on contact: a person can be rostered and absent, or
absent and connected, or working and unreachable. Every combination is real and an enum admits
one axis.

The second constraint arrives at the other end of the pipeline. **A billed line has to be
attributable to a person**, because that is what makes commission, utilisation and bonus
schemes possible, and the attribution must be correct when several people did the work and
honest when nobody knows.

## 2. The decisions, and where each is enforced

<figure>
<div class="dia" tabindex="0" role="group" aria-label="Diagram, scrollable">
<svg viewBox="0 0 640 300" role="img" aria-label="A mobile client writes events into a single append-only ledger: check-in, break, shift end, location. From that one ledger three separate projections are derived, and they are separate fields rather than one status: attendance as payroll truth, activity as a dispatch estimate, and liveness computed at read time from the last heartbeat. A locked day flows to payroll. Separately, a completed visit produces an invoice line, and attribution walks an ordered rule set to decide whose line it is, splitting credit fractionally when several people attended so the total sums to one job.">
<defs><marker id="wa" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10z" fill="currentColor"/></marker></defs>
<rect x="10" y="40" width="96" height="46" rx="3" fill="none" stroke="currentColor" stroke-width="1.25"/>
<text x="58" y="60" font-size="10" text-anchor="middle">the phone</text>
<text class="d" x="58" y="76" font-size="8.5" text-anchor="middle">writes events</text>
<rect class="ab sa" x="126" y="40" width="152" height="46" rx="3" stroke-width="1.75"/>
<text class="a" x="202" y="60" font-size="10" text-anchor="middle">one ledger</text>
<text class="d" x="202" y="76" font-size="8.5" text-anchor="middle">append only, never edited</text>
<line class="sd" x1="106" y1="63" x2="122" y2="63" stroke-width="1.25" marker-end="url(#wa)"/>
<text class="d" x="300" y="26" font-size="9" letter-spacing=".9">THREE PROJECTIONS, THREE QUESTIONS, NOT ONE ENUM</text>
<rect x="300" y="34" width="164" height="30" rx="3" fill="none" stroke="currentColor" stroke-width="1.5"/>
<text x="382" y="53" font-size="9.5" text-anchor="middle">attendance: payroll truth</text>
<rect x="300" y="70" width="164" height="30" rx="3" fill="none" stroke="currentColor" stroke-width="1.25"/>
<text x="382" y="89" font-size="9.5" text-anchor="middle">activity: dispatch estimate</text>
<rect x="300" y="106" width="164" height="30" rx="3" fill="none" stroke="currentColor" stroke-width="1.25" stroke-dasharray="4 3"/>
<text x="382" y="121" font-size="9.5" text-anchor="middle">liveness: computed on read</text>
<text class="d" x="382" y="133" font-size="8" text-anchor="middle">no sweep to fail</text>
<g class="sd" stroke-width="1.25">
<line x1="278" y1="56" x2="296" y2="49" marker-end="url(#wa)"/>
<line x1="278" y1="63" x2="296" y2="85" marker-end="url(#wa)"/>
<line x1="278" y1="72" x2="296" y2="118" marker-end="url(#wa)"/>
</g>
<rect x="486" y="34" width="144" height="30" rx="3" fill="none" stroke="currentColor" stroke-width="1.5"/>
<text x="558" y="53" font-size="9.5" text-anchor="middle">locked day, payroll</text>
<line class="sd" x1="464" y1="49" x2="482" y2="49" stroke-width="1.25" marker-end="url(#wa)"/>
<line class="sd" x1="10" y1="158" x2="630" y2="158" stroke-width="1" opacity=".4"/>
<text class="d" x="10" y="180" font-size="9" letter-spacing=".9">THE SAME VISIT, ON ITS WAY TO A BILL</text>
<rect x="10" y="190" width="120" height="42" rx="3" fill="none" stroke="currentColor" stroke-width="1.25"/>
<text x="70" y="208" font-size="9.5" text-anchor="middle">visit completed</text>
<text class="d" x="70" y="223" font-size="8.5" text-anchor="middle">by one or several</text>
<rect class="ab sa" x="150" y="190" width="230" height="42" rx="3" stroke-width="1.5"/>
<text class="a" x="162" y="207" font-size="9.5">whose line is it? first match wins</text>
<text class="d" x="162" y="223" font-size="8.5">explicit, then who reported it done, then assigned</text>
<line class="sd" x1="130" y1="211" x2="146" y2="211" stroke-width="1.25" marker-end="url(#wa)"/>
<rect x="400" y="190" width="230" height="42" rx="3" fill="none" stroke="currentColor" stroke-width="1.5"/>
<text x="515" y="207" font-size="9.5" text-anchor="middle">credit splits, and sums to one</text>
<text class="d" x="515" y="223" font-size="8.5" text-anchor="middle">a two-person job is worth one job</text>
<line class="sd" x1="380" y1="211" x2="396" y2="211" stroke-width="1.25" marker-end="url(#wa)"/>
<text class="r" x="10" y="258" font-size="9">Unmatched lines stay visible as unclassified. A line that cannot be attributed is a</text>
<text class="r" x="10" y="272" font-size="9">reporting gap somebody can close, and a line silently dropped is a number that lies.</text>
<text class="d" x="10" y="292" font-size="9.5">The console does not ship before the thing that produces its data, or it is a demo with a refresh button.</text>
</svg>
</div>
<figcaption>Figure 1. One writer, one ledger, three readers who disagree about what they are
asking. The bottom half is the same day arriving at an invoice.</figcaption>
</figure>

**2.1. One append-only ledger, not a table per event type.** Check-in, break, shift end and
location are one kind of fact: something happened to somebody at a time. Split across separate
tables they are a join every time anybody asks a real question, and the retention rule, the
audit rule and the correction rule have to be implemented four times and will diverge. One
ledger means the record is **enforced at write**: nothing is edited, corrections are new
entries, and the audit trail is the storage rather than a feature added to it.

**2.2. Three axes as separate fields.** Attendance, activity and liveness answer different
questions over different time horizons and are allowed to disagree. Collapsing them into one
status is the decision that looks tidy on day one and produces a report nobody can explain in
month six.

**2.3. Liveness is computed at read time.** Derived from the last heartbeat when somebody asks,
rather than written by a job that marks people offline. A periodic sweep becomes a
single point of failure for a fact that is not worth one, and its failure mode is silent and
total. Nothing computed on read can be stale in a way the reader cannot see.

**2.4. UTC in storage, local days in logic.** Every timestamp is stored in one zone and every
business rule runs on the calendar day a human would name. A shift belongs to the day it opened
on, which is what somebody means when they say what day they worked, and which stops an
overnight shift becoming two days of partial hours.

**2.5. Attribution is an ordered rule with fractional credit.** Explicit assignment first, then
whoever reported the work finished, then whoever it was assigned to. First match wins, the rule
that fires is recorded so the answer can be explained, and when several people attended the
credit divides and sums to one. A line nothing can attribute is surfaced as unclassified rather
than dropped, because a visible gap is a task and a silent one is a wrong total.

**2.6. Integrity is a flag, never a gate.** Location that looks wrong marks the record for
review and lets the person start their day. Anything that can refuse a check-in will eventually
refuse a correct one, and the cost of that is a worker standing outside a building unable to
work.

## 3. Why this is a product decision rather than plumbing

The reason to build the ledger properly is that three departments are going to argue about it,
and the argument will be settled by whichever number is easiest to produce.

Payroll disputes are the sharp end. Somebody says they worked a day the system does not show, and
the answer has to be a record with a history rather than a current value, because a current value
invites the question of what it used to be. An append-only ledger answers that by construction,
which is worth more than any feature built on top of it.

The attribution half decides whether the operation can pay people for outcomes. Commission,
utilisation and bonus schemes all need to know whose work produced a number, and every one of
them is corrosive if the attribution is wrong: a scheme that rewards crew size, or that credits an
administrator for field work, changes behaviour immediately and in the wrong direction. **A
measurement that determines pay is not a report. It is an incentive**, and it is worth being
slower and more explicit about than anything else in the pipeline.

There is a sequencing rule underneath all of it that generalises past this system. **The console
does not ship before the thing that produces its data.** A live operations view built ahead of
the mobile client that writes the events is a demonstration with a refresh button, it will be
evaluated as the product, and it will be judged as broken by the first person who compares it
with the yard.

## 4. Figures

**This note reports none.** The four that would say whether it works are the proportion of shifts
closed by a person rather than by the rostered-end rule, the rate of integrity-flagged check-ins
and how many survive review, the share of billed lines that reach an attribution rule other than
the fallback, and the count of payroll disputes resolved by pointing at the ledger.

The third is the one I would want first. If most lines are attributed by the last rule in the
chain, the ordered rule set is decoration and the attribution is a guess with a procedure in
front of it.

## 5. What I would do differently

**Define the vocabulary once, in one place, before the second report is written.** Failure 5.6 is
open and it is the one that erodes trust rather than uptime: two views that disagree about what
"late" means are both correct and the operation stops believing either. A shared definition object
that every report must consult is cheap at the start and a migration later.

**Require the roster before enabling attendance, in the product rather than in the documentation.**
Exceptions are differences from an expectation, so a deployment without scheduling produces false
lateness from the first hour, and the feature is rejected before anybody sees it work. This is
stated as a prerequisite and would be better as a gate.

**Never let an attribution fallback stay on by default.** Failure 5.7 is disabled rather than
fixed. The deeper lesson is that the last rule in a chain answers a question nobody asked, and a
rule that has to be switched off in production is evidence that the chain should have ended one
step earlier and returned nothing.
