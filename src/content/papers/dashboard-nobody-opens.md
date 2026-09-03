---
section: "5.13"
title: "The Dashboard Nobody Opens"
summary: "On observability that measures the system's health rather than the operator's question."
slug: "dashboard-nobody-opens"
published: 2025-06-05
revised: 2026-08-14
state: holding
confidence: 0.75
retires:
  - "A team whose dashboards are built from emitted signals rather than from operator questions, and whose new on-call engineers nonetheless answer the five triage questions in Section 3 within ninety seconds, without assistance, on an incident they have not seen before."
  - "Evidence that question-driven dashboards measurably slow diagnosis of novel failure modes, so that the breadth they discard costs more than the speed they buy."
  - "Query-side tooling that makes ad-hoc exploration fast enough that pre-built views stop mattering, at which point this paper is about a tool generation rather than about a practice."
history:
  - { date: 2026-08-14, note: "Text written: why bottom-up construction fails, the five triage questions, the construction rule and the ninety-second test, and the over-fitting objection. Retirement conditions added. Confidence unchanged.", confidenceAfter: 0.75 }
  - { date: 2025-06-05, note: "Listed in Section 5 with a title, a summary and a confidence value. No text.", confidenceAfter: 0.75 }
seeAlso: ["5.11", "5.6", "5.4"]
---

<div class="memo"><b>Abstract.</b> Most dashboards are assembled from the signals that
were easy to emit rather than from the questions an operator asks under pressure. The
result is a wall of accurate panels that answers none of the five things anyone actually
needs to know at 03:00, and which is therefore not opened during the incident it was
built for. The fix is to invert the construction order: enumerate the questions first,
build one view per question, and delete anything that answers none of them.
<b>Confidence 0.75.</b> Section 5 carries a cost I cannot price: views built from
questions over-fit the failures already survived.</div>

## 1. The claim

Observability is usually built bottom-up. A library emits what it can, a platform team
collects it, and a dashboard is assembled from what arrived. Every panel on that
dashboard is true. The collection is complete, the queries are correct, the alerting is
wired. And during the incident, the on-call engineer opens it, looks at it for four
seconds, and goes to the logs.

That four seconds is the measurement that matters and nobody records it. A dashboard's
value is the number of triage questions it answers without a follow-up query, rather than
the number of signals it displays.

## 2. Why bottom-up construction fails

The signals that are cheapest to emit are properties of components. The questions that
matter are properties of the interaction between components and users. These are
different objects, and no amount of correct aggregation turns one into the other.

<figure>
<pre>
  emitted (cheap)          asked (expensive)

  cpu, memory, disk        is it me or them?
  request rate             all users or some?
  error count              did it start with a deploy?
  p50 / p95 / p99          is it getting worse?
  queue depth              what breaks next?
</pre>
<figcaption>Figure 1. The left column is what most dashboards contain. The right
column is what the person looking at them is trying to find out.</figcaption>
</figure>

The right-hand column is answerable from the left-hand column, and that is exactly the
problem: it is answerable by an engineer doing arithmetic and correlation in their head,
under time pressure, with a pager going off. The dashboard has delegated the hard part.

## 3. The five questions

These are the questions I have watched people ask, in this order, in every triage I have
been part of. Any dashboard that does not answer them is decoration.

<table class="rt">
<thead><tr><th>&#167;</th><th>Question</th><th>What the panel must show</th></tr></thead>
<tbody>
<tr><td class="n" data-l="Q">1</td><td class="hd" data-l="Question">Is it us or a dependency?</td><td data-l="Panel">Error rate split by originating layer, with dependency errors attributed to the dependency rather than counted as ours.</td></tr>
<tr><td class="n" data-l="Q">2</td><td class="hd" data-l="Question">Everyone or some?</td><td data-l="Panel">The same failure rate broken by tenant, region and client version, on one view. This is the panel that most often does not exist, because the dimension was never emitted.</td></tr>
<tr><td class="n" data-l="Q">3</td><td class="hd" data-l="Question">Did it start with a change?</td><td data-l="Panel">Deploy and configuration-change markers on the same time axis as the failure. A separate deploy dashboard does not count; correlation across two browser tabs is the work being avoided.</td></tr>
<tr><td class="n" data-l="Q">4</td><td class="hd" data-l="Question">Is it getting worse?</td><td data-l="Panel">Rate of change, not level. A flat 4% error rate and a 4% rate doubling every two minutes look identical on a gauge and require opposite responses.</td></tr>
<tr><td class="n" data-l="Q">5</td><td class="hd" data-l="Question">What fails next?</td><td data-l="Panel">Saturation of the things that will queue: pools, buffers, budgets. Including the retry budget, which is the signal from 5.6 that almost nobody emits.</td></tr>
</tbody>
</table>

## 4. The construction rule, and the test

**4.1. One view per question, named after the question.** Not "Service Health". The panel
title is the interrogative sentence. This reads as unserious and it is the single change
with the largest effect, because it makes an unanswerable question visibly unanswered
rather than quietly absent.

**4.2. If a signal answers no question, it is not on a dashboard.** Keep emitting it,
keep it queryable, keep it out of the view. Storage is cheap and attention is not.

**4.3. Instrument the dashboards themselves.** Most observability stacks can report which
views were opened and when. A dashboard with no opens in ninety days is either wrong or
redundant, and in both cases deleting it is an improvement. This is the only part of the
paper with a direct measurement attached, and it is the part teams resist most.

**4.4. The ninety-second test.** Take an engineer who has been on-call for under a month.
Give them a real past incident. They should answer all five questions in ninety seconds
without asking anyone. If they cannot, the gap is a work item with an owner, and the
dashboard is the deliverable, not the diagnosis.

<div class="mtr">
<div class="r"><span class="k">Q1 us or them</span><span class="b"><i style="width:70%"></i></span><span class="v">common</span></div>
<div class="r"><span class="k">Q2 all or some</span><span class="b"><i class="f" style="width:20%"></i></span><span class="v">rare</span></div>
<div class="r"><span class="k">Q3 change markers</span><span class="b"><i style="width:45%"></i></span><span class="v">sometimes</span></div>
<div class="r"><span class="k">Q4 rate of change</span><span class="b"><i class="f" style="width:15%"></i></span><span class="v">rare</span></div>
<div class="r"><span class="k">Q5 saturation</span><span class="b"><i style="width:35%"></i></span><span class="v">partial</span></div>
</div>

<p class="dim">Figure 2. How often each question is already answered, ranked from
the systems I have reviewed. A ranking from memory, not a survey.</p>

## 5. The strongest objection

<div class="note"><b>Question-driven dashboards over-fit the failures you have already
had.</b> This is the real cost and I do not have a clean answer to it. The five questions
are derived from incidents I lived through, which means a view built to answer them is
optimised for a distribution of failures drawn from the past. The expensive incidents are
the novel ones, and novel incidents are diagnosed by exploration: broad, unfiltered,
looking at things nobody thought to put on a panel. A practice that deletes unopened
views is deleting exactly the breadth that exploration needs. The reconciliation I use is
that exploration should happen in the query interface rather than on dashboards, and that
dashboards are for triage only. That splits the tools cleanly in theory. In practice
teams with weak query tooling use dashboards for both, and for them this paper's advice
would make things worse. That is most of the gap from 0.75 to 0.9.</div>

## 6. What this paper does not claim

Component metrics are necessary. Questions 1 and 5 are answered from them, and a system
that does not emit them cannot answer either. The five questions are not a complete set;
they are what has been sufficient for first-response triage in the systems I have run.

Dashboards do not cause slow incident response. The claim is smaller and more specific: a
dashboard assembled from what was easy to emit is answering a question nobody asked, and
that cost stays invisible because almost nobody measures whether it was opened.
