---
section: "3.2"
title: "Sovereign LLM gateway"
summary: "One control plane over several model backends, the self-hosted ones running on two GPUs we own. Redaction runs before routing, fallback is deterministic and stamped, quotas are per tenant and per model."
slug: "llm-gateway"
state: production
stack: ["Python (FastAPI)", "Redis", "OpenSearch", "PostgreSQL", "Ollama", "Qwen", "GPT-4o", "2 GPUs, self-hosted inference"]
result: []
fallsOverAt: "The quota path. It is the one component every call passes through and the one that holds state, so it saturates before the model adapters do. The rate at which that happens is a property of a specific deployment and is not published here."
metrics:
  - { name: "Self-hosted inference footprint", value: "2 GPUs", note: "deployed configuration, not a measurement" }
failures:
  - { id: "5.1", status: fixed, note: "Output filtering fights streaming. Any check that needs a complete message (a redaction pass, a policy classifier, a safety filter) wants to buffer the whole response, and buffering destroys time to first token, which is the one latency property a user can feel. The standard answer is a sliding token window: filter over a small trailing buffer and emit behind it. It is weaker than whole-message filtering in theory and the difference is invisible in practice, which is the trade every streaming gateway makes." }
  - { id: "5.2", status: open, note: "Redaction cannot be tuned for both precision and recall. Tuned for recall it over-redacts and mangles legitimate content, tuned for precision it leaks. The weak spot is always locale: account numbers, identifiers and dates written in non-Latin scripts or local formats are under-represented in the detectors most teams start from, so a system that tests clean in English degrades quietly in the languages its actual customers use. There is no fix, only measurement per locale and a published error budget." }
  - { id: "5.3", status: accepted, note: "Quota state is consistent or it is available, and under a region failover it cannot be both. A gateway that replicates quota windows synchronously pays for that on every call. One that does not will briefly permit roughly double the intended rate after a failover, because two regions each believe they hold the window. The usual decision is to accept the burst, alarm on it, and write it down rather than buy the consistency machinery." }
  - { id: "5.4", status: open, note: "Hosted model backends change underneath you. A provider updates a model behind a stable name and output quality, latency and token accounting all move with no deploy on your side and no notification. Pinning a dated version buys time and does not buy permanence, because pinned versions are retired. This is the strongest argument for the self-hosted side of a mixed estate: a model you installed is a model that cannot change without you." }
  - { id: "5.5", status: open, note: "Prompt injection reaches tool calls. Once a gateway routes to a model that can invoke tools, any untrusted text that reaches the context is a potential instruction, and retrieved documents, ticket history and customer messages are all untrusted text. Redaction does not help, because the attack is not about extracting data on the way out. The mitigations are real and partial: least privilege on every tool, confirmation for anything that writes or moves money, and treating retrieved content as data rather than instruction. Nobody has closed this one." }
---

<div class="memo"><b>How to read this note.</b> What follows is the reference design for a
sovereign LLM control plane: the constraints this class of system operates under, the decisions
that follow from them, and the failure modes it faces, with the industry-standard answers to
each. It is a solution path for a system like the one I built rather than a disclosure of that
system's internals. Deployment configuration, thresholds, tenant identities and incident history
are deliberately not published.
<br><br>What is specific and confirmed: the problem, the self-hosted backends running on two
GPUs, and the model choices. The figures this page carried until 2026-09-03 were the handoff
prototype's and were removed under <a href="/errata/#e7-17">erratum 7.17</a>. Its failure modes
were the prototype's too, and are replaced here by the ones the category actually has
(<a href="/errata/#e7-18">erratum 7.18</a>).</div>

## 1. The constraint

A bank wants agentic customer service. Its regulator wants every token to stay inside the bank.

Those two sentences are the entire project, and everything difficult about it follows from
declining to compromise on either. Agentic behaviour wants the strongest available model.
Sovereignty wants a model you can install. Those pull in opposite directions, and the usual
resolutions are to give up the capability or to give up the residency guarantee and describe it
in language vague enough to survive a procurement questionnaire.

The third option is a control plane: put every model behind one boundary, make the choice of
backend a per-tenant policy decision rather than an architectural one, and enforce the data
rules at the boundary instead of trusting each backend to behave.

That is why the local backends run on two GPUs we own rather than on rented inference. A model
you can install is a model whose weights, prompts and logs never leave a room you control, and
it is the only version of this a regulator can be shown rather than told about. The models
chosen for those slots have to self-host and still support tool calling, which is a smaller set
than it sounds. A hosted frontier model sits alongside them for tenants whose data
classification permits it.

## 2. The decisions, and where each one is enforced

<figure>
<div class="dia">
<svg viewBox="0 0 640 268" role="img" aria-label="A request enters the gateway boundary. Inside it, four steps run in order: tenant policy lookup, quota check, redaction, then backend selection. Only after those does the request leave to a backend. Two backend groups are shown: self-hosted models on two owned GPUs, and a hosted frontier model reachable only for tenants whose data classification permits it. Every response passes back through a provenance stamp and an append-only audit record before reaching the caller. A dashed line marks the boundary, labelled as the place the data rules are enforced rather than trusted to the backend.">
<defs><marker id="ga" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10z" fill="currentColor"/></marker></defs>

<rect x="10" y="40" width="66" height="40" rx="3" fill="none" stroke="currentColor" stroke-width="1.25"/>
<text x="43" y="64" font-size="10" text-anchor="middle">tenant</text>

<rect class="ab sa" x="92" y="24" width="316" height="72" rx="3" stroke-width="1.5"/>
<text class="a" x="104" y="42" font-size="9.5">policy</text>
<text class="a" x="176" y="42" font-size="9.5">quota</text>
<text class="a" x="240" y="42" font-size="9.5">redaction</text>
<text class="a" x="330" y="42" font-size="9.5">route</text>
<text class="d" x="104" y="58" font-size="8.5">per tenant</text>
<text class="d" x="176" y="58" font-size="8.5">per model</text>
<text class="d" x="240" y="58" font-size="8.5">before routing</text>
<text class="d" x="330" y="58" font-size="8.5">policy picks</text>
<text class="d" x="104" y="86" font-size="8.5">in order, and the request does not leave until all four have run</text>

<g class="sd" stroke-width="1.25">
<line x1="76" y1="60" x2="88" y2="60" marker-end="url(#ga)"/>
<line x1="408" y1="46" x2="452" y2="46" marker-end="url(#ga)"/>
<line x1="408" y1="74" x2="452" y2="74" marker-end="url(#ga)"/>
</g>

<rect x="456" y="24" width="174" height="40" rx="3" fill="none" stroke="currentColor" stroke-width="1.5"/>
<text x="543" y="40" font-size="9.5" text-anchor="middle">self-hosted, 2 GPUs</text>
<text class="d" x="543" y="55" font-size="8.5" text-anchor="middle">weights never leave the room</text>

<rect x="456" y="70" width="174" height="40" rx="3" fill="none" stroke="currentColor" stroke-width="1.25" stroke-dasharray="4 3"/>
<text x="543" y="86" font-size="9.5" text-anchor="middle">hosted frontier model</text>
<text class="r" x="543" y="101" font-size="8.5" text-anchor="middle">only if classification permits</text>

<line class="sd" x1="86" y1="14" x2="640" y2="14" stroke-width="1" stroke-dasharray="3 3"/>
<text class="d" x="92" y="11" font-size="8.5">the boundary: rules enforced here, not delegated to the backend</text>

<text class="d" x="10" y="140" font-size="9" letter-spacing=".9">EVERY RESPONSE, WITHOUT EXCEPTION</text>
<line class="sa" x1="543" y1="110" x2="543" y2="152" stroke-width="1.5" marker-end="url(#ga)"/>
<rect class="ab sa" x="386" y="156" width="244" height="40" rx="3" stroke-width="1.5"/>
<text class="a" x="508" y="172" font-size="10" text-anchor="middle">provenance stamp</text>
<text class="d" x="508" y="187" font-size="8.5" text-anchor="middle">which model answered, and why that one</text>

<line class="sd" x1="386" y1="176" x2="330" y2="176" stroke-width="1.25" marker-end="url(#ga)"/>
<rect x="152" y="156" width="174" height="40" rx="3" fill="none" stroke="currentColor" stroke-width="1.5"/>
<text x="239" y="172" font-size="10" text-anchor="middle">audit record</text>
<text class="d" x="239" y="187" font-size="8.5" text-anchor="middle">append-only, uniform across backends</text>

<line class="sd" x1="152" y1="176" x2="80" y2="176" stroke-width="1.25" marker-end="url(#ga)"/>
<text x="43" y="180" font-size="10" text-anchor="middle">caller</text>

<line class="sd" x1="10" y1="216" x2="630" y2="216" stroke-width="1" opacity=".4"/>
<text class="d" x="10" y="234" font-size="9.5">A tenant whose classification forbids the hosted model cannot reach it by misconfiguration,</text>
<text class="d" x="10" y="250" font-size="9.5">because the policy lookup runs before the router and the router has no other input.</text>
</svg>
</div>
<figcaption>Figure 1. Four steps run before a request leaves the boundary, and two run on every
response coming back. Nothing about the arrangement is clever. Its value is that there is
exactly one path.</figcaption>
</figure>

**2.1. Redaction before routing.** Personal data detection runs in process before backend
selection, which means a misconfigured route cannot leak. A control that depends on the
correctness of the next hop is not a control, it is a hope with a runbook. The ordering is
**enforced at the boundary**: the router takes the redacted payload as its only input, so there
is no code path in which an unredacted request reaches a backend.

**2.2. Backend choice is per-tenant policy, not architecture.** Which models a tenant may reach
is data, looked up per request, and a tenant whose classification forbids external inference
cannot reach a hosted model by any configuration mistake. Building this as a deployment
variable instead is the common shortcut, and it means every new tenant is a new deployment and
every mistake is a residency incident.

**2.3. Deterministic, stamped fallback.** When a backend degrades, the gateway fails over to a
smaller local model and marks the response as having come from the understudy. Downstream
systems can see it, dashboards can count it, and the tenant can decide what it means. A silent
quality drop is worse than an error, because nobody investigates it and the damage arrives in a
churn report six weeks later.

**2.4. Quotas as a first class object.** Per tenant, per model, per minute, sliding window.
Cost control is the secondary benefit here. Quotas exist because one tenant's retry storm is
otherwise everybody's outage, which is Principle 4.3 stated as infrastructure.

**2.5. One audit record, uniform across backends.** Same schema whether the answer came from a
local model or a hosted one. This is the artifact a compliance team actually reads, and it is
the only thing in the system that survives swapping a backend.

## 3. What the boundary is worth commercially

The gateway is what makes a regulated customer a configuration rather than a project.

Without it, every bank and every telecom operator with a different data classification is a
separate deployment, a separate security review and a separate set of promises that somebody
has to keep track of. With it, the answer to "can our data leave the country" is a policy row,
and the answer to "prove it" is an audit record with the same shape for every tenant.

That is the return, and it is a sales return before it is an engineering one. The security
review that decides the contract asks which model saw the data and how you know. A stamped
response and a uniform audit record answer both questions in a form the reviewer can keep.

## 4. Figures

**This note reports none.** The measurements that would matter are gateway overhead at p50 and
p99 with redaction included, redaction cost in isolation, the proportion of calls that failed
over to the understudy, and the rate at which the quota path saturates. They are real
measurements of a real deployment and they are not published, for the same reason the tenant
identities are not.

The figures this page carried until 2026-09-03 were the prototype's, and removing them was the
right call. Publishing a plausible replacement would have been the same defect wearing better
clothes.

## 5. Known failure modes

The five in the front matter are the ones this category has. They are not incident reports from
a particular deployment, and they are not softened: 5.2, 5.4 and 5.5 are open problems in the
industry, not oversights waiting to be tidied up.

Two are worth restating because they are the ones teams discover late. **Hosted models change
underneath you** (5.4), which is the strongest practical argument for keeping a self-hosted side
in a mixed estate. And **prompt injection reaches tool calls** (5.5), which redaction does
nothing for, because the attack is not about what leaves on the way out.

## 6. What I would do differently

**Model the audit schema first.** Adapters get built first because they are the visible work,
and then the uniform audit record turns out to have been the actual product: the thing the
tenant's compliance team read, and the only artifact that survived a backend swap. It should
have been designed before the first adapter, not derived after the fourth.

**Measure redaction per locale from the start.** Failure 5.2 is open and it is the one that
degrades quietly. A system tested in English and deployed against customers writing in another
script has a quality problem that no aggregate metric will surface, because the aggregate is
dominated by the cases that work.

**Treat tool permissions as the security boundary, not the model.** Failure 5.5 does not get
solved at the prompt layer, and time spent hardening prompts is time not spent on the thing
that actually contains the blast radius, which is what the tools are allowed to do.
