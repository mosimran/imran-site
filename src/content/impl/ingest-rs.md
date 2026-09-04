---
section: "3.3"
title: "Webhook ingestion with delivery guarantees"
summary: "A shared receiver for API and social media callbacks. Every event is accepted once, replayable forever, and never lost because a downstream service was having a bad afternoon."
slug: "ingest-rs"
revised: 2026-09-04
state: production
stack: ["Rust (tokio)", "RabbitMQ", "PostgreSQL", "MinIO"]
result: ["100% webhook receipt rate"]
fallsOverAt: "Not yet established by measurement. The architectural limit is the durable write on the accept path, since the receiver cannot acknowledge faster than it can persist, and that number has not been published here."
metrics:
  - { name: "Webhook receipt rate", value: "100%", note: "measured, against providers that retry on non-200" }
failures:
  - { id: "6.1", status: fixed, note: "A provider that retries on timeout turns one event into several. Without a deduplication key derived from the provider's own event identifier, a retry becomes a second record and every downstream count is wrong. Solved at the accept path with an idempotency key stored before the acknowledgement, so a duplicate is recognised rather than processed. Designed against in advance." }
  - { id: "6.2", status: fixed, note: "Acknowledging before persisting turns a receiver restart into silent data loss, and the provider will not send it again because it already got a 200. The write happens first and the acknowledgement second, which is slower and is the entire point." }
  - { id: "6.3", status: accepted, note: "Replay reprocesses events in an order that may not match the original. Handlers are written to tolerate it rather than the pipeline guaranteeing global ordering, because per-source ordering is cheap and global ordering across every platform sharing this service is not worth what it costs." }
  - { id: "6.4", status: open, note: "Nothing here distinguishes a provider that has stopped sending from a quiet period. Absence of events is indistinguishable from absence of activity, and a silent upstream looks exactly like a calm Tuesday until somebody notices a number is flat." }
---

<div class="memo"><b>What this is.</b> One service that receives callbacks from other people's
systems, used by several platforms rather than owned by one. Social media webhooks, payment
and API callbacks, and the mission-critical ones where the sender will not send twice if you
mishandle the first attempt. It exists because every platform was solving the same problem
badly and separately.</div>

## 1. The constraint

The sender does not care about you.

That is the whole design. A webhook provider has its own retry policy, its own timeout, its
own opinion about what your response code means, and no interest in your deploy schedule. Some
retry aggressively and turn one event into six. Some retry once and give up. Facebook's will
keep trying and then stop, and an event you dropped is simply gone.

So the receiver cannot be a normal HTTP service that does some work and returns. **It has to
be a service whose only job is to not lose things**, with the actual work happening somewhere
it cannot affect the response.

## 2. The decision everything else follows from

Accept and process are different jobs and they are separated by a durable write.

<figure>
<div class="dia" tabindex="0" role="group" aria-label="Diagram, scrollable">
<svg viewBox="0 0 640 244" role="img" aria-label="A webhook arrives from a provider. The receiver verifies the signature, checks an idempotency key, writes the raw payload durably, and only then returns 200. Processing happens later off a queue, and a failing handler sends the event to a dead letter path rather than back to the provider. A replay arrow shows stored events can be reprocessed from the archive at any time without the provider being involved.">
<defs><marker id="wa" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10z" fill="currentColor"/></marker></defs>
<text class="d" x="10" y="14" font-size="9" letter-spacing=".9">THE ACCEPT PATH, WHICH IS THE ONLY PATH THE PROVIDER SEES</text>
<rect x="10" y="26" width="80" height="46" rx="3" fill="none" stroke="currentColor" stroke-width="1.25"/>
<text x="50" y="46" font-size="10" text-anchor="middle">provider</text>
<text class="d" x="50" y="60" font-size="8.5" text-anchor="middle">retries on you</text>
<rect class="ab sa" x="102" y="26" width="292" height="46" rx="3" stroke-width="1.5"/>
<text class="a" x="118" y="44" font-size="10">verify signature</text>
<text class="a" x="228" y="44" font-size="10">idempotency key</text>
<text class="a" x="330" y="44" font-size="10">durable write</text>
<text class="d" x="118" y="62" font-size="8.5">reject unsigned</text>
<text class="d" x="228" y="62" font-size="8.5">seen before? stop</text>
<text class="d" x="330" y="62" font-size="8.5">before the 200</text>
<rect x="406" y="26" width="76" height="46" rx="3" fill="none" stroke="currentColor" stroke-width="1.5"/>
<text x="444" y="46" font-size="11" text-anchor="middle">200</text>
<text class="d" x="444" y="60" font-size="8.5" text-anchor="middle">only now</text>
<g class="sd" stroke-width="1.25">
<line x1="90" y1="49" x2="98" y2="49" marker-end="url(#wa)"/>
<line x1="394" y1="49" x2="402" y2="49" marker-end="url(#wa)"/>
</g>
<line class="sd" x1="482" y1="49" x2="560" y2="49" stroke-width="1.25" marker-end="url(#wa)"/>
<text class="d" x="496" y="42" font-size="8.5">provider done</text>
<line class="sd" x1="356" y1="72" x2="356" y2="100" stroke-width="1.25" marker-end="url(#wa)"/>
<text class="d" x="10" y="94" font-size="9" letter-spacing=".9">EVERYTHING ELSE, WHICH THE PROVIDER NEVER WAITS FOR</text>
<rect x="102" y="104" width="150" height="42" rx="3" fill="none" stroke="currentColor" stroke-width="1.25"/>
<text x="177" y="122" font-size="10" text-anchor="middle">queue</text>
<text class="d" x="177" y="136" font-size="8.5" text-anchor="middle">per source</text>
<rect x="266" y="104" width="150" height="42" rx="3" fill="none" stroke="currentColor" stroke-width="1.25"/>
<text x="341" y="122" font-size="10" text-anchor="middle">handlers</text>
<text class="d" x="341" y="136" font-size="8.5" text-anchor="middle">per platform</text>
<rect x="430" y="104" width="150" height="42" rx="3" fill="none" stroke="currentColor" stroke-width="1.25" stroke-dasharray="4 3"/>
<text class="r" x="505" y="122" font-size="10" text-anchor="middle">dead letter</text>
<text class="d" x="505" y="136" font-size="8.5" text-anchor="middle">a person drains it</text>
<g class="sd" stroke-width="1.25">
<line x1="252" y1="125" x2="262" y2="125" marker-end="url(#wa)"/>
<line x1="416" y1="125" x2="426" y2="125" marker-end="url(#wa)"/>
</g>
<rect x="102" y="166" width="314" height="34" rx="3" fill="none" stroke="currentColor" stroke-width="1.25"/>
<text x="259" y="187" font-size="10" text-anchor="middle">raw payload archive, kept</text>
<line class="sa" x1="259" y1="166" x2="259" y2="150" stroke-width="1.75" marker-end="url(#wa)"/>
<text class="a" x="268" y="162" font-size="9">replay, any time, without the provider</text>
<line class="sd" x1="10" y1="216" x2="630" y2="216" stroke-width="1" opacity=".4"/>
<text class="d" x="10" y="234" font-size="9.5">A handler that fails never reaches the provider, so a bad deploy is our problem and not a lost event.</text>
</svg>
</div>
<figcaption>Figure 1. The provider only ever sees the top row. Everything that can fail lives
in the bottom two, where failing is survivable and retrying is our decision rather than
theirs.</figcaption>
</figure>

**Verify, deduplicate, persist, then acknowledge.** In that order, with no step moved for
speed. The acknowledgement is a promise that the event is durable, and returning 200 before
the write turns a routine restart into permanent loss that nobody detects, because the
provider believes it succeeded and will never send it again.

**The raw payload is kept, not just the parsed one.** Parsers have bugs and schemas change
underneath you. Keeping the original bytes means a parsing mistake discovered three weeks
later is a replay rather than an apology, and the archive has repaid that storage cost more
than once.

**Failures go to a dead-letter path a person can drain**, never back to the provider. A
handler crash is our problem. Bouncing it upstream converts an internal bug into lost data and
into a provider quietly reducing its opinion of your endpoint.

Two of these are **enforced at the accept path rather than written down as guidance**. An
unsigned payload is rejected by the receiver, so "only verified events enter" is a property of
the code that runs and not a rule someone remembers. A replayed event is recognised by its
idempotency key before any handler sees it, so a duplicate cannot become a second record even
if every handler downstream is careless.

The ordering itself is the weaker part and it is worth being plain about. The guarantee holds
because the write happens before the acknowledgement, and what protects that sequence is
review and the fact that the people who work on it know why it matters. That is thinner than
it should be for an invariant this load-bearing.

## 3. Why this is one service and not one per platform

Every platform that takes callbacks needs the same six things: signature verification, replay
protection, durable receipt, ordered-enough delivery, a dead-letter path and an audit of what
arrived. None of those are product features. All of them are hard to get right, and all of
them are silently wrong until the day they matter.

Written per platform, each team gets its own subtly different bug. Written once, the delivery
guarantee is a property of the infrastructure and every platform inherits it, including the
ones that had not thought about retries at all.

The cost is a shared component with several consumers, which means a change has a blast radius
and the ordering compromise in failure 6.3 is a decision made on everybody's behalf. That is a
real trade and it is the right one for a guarantee this specific.

## 4. What the guarantee buys the product

A hundred percent receipt rate is an infrastructure number that becomes a product one.

The person at the far end of a dropped webhook is a customer who sent a message and got no
reply. They do not know a queue exists. They know they wrote to a company on Facebook and
nobody answered, and the operator on the other side never saw it arrive, so both ends of the
conversation believe the other is ignoring them. Every lost callback is one of those.

Social and messaging platforms also treat endpoint reliability as a signal about the
integration itself. Miss enough callbacks and delivery degrades, the integration gets flagged,
and in the worst case a platform review arrives that costs more time than the engineering ever
did.

The teams building on top stop writing compensating logic, which is the quiet saving. No
reconciliation job sweeping for messages that never landed. No "refresh to check if we missed
anything" button, which is a confession rendered as a control. No support burden from
conversations that arrived half-formed, and no support agent apologising for something the
infrastructure did.

That is what the accept path buys. It looks like plumbing and it is a product commitment about
whether a customer's message can vanish.

## 5. What I would do differently

**Build the dead-letter drain interface at the same time as the dead-letter queue.** The queue
is a morning of work and the tooling to inspect and re-drive it is a week, so the queue ships
first and then poison messages sit in it for longer than anybody would admit, because looking
at them is awkward. A dead-letter path nobody can comfortably drain is a landfill.

**Make the accept-path ordering a test, not a habit.** A contract test that drives the
receiver, kills it between the write and the response, and asserts the event survives would
turn the invariant in section 2 into something a build can check. It is an afternoon of work
guarding the single decision the entire guarantee rests on, and it does not exist, which is
the gap I would close first.

**Treat silence as a signal from day one.** Failure 6.4 is still open and it is the one I would
front-load in a rewrite. Every alert here fires on something going wrong, and the failure that
actually costs you is an upstream that stops sending, which produces no errors at all. A
per-source expected-rate check would have cost an afternoon.

**The figures on this page are thin and that is deliberate.** The receipt rate is measured. The
throughput and latency numbers this note used to carry were the prototype's and are gone rather
than replaced with estimates. Where a system's real numbers have not been published, saying so
is better than reaching for a plausible one, which is the whole argument of erratum 7.11.
