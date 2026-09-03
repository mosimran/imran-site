---
section: "3.9"
title: "A constant tool surface over an unbounded API surface"
summary: "An MCP server that lets an agent operate any API with an OpenAPI description, through a fixed handful of tools rather than one tool per endpoint, with multi-step recipes and credentials that never reach the model."
slug: "openapi-studio"
revised: 2026-09-04
state: production
stack: ["TypeScript", "Model Context Protocol", "Astro SSR", "Cloudflare D1", "Cloudflare KV / R2", "JSONPath", "Server-Sent Events"]
result: []
fallsOverAt: "Discovery, not throughput. The agent finds an endpoint by searching descriptions, so the ceiling is the quality of the spec it was given. A well-written spec of nine hundred endpoints works; a poorly written one of forty does not, and no amount of engineering on this side fixes the other side's prose."
failures:
  - { id: "5.1", status: fixed, note: "Clients JSON-stringify structured arguments. An agent sends a schema object as a string containing JSON, the server stores it verbatim, and the document now holds a string where a subtree should be, so every consumer that navigates by JSON pointer walks off the end of it. The corruption is silent and survives a save. Every structured argument is coerced at the boundary: parsed if it arrives as a string, rejected if it parses to the wrong shape, and never written until it is the type the document expects." }
  - { id: "5.2", status: accepted, note: "A constant tool surface costs round trips. Where a generated per-endpoint tool would be one call, this is search, then fetch the schema, then run: three exchanges, three sets of tokens, and three chances for the agent to lose the thread. That is the price of not putting the entire API into the model's context, and it is worth paying at any API large enough to be interesting. It is a bad trade for an API with six endpoints." }
  - { id: "5.3", status: open, note: "Discovery is only as good as the description. The agent finds an operation by matching its summary, description and tags, so an endpoint documented as \"handles the thing\" is unreachable no matter how correct the machinery is. This moves the failure into the customer's own spec, where it is both more visible and less fixable, and there is no mitigation on this side beyond reporting what the search could not resolve." }
  - { id: "5.4", status: open, note: "A recipe is a flow frozen against a spec that keeps moving. Steps chain by extracting values out of the previous response by path expression, and a field that gets renamed upstream turns a working recipe into one that fails at step four with an empty variable. Recipes are versioned and their runs are retained, so the breakage is legible after the fact. Nothing here detects it in advance, which would mean re-validating every stored recipe against every spec change." }
  - { id: "5.5", status: open, note: "The agent causes real effects it cannot evaluate. Execution is server-side against real servers with real workspace credentials, so a model that misreads a description can issue a live write. Write tools are withheld from read-only tokens, credentials are never returned to the model, and every run is recorded. None of that is the same as the agent understanding what it just did, and this is the failure mode the whole category has rather than one this design introduced." }
---

<div class="memo"><b>How to read this note.</b> This is the reference design for putting an agent
in front of an API it has never seen: the constraint that shapes it, the decisions that follow,
and the failure modes the shape has. It is a solution path for a system like the one built
rather than a disclosure of that system's internals. Tool names, schemas, deployment
configuration, credential handling specifics and customer data are deliberately absent.
<br><br>This note reports no figures, and section 4 names the ones that would matter.</div>

## 1. The constraint

An agent cannot use an API it has to be told about in advance.

The obvious way to give a model an API is to generate one tool per endpoint. It works on the
first demonstration and stops working on the second real system. A payments API has several
hundred operations. A telecom platform has more. Every one of those tools carries a name, a
description and a full parameter schema, and all of it has to sit in the model's context before
it has read the user's question. The surface is spent before the work begins, and it grows every
time the customer ships.

There is a second problem underneath the first. **The tool list is fixed at connection time and
the API is not.** An endpoint added on Tuesday is invisible to a tool list generated on Monday,
so the integration is stale by definition and the fix is a redeploy per customer per change.

So the requirement is a tool surface whose size does not depend on the API's size, and whose
contents do not go stale when the API moves.

## 2. The decision everything follows from

**A small fixed set of capabilities, and the API is discovered at run time.**

<figure>
<div class="dia">
<svg viewBox="0 0 640 306" role="img" aria-label="An agent connects over MCP and receives a fixed set of capabilities: find an operation, read its schema, run it, and run a saved recipe. The API description is loaded from storage at request time, so a spec that changed a minute ago is the one the agent sees. Execution happens on the server against the real API, with workspace credentials attached there and never returned to the model. A recipe is a saved multi-step flow where each step extracts values from the previous response by path expression, so one tool call performs several requests. A dashed boundary marks what the model never receives: credentials, and the intermediate responses of a recipe.">
<defs><marker id="ma" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10z" fill="currentColor"/></marker></defs>

<rect x="10" y="46" width="88" height="52" rx="3" fill="none" stroke="currentColor" stroke-width="1.5"/>
<text x="54" y="70" font-size="10" text-anchor="middle">agent</text>
<text class="d" x="54" y="86" font-size="8.5" text-anchor="middle">any client</text>

<text class="d" x="112" y="26" font-size="9" letter-spacing=".9">FIXED CAPABILITIES, THE SAME FOR EVERY API</text>
<rect class="ab sa" x="112" y="34" width="196" height="76" rx="3" stroke-width="1.5"/>
<text class="a" x="124" y="52" font-size="9.5">find an operation</text>
<text class="a" x="124" y="68" font-size="9.5">read its schema</text>
<text class="a" x="124" y="84" font-size="9.5">run it</text>
<text class="a" x="124" y="100" font-size="9.5">run a saved recipe</text>
<line class="sd" x1="98" y1="72" x2="108" y2="72" stroke-width="1.25" marker-end="url(#ma)"/>

<rect x="330" y="34" width="140" height="42" rx="3" fill="none" stroke="currentColor" stroke-width="1.25"/>
<text x="400" y="52" font-size="9.5" text-anchor="middle">the description</text>
<text class="d" x="400" y="66" font-size="8.5" text-anchor="middle">loaded per request</text>
<line class="sd" x1="308" y1="55" x2="326" y2="55" stroke-width="1.25" marker-end="url(#ma)"/>
<text class="d" x="330" y="90" font-size="8.5">changed a minute ago is</text>
<text class="d" x="330" y="102" font-size="8.5">what the agent sees</text>

<line class="sa" x1="210" y1="110" x2="210" y2="140" stroke-width="1.75" marker-end="url(#ma)"/>
<rect class="ab sa" x="112" y="144" width="358" height="46" rx="3" stroke-width="1.5"/>
<text class="a" x="126" y="163" font-size="10">execution, on the server</text>
<text class="d" x="126" y="179" font-size="8.5">credentials attached here, recorded here, never sent back to the model</text>

<line class="sd" x1="470" y1="167" x2="530" y2="167" stroke-width="1.25" marker-end="url(#ma)"/>
<rect x="534" y="144" width="96" height="46" rx="3" fill="none" stroke="currentColor" stroke-width="1.5"/>
<text x="582" y="163" font-size="9.5" text-anchor="middle">the real API</text>
<text class="d" x="582" y="178" font-size="8.5" text-anchor="middle">real effects</text>

<text class="d" x="10" y="220" font-size="9" letter-spacing=".9">A RECIPE IS SEVERAL REQUESTS BEHIND ONE CALL</text>
<rect x="112" y="228" width="110" height="40" rx="3" fill="none" stroke="currentColor" stroke-width="1.25"/>
<text x="167" y="246" font-size="9.5" text-anchor="middle">step one</text>
<text class="d" x="167" y="260" font-size="8.5" text-anchor="middle">response</text>
<rect x="252" y="228" width="126" height="40" rx="3" fill="none" stroke="currentColor" stroke-width="1.25"/>
<text x="315" y="246" font-size="9.5" text-anchor="middle">extract by path</text>
<text class="d" x="315" y="260" font-size="8.5" text-anchor="middle">feeds the next</text>
<rect x="408" y="228" width="110" height="40" rx="3" fill="none" stroke="currentColor" stroke-width="1.25"/>
<text x="463" y="246" font-size="9.5" text-anchor="middle">step two</text>
<g class="sd" stroke-width="1.25">
<line x1="222" y1="248" x2="248" y2="248" marker-end="url(#ma)"/>
<line x1="378" y1="248" x2="404" y2="248" marker-end="url(#ma)"/>
</g>
<text class="r" x="10" y="252" font-size="8.5">the model sees</text>
<text class="r" x="10" y="264" font-size="8.5">only the result</text>

<line class="sd" x1="10" y1="284" x2="630" y2="284" stroke-width="1" opacity=".4"/>
<text class="d" x="10" y="300" font-size="9.5">Nothing above scales with the number of endpoints. That is the entire idea.</text>
</svg>
</div>
<figcaption>Figure 1. Four capabilities and a description loaded per request. An API with nine
hundred operations presents exactly the same surface to the model as one with nine.</figcaption>
</figure>

**2.1. The capability set does not grow with the API.** Find an operation, read its schema, run
it, run a saved flow. That list is the same for every customer and every specification, so the
context cost is a constant and the integration does not need regenerating when an endpoint is
added.

**2.2. The description is read at request time, not at connection time.** A specification edited
a minute ago is the one the agent searches. This is what makes staleness structurally impossible
rather than merely unlikely, and it is the reason the tool list can afford to be so small: the
detail lives in the document, which is always current, instead of in a tool schema, which is
current only until someone deploys.

**2.3. Write capability is enforced at the tool list rather than in the handler.** A read-only
credential does not receive the tools that mutate or execute: they are absent from the set the
server returns, not present and guarded. The difference matters
because a model that can see a tool will eventually call it and then explain to the user why it
was refused, whereas a model that never receives it does not form the intention. Authorisation
that shapes the menu is worth more than authorisation that rejects the order.

**2.4. Credentials are attached on the server and never returned.** This is enforced at the
execution boundary: the agent asks for a call to be made with the workspace's credentials, and
there is no field in any response that carries one back. It does not receive them, cannot echo them into a
transcript, and cannot leak them by summarising its own context.

**2.5. Multi-step flows collapse into one call.** A recipe is a stored sequence where each step
takes values out of the previous response by path expression. The agent calls it once. The
intermediate responses stay on the server, which removes both the token cost of relaying them
and the opportunity to mangle one on the way through.

## 3. Why this is the product rather than a feature of it

The number of endpoints an organisation has is not something anyone chose. It is the residue of
every integration, acquisition and migration since the company started, and it only goes up.

That number is exactly what the naive design is priced against. Generating a tool per endpoint
puts the cost of an agent integration in direct proportion to how much software a customer has
already written, which means it works for the smallest prospect and fails for the largest one.
The customers with hundreds of endpoints are the ones with the budget.

The second effect is on who has to do the work. Under this design a customer with an existing
specification is connected without an engineer writing an adapter, because the specification is
the adapter. That moves the integration cost from a project to a configuration step, and a
platform that takes a fortnight per customer is a consultancy rather than a product.

Recipes are where that turns commercial. The valuable operations are never one call: they are
authenticate, look up, create, poll until ready. Making that a single named thing the agent can
invoke means the buyer sees an assistant that completes the task, rather than a model narrating
four API calls and getting the third one wrong.

## 4. Figures

**This note reports none.** The four that would settle whether the design works are the
proportion of operations an agent locates on the first search against real customer
specifications, the number of exchanges needed to complete a task compared with a per-endpoint
tool surface, the failure rate of stored recipes over a period in which their underlying
specifications changed, and the share of runs where the agent's stated intent matched what the
request actually did.

The last is the one that matters and the hardest to measure, because it requires a human to
read both.

## 5. What I would do differently

**Coerce every structured argument at the boundary from the first version.** Failure 5.1 is
fixed and it should never have been possible. Models and clients send JSON as strings often
enough that it is a property of the medium rather than a bug in any particular client, and
accepting one into storage corrupts a document quietly. The rule is that nothing is written
until it is the shape the document expects, and it belongs in the first commit rather than the
one after the first corrupted spec.

**Report what discovery could not resolve, loudly.** Failure 5.3 is open because it lives in the
customer's prose, but the system currently fails as an absence: the agent searches, finds
nothing, and moves on. Surfacing the operations that were searched for and not found turns an
invisible failure into a report the customer can act on, and it is the only lever this side of
the boundary has.

**Validate stored recipes against the specification on every change.** Failure 5.4 is detectable
in advance and is not currently detected. A recipe references paths, operations and response
fields, and all three are checkable against the document the moment it is saved. Doing it at
save time rather than at run time turns a call that fails in front of a customer into a warning
in front of the person who edited the spec.
