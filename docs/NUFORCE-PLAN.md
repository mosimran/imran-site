# Writing Section 3 and Section 5 from the NuForce engineering blog

Rev A, 4 September 2026. A reading plan, not a draft. Nothing here is written yet and
nothing in it should be published without the owner reading this file first.

- [1. The source](#1-the-source)
- [2. The rule this has to be written under](#2-the-rule-this-has-to-be-written-under)
- [3. What must not be published](#3-what-must-not-be-published)
- [4. What the five posts yield](#4-what-the-five-posts-yield)
- [5. Recommended set](#5-recommended-set)
- [6. What is blocked on the owner](#6-what-is-blocked-on-the-owner)
- [7. T43 said no to this](#7-t43-said-no-to-this)

## 1. The source

Five posts on the NuForce engineering blog, read 2026-09-04. They document a field service
platform: workforce attendance, dispatch, invoicing, an AI copilot over the operational
actions, multi-tenant accounts, and a mobile client.

The owner built it and has said the writing is his to do. Two of the five are internal RFCs
published to that blog, and their numbering, table names and record identifiers travel with
them. That is the whole reason section 3 of this file exists.

## 2. The rule this has to be written under

The one already in [CLAUDE.md](../CLAUDE.md), set on 2026-09-03 and used for notes 3.2
through 3.9. A note describes the **reference design** for the class of system: the
constraints it operates under, the standard decisions, and the failure modes the category
actually has. The disclaimer goes at the top of the note, before the first section, and names
what *is* specific and confirmed.

No figure is invented under cover of it. The blog carries none worth publishing anyway, which
makes this easier than 3.1 was: there is nothing to be tempted by.

## 3. What must not be published

Read the posts and this list together. Everything below appears in the source and none of it
belongs on a personal site.

| Do not publish | Why |
| --- | --- |
| Internal RFC numbers | They index a private document corpus and invite someone to ask for it |
| Database table and column names | Schema is the product's, and naming is half of a schema |
| Record identifiers, including the invoice number in one post | A real row belonging to a real customer |
| Client version numbers | Ties a described behaviour to a shipped build a customer is running |
| The copilot's internal name | Product naming, not engineering |
| Endpoint paths, route names, environment variable defaults | Attack surface, and one post documents a security check that was off |
| Wave and phase structure, and who signed off on a migration | Internal process, of no use to a reader |

The last row deserves a line of its own. One post is a good-faith account of a security
control that had been commented out. **That belongs in the reference-design version as a
named failure mode of the category, and nowhere near a route or a parameter name.**

## 4. What the five posts yield

**"From check-in to invoice line" (2026-08-27) — an implementation note, and the richest of
the five.** An append-only ledger with projections rather than several tables. Three
independent axes kept as separate fields because one enum cannot express them: attendance as
payroll truth, activity as a dispatch estimate, liveness computed at read time from
heartbeats. Timestamps in UTC and business logic on local calendar days, with an overnight
shift inheriting its opening day. Fractional attribution so a two-person job does not
double-count revenue. An ordered first-match rule for attributing a line to a person. A
geofence that flags rather than blocks. Unmatched invoice lines surfaced as unclassified
rather than dropped. And a sequencing constraint worth the whole note: the console does not
ship before the thing that produces its data.

**"A tool has three halves" (2026-08-12) — a paper, and the strongest thing in the corpus.** A
capability lives in three places: a declaration that it exists, a route that dispatches to it,
and an implementation that does the work. Nothing checked that the three referred to the same
thing, so a rename landed in one, declarations existed with no implementation behind them, and
implementations existed that the engine never listed. It presents as working, which is worse
than absence. The answer is tests that walk all three bidirectionally, a boot-time
reconciliation that logs rather than kills, and shipping dark with reads first.

**"The data was fine every time" (2026-08-11) — a paper.** Three bugs in a week all presenting
as missing data. None was data loss: one table was never seeded outside local, one view fetched
fields and never rendered them while a list expected a different case convention, and one
handler dropped a filter and returned the whole account. The argument is that "the data is
missing" names a symptom and forecloses the diagnosis, and the replacement is three questions
answerable in a minute each: is the row there, is it in the response, does the view render it.

**"The balance is the feature" (2026-07-15) — a paper candidate, weaker alone.** Every term in
a computed balance is sourced rather than typed, and accrual happens on read rather than by a
batch job. The claim is that a number a person keys in is a number that drifts, and the
trustworthiness comes from nobody being able to key it in. Good, and close enough to the
"one source, many surfaces" argument this site already makes that it may be better as a
section inside another paper than as its own.

**"Invite to operate" (2026-07-15) — material, not a piece.** Its useful content is that
invitations lived only in a cache with a time to live, so a flush erased them with no audit
trail, and that a lifecycle nobody can observe cannot be reversed either. That is one good
paragraph, and it belongs inside the paper about distributed capability rather than standing
alone.

## 5. Recommended set

Two pieces, with a third if the owner wants it.

**3.10, workforce activity from check-in to invoice line.** Implementation note, disclaimed
reference design, no figures. It has a real constraint, five or six decisions that are each
defensible and non-obvious, and at least seven failure modes drawn from the source rather than
invented. It is the only one of the five that is clearly Section 3 rather than Section 5.

**5.24, a tool has three halves.** Position paper. The claim generalises well beyond an AI
copilot: it is about any capability whose declaration, routing and implementation live apart,
which includes plugin systems, feature flags, permission tables and every RPC surface. It
needs retirement conditions and a confidence value from the owner.

**5.25, "the data is missing" is not a diagnosis.** Position paper, smaller and cleaner than
5.24. Optional, and the one to drop if only one paper is wanted.

## 6. What is blocked on the owner

- **Confidence values** for 5.24 and 5.25. His credence, not the drafter's, which is the whole
  point of the field and the reason P21 existed.
- **Retirement conditions** for each paper: what evidence would make him withdraw the claim.
  These can be drafted for him to accept or replace, and they cannot be invented and left.
- **Whether 3.10 may name the platform at all**, or whether it is described as a field service
  platform without a name. Notes 3.1 and 3.9 name their systems; this is his call per system.
- **Whether the balance argument becomes its own paper** or a section inside 5.24.

Nothing else is blocked. The constraints, decisions and failure modes are all in the source.

## 7. T43 said no to this

T43 named "a field service and payments platform" as one of three systems Section 3 did not
cover, and was closed on 2026-09-03 with **no expansion**.

The reasoning it was closed on does not apply here, and the difference is worth stating rather
than quietly stepping over. T43 proposed adding systems **from a résumé**, whose figures nobody
had checked against the rule set that same day. This source is an engineering blog the owner
wrote, carrying architecture and failure modes and no figures worth publishing. The thing T43
was protecting against is absent.

If this proceeds, T43 gets a line recording that it was reopened for one system and why, rather
than being silently contradicted. That is the same courtesy the site extends to its own errata.
