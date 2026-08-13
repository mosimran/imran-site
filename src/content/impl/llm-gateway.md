---
section: "3.2"
title: "Sovereign LLM gateway"
summary: "One control plane over four model backends. Redaction runs before routing, fallback is deterministic and stamped, quotas are per tenant and per model."
slug: "llm-gateway"
state: production
stack: ["Python (FastAPI)", "Redis", "OpenSearch", "PostgreSQL", "Ollama"]
result: ["3.1M calls/day", "p99 overhead 180 ms"]
since: 2024-02
fallsOverAt: "~11k rps. The Redis quota path saturates first and degrades to fail-open with an alarm."
metrics:
  - { name: "Calls per day", value: "3,100,000", note: "across three tenants" }
  - { name: "Gateway overhead p50 / p99", value: "41 ms / 180 ms", note: "redaction included, measured at the edge" }
  - { name: "Redaction cost p99", value: "14 ms", note: "in process, before routing" }
  - { name: "Egress, air-gapped tenants", value: "0 bytes", note: "verified quarterly by the tenant" }
  - { name: "Failover to understudy", value: "0.31% of calls", note: "every one of them stamped and counted" }
failures:
  - { id: "5.1", status: fixed, note: "Version one buffered streaming responses so output redaction could run over a complete message. Time to first token collapsed and the product felt dead in the hand. Repaired with a two chunk token window, which is strictly worse in theory and invisible in practice." }
  - { id: "5.2", status: open, note: "Redaction is tuned for recall and over-redacts account numbers written in Bengali script. Known, unfixed, documented for tenants rather than hidden from them." }
  - { id: "5.3", status: accepted, note: "Quota state is not replicated across regions. A region failover resets windows and briefly permits double the intended rate. Cheaper than the consistency machinery, written down, with an alarm on it." }
---

A bank wants agentic customer service. Its regulator wants every token to stay inside the
bank. Those two sentences are the entire project, and everything difficult about it follows
from declining to compromise on either.

## 3. Decisions worth defending

**3.1. Redaction before routing.** Personal data detection runs in process before backend
selection. It costs 14 ms at p99, and it means a misconfigured route cannot leak. A control
that depends on the correctness of the next hop is not a control, it is a hope with a runbook.

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
