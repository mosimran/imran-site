---
section: "3.1"
title: "Mevrik: agentic customer experience platform"
summary: "Multi-tenant conversational automation for banks and telecom operators. One image ships to public cloud and to air-gapped estates, and configuration alone decides which."
slug: "mevrik-cx"
state: production
since: 2022-01
stack: ["Go", "Python", "TypeScript / Next.js", "Flutter", "gRPC + protobuf", "PostgreSQL + pgvector", "ClickHouse", "Redis", "NATS JetStream", "MinIO / S3", "Docker", "Kubernetes", "Helm", "OpenTelemetry"]
result: ["3M+ conversations/month", "99.9% against contracted SLAs"]
fallsOverAt: "Tool surface breadth rather than request volume. Grounding quality degrades as the number of individually registered tools grows, which is why promotion to an agent's tool surface is a reviewed step rather than a decorator."
metrics:
  - { name: "Conversations per month", value: "3,000,000+", note: "across banking and telecom tenants" }
  - { name: "Availability", value: "99.9%", note: "against contracted SLAs" }
  - { name: "Mean time to recovery", value: "under 30 min", note: "measured, not targeted" }
  - { name: "First token, design target", value: "under 800 ms p95", note: "a target the build is held to, not a published measurement" }
  - { name: "Full resolution, design target", value: "under 3 s p95", note: "same: target, not measurement" }
  - { name: "Kill switch activation", value: "under 5 s", note: "target, from command to all in-flight conversations stopped" }
  - { name: "Audit retention", value: "7 years", note: "append-only, hash-chained, object-locked in object storage" }
failures:
  - { id: "6.1", status: accepted, note: "Tool sprawl degrades grounding. Every endpoint added to an agent's reachable surface widens the space the model chooses from, and past some breadth the accuracy won earlier evaporates. Mitigated by governance rather than solved: endpoints are proposed, reviewed by a person and grouped into a handful of domains before an agent can see them. It remains the thing most likely to quietly get worse." }
  - { id: "6.2", status: fixed, note: "Writing to the database and publishing to the event bus in the same operation loses events when one of the two fails. Replaced with a transactional outbox: the publish is a row written inside the same transaction and drained by a relay. Designed against in advance rather than learned from an incident." }
  - { id: "6.3", status: fixed, note: "Inbound channel webhooks retry. Without an idempotency key per inbound message a retry becomes a duplicate message, and a duplicate message becomes a duplicate billable record, which is an integrity problem rather than a cosmetic one. Keys are enforced at ingest." }
  - { id: "6.4", status: open, note: "Nothing in the design distinguishes a model that has degraded from a model that is being asked harder questions. Anomaly thresholds on cost, error, escalation and grounding rate will fire on both, and a person still has to read the conversations to tell which happened." }
---

<div class="memo"><b>What this is.</b> A conversational platform where an AI agent handles
customer contact end to end across chat, messaging, email and voice, and a human supervises
what the agent escalates. It runs multi-tenant in public cloud for most customers and inside
the customer's own estate, including fully air-gapped, for banks and regulated operators who
cannot let a conversation leave their network. The same build serves both.</div>

## 1. The constraint that shaped everything

One sentence decided most of the architecture: **the same product has to run in a shared
cloud and in a bank's air-gapped data centre, and neither can be a port of the other.**

Paper 5.5 argues that sovereignty is cheap when it is adopted at design time and ruinous when
it is retrofitted. This is the system that argument came from. Every decision below is
downstream of refusing to maintain two builds.

## 2. Tenancy is a schema property, not a query habit

The failure everyone fears in multi-tenant software is one tenant seeing another's data, and
the usual defence is discipline in the application layer. Discipline is not a control.

The contract here is structural and has four parts:

- Every business table carries `tenant_id`, not null.
- Every business table has a row-level security policy keyed to the tenant in the connection
  context, as defence in depth beneath the application scoping.
- Every composite index leads with `tenant_id`, so the fast path is the scoped path.
- No query joins across tenants. There is no legitimate reason to and no code path that does.

The part that makes it hold is not the rule, it is the enforcement. **A new table without
`tenant_id` fails the build.** Every migration pull request spins an ephemeral database,
applies the full history from zero and runs a row-level security smoke test against it. A
policy that is only in a document decays; a policy that fails continuous integration does not.

## 3. Two services, and the discipline was not splitting into more

The backend is two services: a modular monolith carrying the gateway, identity, tenancy,
conversations and the agent runtime, and a second service carrying AI compute.

The interesting decision is the one not taken. Splitting the first service into gateway,
identity, conversations and runtime would have looked more modern and bought nothing: they
share a database, a tenant context and an auth context, so separating them adds deployment
and failure surface without adding scaling headroom. The seams are kept clean so extraction
is available later, and extraction happens on a measured signal rather than on taste.

AI compute is separate from the first day for a reason that survives scrutiny: it has a
genuinely different scaling profile. Bursty GPU work, vector index memory, model caches and
high-cost-per-call operations scale on a different axis from a chat gateway holding
websockets. Scaling those independently is a real saving rather than an architectural
preference.

Upgrade triggers are written down in advance, with the signal that fires each one, so growing
the system is a decision taken calmly rather than a reaction. Paper 5.12 is about
architectures that follow the org chart; this is the attempt not to.

## 4. Own the interface, rent the engine

The agent runtime is built on six primitive interfaces defined in-house: tool calling, skills,
a guardrail hook pipeline, memory, context curation and model routing. Those interfaces are
the contract and they were frozen early.

Underneath them, the runtime today wraps a vendor agent framework through an adapter. That is
deliberate. Writing the loop from scratch in the first month would have been a way of
spending a quarter on something a vendor had already shipped. Wrapping it without owning the
interface would have been worse: every skill, tool and integration would have been written
against somebody else's abstractions, and replacing the runtime later would mean rewriting
all of them.

So the loop is rented and the surface is owned. When the framework stops fitting, the
implementation behind the interfaces changes and the skills, tools, hooks and evaluation
suites written against them do not.

## 5. Guardrails are a pipeline, not a policy

Every conversational turn runs through the same ordered hooks, and the ordering is the design.

<figure>
<div class="dia">
<svg viewBox="0 0 640 274" role="img" aria-label="A per-turn pipeline. An inbound message passes through pre-flight guardrails where PII is redacted before the model is called, then a prompt injection filter, permission check and budget guard. The agent runtime then reasons and calls tools through a gateway which injects the tenant identifier at dispatch. The response passes through post-flight guardrails for citation grounding, tone and output sanitising before reaching the customer. A separate audit lane below shows that the harness writes the trace at every stage, not the agent, and the trace is append only and hash chained.">
<defs><marker id="mv" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10z" fill="currentColor"/></marker></defs>
<text class="d" x="10" y="14" font-size="9" letter-spacing=".9">EVERY TURN, IN THIS ORDER</text>

<rect x="10" y="26" width="86" height="54" rx="3" fill="none" stroke="currentColor" stroke-width="1.25"/>
<text x="53" y="48" font-size="10" text-anchor="middle">inbound</text>
<text class="d" x="53" y="63" font-size="9" text-anchor="middle">message</text>

<rect class="ab sa" x="106" y="26" width="150" height="54" rx="3" stroke-width="1.5"/>
<text class="a" x="181" y="45" font-size="10" text-anchor="middle">pre-flight</text>
<text class="d" x="181" y="59" font-size="8.5" text-anchor="middle">PII redacted here, before</text>
<text class="d" x="181" y="70" font-size="8.5" text-anchor="middle">the model is ever called</text>

<rect x="266" y="26" width="130" height="54" rx="3" fill="none" stroke="currentColor" stroke-width="1.5"/>
<text x="331" y="45" font-size="10" text-anchor="middle">agent runtime</text>
<text class="d" x="331" y="59" font-size="8.5" text-anchor="middle">reason, call tools,</text>
<text class="d" x="331" y="70" font-size="8.5" text-anchor="middle">observe, decide</text>

<rect class="ab sa" x="406" y="26" width="128" height="54" rx="3" stroke-width="1.5"/>
<text class="a" x="470" y="45" font-size="10" text-anchor="middle">post-flight</text>
<text class="d" x="470" y="59" font-size="8.5" text-anchor="middle">grounding, tone,</text>
<text class="d" x="470" y="70" font-size="8.5" text-anchor="middle">sanitise, meter</text>

<rect x="544" y="26" width="86" height="54" rx="3" fill="none" stroke="currentColor" stroke-width="1.25"/>
<text x="587" y="48" font-size="10" text-anchor="middle">customer</text>

<g class="sd" stroke-width="1.25">
<line x1="96" y1="53" x2="102" y2="53" marker-end="url(#mv)"/>
<line x1="256" y1="53" x2="262" y2="53" marker-end="url(#mv)"/>
<line x1="396" y1="53" x2="402" y2="53" marker-end="url(#mv)"/>
<line x1="534" y1="53" x2="540" y2="53" marker-end="url(#mv)"/>
</g>

<line class="sd" x1="331" y1="80" x2="331" y2="106" stroke-width="1.25" marker-end="url(#mv)"/>
<rect x="236" y="110" width="190" height="40" rx="3" fill="none" stroke="currentColor" stroke-width="1.25"/>
<text x="331" y="128" font-size="10" text-anchor="middle">tool gateway</text>
<text class="r" x="331" y="142" font-size="8.5" text-anchor="middle">injects tenant id at dispatch</text>
<text class="d" x="434" y="134" font-size="8.5">the model cannot construct</text>
<text class="d" x="434" y="145" font-size="8.5">a cross-tenant call</text>

<line class="sd" x1="10" y1="176" x2="630" y2="176" stroke-width="1" opacity=".4"/>
<text class="d" x="10" y="196" font-size="9" letter-spacing=".9">THE AUDIT LANE</text>
<rect class="ab sa" x="106" y="204" width="428" height="34" rx="3" stroke-width="1.5"/>
<text class="a" x="320" y="219" font-size="10" text-anchor="middle">the harness writes the trace at every stage, not the agent</text>
<text class="d" x="320" y="232" font-size="8.5" text-anchor="middle">append only · hash chained · replicated to object-locked storage</text>
<g class="sd" stroke-width="1" stroke-dasharray="3 3">
<line x1="181" y1="80" x2="181" y2="204"/><line x1="331" y1="150" x2="331" y2="204"/><line x1="470" y1="80" x2="470" y2="204"/>
</g>
<text class="d" x="10" y="258" font-size="9.5">No prompt, tool input or model output leaves a stage without a record written by something</text>
<text class="d" x="10" y="269" font-size="9.5">other than the thing being recorded.</text>
</svg>
</div>
<figcaption>Figure 1. Three decisions in one picture. Redaction happens before the model, not
after. The gateway injects tenancy rather than trusting the model to scope its own calls. The
audit is written by the harness, so the record does not come from the process it describes.</figcaption>
</figure>

Three of those are worth stating on their own.

**Redaction runs before the model, not after.** A post-hoc scrub of a response is a cleanup;
redacting on the way in means personal data was never in the prompt. The second is a control,
the first is a hope.

**The gateway injects tenancy at dispatch.** Tool calls do not carry a tenant chosen by the
model. The gateway attaches it when the call is dispatched, so no output the model can emit
constructs a cross-tenant request. This is the single control I would keep if I could only
keep one.

**The audit is written by the harness.** Paper 5.21 argues that a record authored by the
process being observed is testimony rather than evidence, and that the fix is a boundary. This
is that boundary, built before I had written the argument down: the trace is emitted by the
runtime around the agent, append-only and hash-chained, and the agent has no write path to it.

## 6. Actions are planned, approved, then executed

Any action that changes the world runs through a fixed loop. The agent emits a structured plan
naming intent, target, side effects and whether the action is reversible. The surface renders
it in plain language. A person approves at a chosen scope. Only then does the call dispatch,
with audit written before and after.

The part I am most pleased with is the smallest. **Every tool must declare whether it is
reversible, and a pre-commit hook rejects any new tool that does not.** Irreversible actions
require a second confirmation in which the operator types the resource name. The rule is
enforced by the thing that will not let you commit rather than by a paragraph in a wiki.

Where an agent assists a human rather than acting, suggestion-only is structural too: its
tool allow-list cannot contain a write tool, enforced at registration, and a write tool
tagged for that agent fails the build.

## 7. One image, four ways to run it

Cloud multi-tenant, isolated multi-tenant, single-tenant in the customer's cloud, and
air-gapped on-premise. Same container images, same deployment charts, same database schema.
Configuration decides which mode a deployment is in.

No build-time forks and no schema forks per edition. The reason is maintenance arithmetic
rather than elegance: one security patch has to reach every edition, and reproducible builds
across editions are an audit requirement rather than a nicety. A fork per deployment mode is a
promise to do every fix four times, and that promise is always broken quietly.

## 8. What I would do differently

**I would put the tool-surface governance in from the first week.** It arrived after the tool
registry did, which meant a period where adding an endpoint to an agent's reach was a one-line
change nobody reviewed. Grouping several hundred endpoints into a handful of domains turned
out to be the single biggest lever on answer quality, and I found that out later than I should
have. It is failure 6.1 above and it is the one I would tell someone else to front-load.

**I would have built the evaluation gate before the guardrails.** Guardrails stop bad output
reaching a customer. An evaluation suite tells you whether a change made the system better,
and without one the guardrail pass rate becomes the quality metric by default, which is paper
5.19's argument arriving from the inside.

**The numbers in this note are of two kinds and I have marked which is which.** Conversation
volume, availability and recovery time are measured. Latency, kill-switch activation and
throughput are targets the build is held to. Publishing a target as though it were a
measurement is the specific dishonesty this site exists to avoid, and the temptation is real
because targets are always rounder.
