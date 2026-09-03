---
section: "3.2"
title: "Sovereign LLM gateway"
summary: "One control plane over four model backends, the self-hosted ones running on two GPUs we own. Redaction runs before routing, fallback is deterministic and stamped, quotas are per tenant and per model."
slug: "llm-gateway"
state: production
stack: ["Python (FastAPI)", "Redis", "OpenSearch", "PostgreSQL", "Ollama", "Qwen", "GPT-4o", "2 GPUs, self-hosted inference"]
result: []
fallsOverAt: "Not established by measurement. The architectural limit is the quota path: it is the one component every call passes through and the one that holds state, so it saturates before the adapters do. The specific rate at which that happens has not been published here."
metrics:
  - { name: "Self-hosted inference footprint", value: "2 GPUs", note: "deployed configuration, not a measurement" }
failures:
  - { id: "5.1", status: fixed, note: "Version one buffered streaming responses so output redaction could run over a complete message. Time to first token collapsed and the product felt dead in the hand. Repaired with a two chunk token window, which is strictly worse in theory and invisible in practice." }
  - { id: "5.2", status: open, note: "Redaction is tuned for recall and over-redacts account numbers written in Bengali script. Known, unfixed, documented for tenants rather than hidden from them." }
  - { id: "5.3", status: accepted, note: "Quota state is not replicated across regions. A region failover resets windows and briefly permits double the intended rate. Cheaper than the consistency machinery, written down, with an alarm on it." }
---

<div class="note"><b>Read the failure modes in section 5 as illustrative, not as record.</b>
They came from the handoff prototype this site was built from, word for word, and they have not
been replaced with the real ones. The same is true of this note's architecture: redaction before
routing, the stamped understudy and the sliding quota window are the prototype's description of a
gateway, not yet confirmed as the description of this one. What is confirmed is the shape of the
problem, the self-hosted backends on two GPUs, and the model choices. The figures were removed on
2026-09-03 under <a href="/errata/#e7-17">erratum 7.17</a>; this text stays until the owner replaces
it, because marking it is honest and deleting it quietly would not be.</div>

A bank wants agentic customer service. Its regulator wants every token to stay inside the
bank. Those two sentences are the entire project, and everything difficult about it follows
from declining to compromise on either.

That is why the local backends run on two GPUs we own rather than on rented inference. A
model you can install is a model whose weights, prompts and logs never leave a room you
control, and it is the only version of this that a regulator can be shown rather than told
about. The models chosen for those slots are the ones that self-host and still support tool
calling, which is a smaller set than it sounds. A hosted frontier model sits alongside them
for tenants whose data classification permits it, and the gateway is what makes that a
per-tenant routing decision instead of an architecture.

## 3. Decisions worth defending

**3.1. Redaction before routing.** Personal data detection runs in process before backend
selection, which means a misconfigured route cannot leak. A control that depends on the
correctness of the next hop is not a control, it is a hope with a runbook. The cost this adds
per call was published here as a measurement and was the prototype's number, so it is gone
rather than estimated.

**3.2. Deterministic, stamped fallback.** When a backend degrades, the gateway fails over to
a smaller local model and marks the response as having come from the understudy. Downstream
systems can see it, dashboards can count it, and the tenant can decide what it means. A
silent quality drop is worse than an error, because nobody investigates it and the damage
shows up in a churn report six weeks later.

**3.3. Quotas as a first class object.** Per tenant, per model, per minute, sliding window in
Redis. This is not a cost control. It exists because one tenant's retry storm used to be
everybody's outage, which is Principle 4.3 learned the expensive way.

## 6. What I would do differently

Model the audit schema first. We built four adapters and then discovered that a uniform audit
record was the actual product, because it was the thing the tenant's compliance team read and
the only artifact that survived a backend swap.
