---
section: "5.25"
title: "\"The Data Is Missing\" Is Not a Diagnosis"
summary: "Three bugs in one week all presented as absent data. None was. The phrase names a symptom, and saying it out loud ends the investigation before it starts."
slug: "data-is-missing"
published: 2026-09-04
revised: 2026-09-04
state: draft
confidence: 0.65
retires:
  - "A study of production incidents where reports opening with an absence claim turned out to be genuine data loss more often than they turned out to be a transport or presentation fault. The paper asserts the opposite distribution from a handful of cases and would not survive a real count going the other way."
  - "A system where the three questions in Section 3 cannot be asked cheaply, because the store is not directly queryable and the transport cannot be observed without a deploy. The procedure is only useful where each answer costs a minute, and if that is rare then this is advice for a lucky architecture."
history:
  - { date: '2026-09-04', note: 'Confidence adopted by the author; the drafter note is removed. Erratum 7.43.' }
  - { date: '2026-09-04', note: 'Retitled and given a figure after a reading pass. Erratum 7.40.' }
  - { date: '2026-09-04', note: 'First publication.' }
---

<div class="memo"><b>Abstract.</b> Three bugs arrived in one week and all three were reported the
same way: the data is missing. None of them was. One record had never been written outside a
developer's machine, one was fetched and never rendered, and one was returned unfiltered so the
right row was buried in nine hundred wrong ones. The phrase describes what the reporter saw and
smuggles in a conclusion about where the fault is, and once it has been said the investigation
starts in the wrong place. <b>Confidence 0.65.</b> Section 4 has the objection: this is three
cases and a habit, not a study.</div>

## 1. The three

**Something that only existed locally.** A capability referred to a configuration row that was
created by a setup script. The script had been run on every developer machine and never in
production, so the row did not exist there. Everything downstream reported the capability as
unknown, which read exactly like the capability had been deleted.

**Something fetched and never rendered.** A record displayed no customer. The query returned the
customer. The detail view had the fields in hand and no markup that put them on the page, and
the list view expected a different naming convention from the one the interface actually
returned, so it read every value as absent and rendered blanks.

**Something returned without a filter.** A history view showed several hundred entries instead
of six. The handler had dropped the identifier it was supposed to filter on and asked for
everything. The six were present, in the middle, indistinguishable.

Three reports, one sentence between them, three unrelated causes: an environment, a view, and a
handler. Not one of them was a storage fault, and storage was where each investigation began.

## 2. What the phrase does

"The data is missing" is not an observation. An observation is "the customer name is blank on
this screen". The phrase converts that into a claim about the far end of the system, and it does
so before anybody has looked.

It survives because it is usually said by someone who cannot see the far end. A support engineer,
an operator, a customer: they have a screen and the screen is empty, and absence at the screen
is the only vocabulary available. The failure is in accepting the vocabulary rather than in using
it.

There is a second cost, which is that it stops the report early. A person who believes data is
missing does not go on to say the version, the filter that was applied, or that the same record
looks fine on the other page. Those are the facts that locate the fault, and the confident
diagnosis suppresses them.

<figure>
<div class="dia" tabindex="0" role="group" aria-label="Diagram, scrollable">
<svg viewBox="0 0 640 180" role="img" aria-label="A row of three stages from store to interface to screen, with a question at each boundary. Ask the store directly: if the row is absent the fault is writing or seeding and the rest of the stack is innocent. Ask the interface with the same parameters the screen used: if the row is present in the store and absent from the response, the fault is a filter, a scope, a permission or a serialiser. Look at the screen: if the value is in the response and not rendered, the fault is presentation. Each answer eliminates a region rather than suggesting one.">
<rect class="ab sa" x="10" y="34" width="176" height="48" rx="3" stroke-width="1.5"/>
<text class="a" x="98" y="54" font-size="10" text-anchor="middle">the store</text>
<text class="d" x="98" y="70" font-size="8.5" text-anchor="middle">ask it directly, not the app</text>
<rect x="232" y="34" width="176" height="48" rx="3" fill="none" stroke="currentColor" stroke-width="1.5"/>
<text x="320" y="54" font-size="10" text-anchor="middle">the response</text>
<text class="d" x="320" y="70" font-size="8.5" text-anchor="middle">same parameters the screen used</text>
<rect x="454" y="34" width="176" height="48" rx="3" fill="none" stroke="currentColor" stroke-width="1.5"/>
<text x="542" y="54" font-size="10" text-anchor="middle">the screen</text>
<text class="d" x="542" y="70" font-size="8.5" text-anchor="middle">what the reporter saw</text>
<line class="sd" x1="186" y1="58" x2="228" y2="58" stroke-width="1.25" marker-end="url(#dm)"/>
<line class="sd" x1="408" y1="58" x2="450" y2="58" stroke-width="1.25" marker-end="url(#dm)"/>
<defs><marker id="dm" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10z" fill="currentColor"/></marker></defs>
<text class="d" x="10" y="22" font-size="9" letter-spacing=".9">THREE QUESTIONS, EACH ELIMINATING A REGION</text>
<text class="r" x="10" y="106" font-size="9">absent here</text>
<text class="d" x="94" y="106" font-size="9">writing or seeding. The rest of the stack is innocent.</text>
<text class="r" x="10" y="126" font-size="9">present, then gone</text>
<text class="d" x="128" y="126" font-size="9">a filter, a scope, a permission or a serialiser.</text>
<text class="r" x="10" y="146" font-size="9">returned, not shown</text>
<text class="d" x="136" y="146" font-size="9">presentation: never rendered, or a shape nobody expected.</text>
<line class="sd" x1="10" y1="160" x2="630" y2="160" stroke-width="1" opacity=".4"/>
<text class="d" x="10" y="176" font-size="9.5">None of the three suggests a cause. Each one removes a third of the system from consideration.</text>
</svg>
</div>
<figcaption>Figure 1. The value is not that the questions are clever. It is that they partition,
so an answer eliminates a region instead of pointing at one.</figcaption>
</figure>

## 3. The replacement

Three questions, in order, each answerable in about a minute.

**Is the row there?** Ask the store directly. Not through the application. If it is absent, it is
a writing or a seeding problem and the rest of the stack is innocent.

**Is it in the response?** Ask the interface with the same parameters the screen used, and read
what comes back. If the row is in the store and not in the response, the fault is a filter, a
scope, a permission or a serialiser, and it is a long way from where the report pointed.

**Does the view render it?** If the value is in the response and not on the screen, the fault is
presentation: a field never written into the template, a naming convention mismatch, a formatter
that received a shape it did not expect and produced nothing.

The value is not that the questions are clever. It is that they **partition** the system, and
each answer eliminates a region rather than suggesting one. All three of the bugs above were
reachable this way in under five minutes each, and all three were investigated for considerably
longer than that in the database.

## 4. What this is not

This is three cases and a habit. It is not a study, and I have not counted how often reports of
this shape turn out to be genuine loss. My belief is that transport and presentation faults
dominate, because there are more places for a value to be dropped between a store and a screen
than there are ways for a committed row to vanish, but belief is the right word for it.

The procedure also assumes the three questions are cheap. Where the store cannot be queried
directly, or the interface cannot be exercised without a deploy, the partition still holds and
the minute becomes an afternoon, and the habit will not form.

It is also not an argument that reporters should phrase things better. They should not have to.
The obligation is on the person receiving the report to hear a symptom and not accept a
diagnosis, which is the same obligation as everywhere else in this document.
