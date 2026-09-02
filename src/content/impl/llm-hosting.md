---
section: "3.8"
title: "Custom LLM training and hosting"
summary: "Open weight models fine tuned and served on self managed GPU infrastructure for clients whose data cannot reach a public API, with promotion gated on evaluation."
slug: "llm-hosting"
state: unwritten
stack: ["LoRA / PEFT", "self-managed GPU", "quantisation", "model registry", "private cloud / on-prem"]
result: []
---

This implementation note is **listed but not written**. The index carries what the work
covers: open weight models hosted on self managed GPU infrastructure for clients who cannot
send data to a public API, in managed private cloud and on-premise installs. Fine tuning runs
with LoRA and PEFT over domain corpora for terminology, tone and Bangla performance, measured
against a prompted baseline before anything ships. The serving layer is owned end to end,
covering inference servers, batching and quantisation for throughput, GPU utilisation and
cost per model, and autoscaling against request load. Traffic routes across self hosted open
weights and commercial APIs, chosen per task on cost, latency and accuracy. Promotion is
gated on evaluation with golden datasets, regression suites, hallucination and safety checks,
and human review on regulated flows. A model change moves through the model registry with
versioning and rollback, under the same change control as a code release.

It carries no numbers. GPU utilisation, cost per model and the size of the gain over the
prompted baseline are all measured in production and none has been supplied for publication.

It carries no failure mode either, which Principle 4.8 requires before an architecture is
presented.

Three papers in Section 5 are about parts of this note and should be read against it when it
is written. Routing per task on cost is 5.17. Gating promotion on an evaluation is 5.19 and
5.20, and the honest version of this page will have to say what the evaluation could not
catch.
