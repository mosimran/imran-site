---
section: "3.4"
title: "Analytics migration to ClickHouse"
summary: "Moving analytical workload off a row store onto a columnar one without downtime, under dual writes, with the rollback built before the cutover rather than after it."
slug: "olap-migration"
revised: 2026-09-03
state: complete
stack: ["ClickHouse", "Kafka Connect", "Airflow"]
result: []
fallsOverAt: "The sort key. A columnar store answers a query that matches its ordering in a fraction of the time and answers one that does not by reading more than the row store would have. The limit is not row count, it is the distance between the ordering chosen at migration time and the queries that arrive two years later."
failures:
  - { id: "5.1", status: fixed, note: "Dual writes diverge, because there is no transaction spanning two stores. One write succeeds, the other fails on a timeout or a schema rejection, and nothing surfaces it: both systems are up, both are serving, and the numbers drift apart slowly. The answer is continuous reconciliation rather than a spot check at the end, comparing counts and column checksums per partition on a schedule, with the old store remaining the source of truth until the comparison has been clean for longer than the longest reporting window." }
  - { id: "5.2", status: fixed, note: "The seam between backfill and live stream produces duplicates or a gap, and which one you get depends on an ordering nobody controls. Starting the stream after the backfill loses everything written during it; starting it before duplicates the overlap. The standard answer is to make the write idempotent on a natural key and deliberately overlap: start the stream first, backfill behind it, and let the overlap collide harmlessly. A pipeline that cannot be run twice safely cannot be resumed after a failure either, which is the same property." }
  - { id: "5.3", status: open, note: "Query semantics are not identical between engines and the differences are quiet. NULL ordering, integer division, timezone handling at DST boundaries, float against decimal accumulation, and approximate DISTINCT that is exact enough for a dashboard and wrong for a finance report. Nothing fails. A number changes in the third significant figure and is discovered by somebody who reconciles by hand. The only defence is differential testing on real query shapes, and the coverage is never complete." }
  - { id: "5.4", status: accepted, note: "The sort key is chosen against the queries that exist at migration time and is expensive to change afterwards, because changing it means rewriting the table. Query patterns move, and a store that was fast becomes a store that is fast for the old dashboard. The decision is to accept a periodic rewrite as a cost of the architecture rather than to pretend a single ordering serves everything, and to size the tables so that a rewrite fits in a maintenance window." }
  - { id: "5.5", status: open, note: "The rollback path decays from the moment it stops being exercised. Dual writes are kept for a period after cutover so that reverting is possible, and during that period nobody reads from the old store, so a schema change or a broken consumer goes unnoticed until the day it is needed. An untested rollback is not a rollback. Running production reads against the old store on a schedule is the only thing that keeps it honest, and it is the first thing dropped when the migration is declared finished." }
---

<div class="memo"><b>How to read this note.</b> This is the reference design for moving an
analytical workload from a row store to a columnar one under live traffic: the constraint, the
decisions that follow, and the failure modes this migration has. It is a solution path for a
system like the one built rather than a disclosure of that system's internals. Table names,
volumes, schedules and the specific queries are deliberately absent, and the pipeline components
in the stack describe the shape of the thing rather than a certified inventory.
<br><br>The figures this page carried until 2026-09-03 (fourteen billion rows, a p95 falling from
9.4 seconds to 380 milliseconds, and a rollback executed at 02:40) were the handoff prototype's
and are removed under <a href="/errata/#e7-19">erratum 7.19</a>. No replacements are invented.</div>

## 1. The constraint

Analytical queries on a transactional database work until they do not, and the transition is
not gradual.

A row store fetches whole rows. An analytical query wants three columns out of forty across a
year of history, so the engine reads roughly thirteen times the data it needs, and the cost
grows with total table size rather than with the size of the answer. For a long time this is
fine and the fix is an index. Then a dashboard that took two seconds takes forty, and the
honest description is that the storage model stopped matching the question.

The migration itself is not the hard part. **The hard part is that the analytics were already
load-bearing.** Reporting surfaces sit in front of customers, operators run their day from
them, and regulated clients have reporting obligations that do not pause. So there is no
window, no maintenance weekend, and no version of this where the numbers are allowed to be
wrong for an afternoon while a cutover settles.

## 2. The decisions, and where each one is enforced

<figure>
<div class="dia" tabindex="0" role="group" aria-label="Diagram, scrollable">
<svg viewBox="0 0 640 274" role="img" aria-label="Writes fan out from the application to both the existing row store and the new columnar store. A reconciliation job compares counts and column checksums per partition on a schedule and raises divergence. The read path is controlled by a per-query flag: queries move to the columnar store one at a time only after reconciliation has been clean, and the flag can send any query back to the row store. The row store remains the source of truth until cutover. A separate arrow shows the backfill running behind the live stream with a deliberate overlap, made safe by idempotent writes.">
<defs><marker id="oa" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10z" fill="currentColor"/></marker></defs>
<rect x="10" y="52" width="74" height="42" rx="3" fill="none" stroke="currentColor" stroke-width="1.25"/>
<text x="47" y="70" font-size="10" text-anchor="middle">writes</text>
<text class="d" x="47" y="85" font-size="8.5" text-anchor="middle">one source</text>
<g class="sd" stroke-width="1.25">
<line x1="84" y1="62" x2="140" y2="40" marker-end="url(#oa)"/>
<line x1="84" y1="84" x2="140" y2="106" marker-end="url(#oa)"/>
</g>
<rect x="144" y="18" width="168" height="44" rx="3" fill="none" stroke="currentColor" stroke-width="1.5"/>
<text x="228" y="36" font-size="10" text-anchor="middle">row store</text>
<text class="a" x="228" y="51" font-size="8.5" text-anchor="middle">source of truth until cutover</text>
<rect class="ab sa" x="144" y="86" width="168" height="44" rx="3" stroke-width="1.5"/>
<text class="a" x="228" y="104" font-size="10" text-anchor="middle">columnar store</text>
<text class="d" x="228" y="119" font-size="8.5" text-anchor="middle">written, not yet read</text>
<line class="sd" x1="228" y1="62" x2="228" y2="84" stroke-width="1.25"/>
<rect x="330" y="52" width="146" height="44" rx="3" fill="none" stroke="currentColor" stroke-width="1.25"/>
<text x="403" y="70" font-size="10" text-anchor="middle">reconciliation</text>
<text class="d" x="403" y="85" font-size="8.5" text-anchor="middle">counts, checksums, per partition</text>
<line class="sd" x1="312" y1="74" x2="326" y2="74" stroke-width="1.25" marker-end="url(#oa)"/>
<rect x="494" y="52" width="136" height="44" rx="3" fill="none" stroke="currentColor" stroke-width="1.25" stroke-dasharray="4 3"/>
<text class="r" x="562" y="70" font-size="10" text-anchor="middle">divergence</text>
<text class="d" x="562" y="85" font-size="8.5" text-anchor="middle">blocks the read move</text>
<line class="sd" x1="476" y1="74" x2="490" y2="74" stroke-width="1.25" marker-end="url(#oa)"/>
<text class="d" x="10" y="158" font-size="9" letter-spacing=".9">READS MOVE ONE QUERY AT A TIME, AND MOVE BACK THE SAME WAY</text>
<rect x="10" y="168" width="150" height="42" rx="3" fill="none" stroke="currentColor" stroke-width="1.25"/>
<text x="85" y="186" font-size="10" text-anchor="middle">query</text>
<text class="d" x="85" y="201" font-size="8.5" text-anchor="middle">one dashboard</text>
<rect class="ab sa" x="196" y="168" width="150" height="42" rx="3" stroke-width="1.5"/>
<text class="a" x="271" y="186" font-size="10" text-anchor="middle">per-query flag</text>
<text class="d" x="271" y="201" font-size="8.5" text-anchor="middle">default is the row store</text>
<line class="sd" x1="160" y1="189" x2="192" y2="189" stroke-width="1.25" marker-end="url(#oa)"/>
<g class="sd" stroke-width="1.25">
<line x1="346" y1="180" x2="392" y2="180" marker-end="url(#oa)"/>
<line x1="392" y1="200" x2="346" y2="200" marker-end="url(#oa)"/>
</g>
<text class="d" x="398" y="184" font-size="9">clean for longer than the reporting window, then move</text>
<text class="r" x="398" y="204" font-size="9">one flag flip returns it, with no deploy</text>
<line class="sd" x1="10" y1="228" x2="630" y2="228" stroke-width="1" opacity=".4"/>
<text class="d" x="10" y="246" font-size="9.5">Backfill runs behind the live stream and is allowed to overlap it, because the write is</text>
<text class="d" x="10" y="262" font-size="9.5">idempotent on a natural key. A pipeline safe to run twice is a pipeline safe to resume.</text>
</svg>
</div>
<figcaption>Figure 1. Nothing here is a cutover. It is a period during which both stores are
correct, and a sequence of small reversible decisions about which one answers.</figcaption>
</figure>

**2.1. Dual write, and the old store stays authoritative.** Both stores take every write from
the beginning. The new one is not read from until reconciliation has been clean for longer than
the longest reporting window, because a discrepancy that only appears in a monthly close is
invisible for a month. Authority is **enforced at the read path** rather than agreed in a plan:
the query layer's default target is the row store, and moving a query is an explicit act.

**2.2. Reads move one query at a time, behind a flag.** Not one table, and never all at once. A
dashboard is moved, watched against the old answer, and either kept or returned by flipping a
flag with no deploy. This is slower than a cutover and it is the only version where "the numbers
look wrong" has a same-minute answer.

**2.3. The rollback is built first and exercised on a schedule.** Before any read moves, the
path back is written and run. Then it keeps being run, against production, on a timer, because
a rollback that has not executed this month is a plan and not a capability. Failure 5.5 is what
happens when this lapses, and it lapses by default.

**2.4. The schema is designed for the query, not translated from the source.** A columnar store
rewards denormalisation, a sort key matching the dominant access pattern, and partitioning on
the dimension that queries filter on first, usually time. Porting the normalised OLTP schema
across is the fastest way to build something that is slower than what you left, and it is the
most common way this migration fails.

**2.5. Every load is idempotent on a natural key.** This one property makes backfill resumable,
makes stream and backfill safe to overlap, and makes a duplicated batch harmless. It costs a
key design decision at the start and it removes an entire category of incident.

## 3. Why this is a product decision and not a storage one

Analytics that answer in under a second and analytics that answer in forty are different
products, not the same product at different speeds.

For the customers this served, reporting is not a convenience feature. A telecom operator sizes
staffing from it, a bank reconciles against it, and a regulated client has obligations that
assume it returns. When a dashboard takes forty seconds, people stop opening it and start
asking a person, which converts an infrastructure cost into a support cost and hides it.

The migration is also what makes the next thing possible. Query patterns that nobody proposes
because they are known to be too expensive (cohorting across a full history, per-tenant
breakdowns over a year) become ordinary requests once the storage model fits them. The measured
benefit is the dashboards that got faster. The unmeasured one is the analysis that starts
getting asked for.

## 4. Figures

**This note reports none.** The four that would matter are rows migrated, query latency at p95
before and against after on the same query shapes, the divergence rate observed during dual
writes, and the elapsed time from first dual write to full cutover.

They exist for the deployment and are not published here. The figures this page did carry were
the prototype's, and erratum 7.19 removes them. Publishing a plausible substitute would be the
same defect in better clothes, which is the argument erratum 7.13 made and this note inherits.

## 5. What I would do differently

**Build the differential test harness before moving the first query.** Failure 5.3 is the one
that damages trust rather than uptime, and it is caught by running the same query against both
stores and diffing the result, not by watching for errors. That harness is a day of work and it
wants to exist before the first dashboard moves, not after the first argument about a number.

**Keep a scheduled read from the old store for the whole dual-write period.** Failure 5.5 is
open here for the honest reason: the discipline is easy to describe and it is the first thing
that lapses once the migration looks finished. A cron job that reads production from the old
store, weekly, is what keeps the rollback real, and it costs nothing.

**Decide the sort key with a query log, not a design meeting.** The dominant access pattern is
an empirical fact sitting in the existing database's logs. It is routinely guessed at instead,
and failure 5.4 is the bill for guessing.
