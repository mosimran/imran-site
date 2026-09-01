---
section: "5.22"
title: "You Pinned the Version, Not the Terms"
summary: "Your lockfile covers the code your dependency ships and nothing else. Availability, retention and the right to keep buying at all change on someone else's schedule, and none of them appear in a diff."
slug: "pinned-the-version"
published: 2026-09-01
revised: 2026-09-01
state: holding
confidence: 0.85
retires:
  - "A widely adopted mechanism that makes non-code vendor changes reviewable the way code changes are: machine-readable terms with versions, diffs and a subscribable feed, adopted broadly enough that a team could gate on it. That would make this a tooling gap rather than a structural one."
  - "Evidence that change-of-control terminations, hard API sunsets and silent retention changes are rare enough in practice that budgeting for them costs more than absorbing them, measured across a portfolio of vendors over several years."
  - "A demonstration that the three failure modes in Section 3 collapse into one, or that they are better handled by the same control, which would make the taxonomy decorative."
  - "A contract regime becoming normal in which the buyer's dependency on a model provider is protected against acquisition of the buyer, which would remove the specific exposure in Section 3.1."
history:
  - { date: 2026-09-01, note: "Published. Three examples, all from a single fortnight, which is either a coincidence or the point.", confidenceAfter: 0.85 }
seeAlso: ["5.4", "5.5", "5.17"]
---

<div class="memo"><b>Abstract.</b> You have a lockfile, a renovate bot and a policy about
major version bumps, and all of that governs one thing: the code a vendor ships you. It does
not govern whether they will keep selling to you, how long they will keep your data, or what
a setting you configured two years ago now means. In one fortnight of August 2026, OpenAI
gave notice it would stop supplying models to Cursor because SpaceX bought it, the Assistants
API shut down with OpenAI stating plainly that no automated migration tool was coming, and
GitHub announced that checks and workflow runs would fall from over 400 days of retention to
a 90 day default. None of the three is a version bump and none would appear in a diff.
<b>Confidence 0.85.</b></div>

## 1. The claim

Ask an engineer what version of a library they are on and you get an exact answer in about
four seconds. Ask what happens to their system if the vendor is acquired, or what their log
retention will be in six weeks, and you get a pause.

Both are properties of a dependency. Only one of them has tooling.

**The claim: the non-code surface of a dependency changes more often than its code, breaks
things more expensively, and is the only part of your supply chain with no review process
attached to it.**

## 2. What a lockfile actually covers

Worth drawing, because the gap is easy to state and hard to feel.

<figure>
<div class="dia">
<svg viewBox="0 0 640 236" role="img" aria-label="Two regions. The left region, labelled governed by your lockfile and code review, contains package versions, transitive dependencies, API function signatures and wire formats, each marked as producing a reviewable diff. The right region, labelled governed by nobody on your side, contains availability, pricing, data retention, region and residency, licence terms and right of continued supply, each marked as producing no diff and arriving by blog post.">
<defs><marker id="pv" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10z" fill="currentColor"/></marker></defs>
<rect class="ab sa" x="12" y="26" width="292" height="158" rx="3" stroke-width="1.5"/>
<text class="a" x="28" y="48" font-size="10.5" letter-spacing=".7">YOUR LOCKFILE COVERS THIS</text>
<g font-size="10">
<text x="28" y="74">package versions</text>
<text x="28" y="96">transitive dependencies</text>
<text x="28" y="118">function signatures</text>
<text x="28" y="140">wire formats</text>
</g>
<text class="a" x="28" y="168" font-size="9.5">every change makes a diff somebody reviews</text>

<rect x="336" y="26" width="292" height="158" rx="3" fill="none" stroke="currentColor" stroke-width="1.5" stroke-dasharray="5 3"/>
<text class="r" x="352" y="48" font-size="10.5" letter-spacing=".7">NOTHING ON YOUR SIDE COVERS THIS</text>
<g font-size="10">
<text x="352" y="74">whether they will still sell to you</text>
<text x="352" y="96">how long your data is kept</text>
<text x="352" y="118">which region processes the request</text>
<text x="352" y="140">what your existing settings now mean</text>
</g>
<text class="r" x="352" y="168" font-size="9.5">arrives as a blog post, if you happen to read it</text>

<line class="sd" x1="12" y1="204" x2="628" y2="204" stroke-width="1" opacity=".4"/>
<text class="d" x="12" y="222" font-size="9.5">Both halves can stop your system. Only the left half has a bot that opens a pull request.</text>
</svg>
</div>
<figcaption>Figure 1. The asymmetry is the whole paper. We built excellent machinery for the
half that is easy to observe and no machinery at all for the half that is not.</figcaption>
</figure>

## 3. Three ways it breaks, from one fortnight

These happened within about two weeks of each other in August 2026. I am not claiming that
density is normal. I am using it because three distinct failure modes turned up close enough
together to compare.

### 3.1. Supply ends for reasons that have nothing to do with you

SpaceX completed its acquisition of Cursor on 14 August 2026. OpenAI then notified SpaceX
that it intended to wind down the contract supplying OpenAI models to Cursor, with a proposed
shutoff of 12 November, invoking a clause that gives it a limited window to end the agreement
after a change of ownership. OpenAI's stated reason was that it could not be confident the
new owner would use the technology within its terms of service. Future models were named as
excluded too.

Now take the position of a team that had built on Cursor. They ran no bad code, breached
nothing, and shipped no regression. Their model supply was withdrawn because of who bought
their vendor, under a clause in a contract they were never party to and have never read.

The mitigations that survived are worth noting because they are the shape of the general
answer: users could still bring their own OpenAI API keys, and access through IDE extensions
continued. What survived was the path where the customer held the relationship directly.

### 3.2. The thing goes away and the migration is your problem

The Assistants API shut down on 26 August 2026. Calls to `/v1/assistants`, `/v1/threads` and
`/v1/threads/runs` stopped working. The replacement is the Responses API with Conversations
for history, and the mapping is clean enough on paper.

The sentence that costs a sprint is that OpenAI said it would not provide an automated tool
for migrating Threads to Conversations. So if you wanted your users' conversation history to
survive, the work was yours: iterate every thread through the old API before the deadline,
convert each message into the new item format, recreate the conversations.

That is a data migration with a hard external deadline, discovered by reading a migration
guide. It has the shape of an incident and it was scheduled months in advance, which means
the only thing standing between a team and a bad fortnight was whether somebody read the
right page.

### 3.3. A setting you already configured quietly changes meaning

This is the subtlest one and the one I would bet most teams miss.

On 27 August 2026 GitHub announced that from 1 October, checks, workflow runs and statuses
would be governed by the same retention setting that already controls Actions artifacts and
logs, with a default of 90 days. Until then, those objects were kept for over 400 days
regardless of what that setting said.

Nothing in your repository changes. No API is removed. No version moves. A value you set at
some point, for a reason about artifact storage, silently acquires authority over a different
class of data, and history you assumed you had begins expiring. If you have a compliance
obligation, an audit programme or an incident review practice that assumed a year of workflow
history, the obligation did not change and your ability to meet it did.

<table class="rt">
<thead><tr><th style="width:1%">#</th><th style="width:170px">Failure mode</th><th>How you find out</th><th style="width:1%">Diff?</th></tr></thead>
<tbody>
<tr><td class="n" data-l="#">3.1</td><td class="hd" data-l="Mode">Supply withdrawn</td><td data-l="How">News, or your vendor telling you</td><td data-l="Diff"><span class="chip bad">None</span></td></tr>
<tr><td class="n" data-l="#">3.2</td><td class="hd" data-l="Mode">Sunset with the work pushed to you</td><td data-l="How">A migration guide you have to go and read</td><td data-l="Diff"><span class="chip bad">None</span></td></tr>
<tr><td class="n" data-l="#">3.3</td><td class="hd" data-l="Mode">Existing config changes meaning</td><td data-l="How">A changelog entry, or later, painfully</td><td data-l="Diff"><span class="chip bad">None</span></td></tr>
</tbody>
</table>

## 4. Why the tooling never arrived

Code has properties that make it easy to govern, and terms have none of them.

Code is machine readable, addressable by version, diffable, and it lives in a place your CI
already looks. A change to it is an event with a shape, so we built lockfiles, renovate bots
and required reviews on top of that shape.

Terms are prose on a web page, unversioned, with no diff, no feed and no identifier. There is
no `terms.lock`. Nobody can subscribe to the semantic content of a settings page. The absence
of tooling follows from the artefact having no handles, and that is why fifteen years of supply chain security work has produced excellent answers about
what code you are running and almost nothing about what you are permitted to keep running.

## 5. What to do, in ascending order of effort

**Write down what you would do if each major vendor stopped selling to you tomorrow.** Not a
migration plan. One paragraph per vendor, listing what breaks and what the fallback is even
if the fallback is "we would be down for a week". Most teams have never written the sentence
and discover during the incident that there is no answer.

**Put the changelogs somewhere a human reads them.** Every vendor in your critical path
publishes one. Route them to a channel and give one person twenty minutes a week. Every
example in Section 3 was announced in advance in public. The failure is that nobody was assigned to
look.

**Own the relationship where it is cheap to.** The Cursor customers who kept working were the
ones holding their own API key. A direct account with the party that actually supplies the
capability is a different exposure from a resold one, and it usually costs an afternoon of
paperwork.

**Re-derive your retention assumptions annually.** Not the settings, the assumptions. "We can
reconstruct twelve months of CI history" is a claim about a vendor default, and Section 3.3
is what happens when a default moves under a claim you already made to an auditor.

**Treat contract terms as an architecture input for anything you would not survive losing.**
Change of control, notice periods and successor obligations are architecture decisions with
legal names, and the engineer who has to rebuild is never in the room when they are agreed.
Ask for the clause. It is a five minute conversation that occasionally saves a quarter.

## 6. The strongest objection

You cannot defend against everything, and a team that models every vendor's contractual
surface will ship nothing. Vendor risk registers are famously a genre of document nobody
opens, which is paper 5.13's territory, and adding another one is not obviously an
improvement.

That is a real cost and it is why Section 5 is ordered by effort rather than presented as a
programme. The first item is one paragraph per vendor and it captures most of the value. The
last item is a legal review and is only worth it for the two or three dependencies whose loss
would be existential.

The honest version of this paper's recommendation fits in one sentence: spend an hour, once,
on the two vendors you could not replace, and route the changelogs somewhere a person reads
them.

## 7. What this paper does not claim

It does not claim any of the three vendors behaved badly. OpenAI gave the maximum notice its
contract allowed and published its reasoning. The Assistants sunset was announced well ahead
with a detailed migration guide. GitHub published its change over a month before it took
effect, with the reasoning and the action required stated plainly. All three did roughly what
you would want.

It does not claim these events are frequent. Three in a fortnight is a cluster and I am using
it as an illustration rather than a base rate.

And it does not claim self-hosting solves it. Paper 5.5 argues sovereignty is a design
constraint with real payoffs, and it moves this exposure rather than removing it: you still
depend on licences, base images and a supply chain with terms attached. The claim here is
narrower, that the terms surface is ungoverned, and it is ungoverned whether you rent or run.
