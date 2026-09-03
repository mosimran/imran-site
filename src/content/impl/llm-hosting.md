---
section: "3.8"
title: "Custom LLM training and hosting"
summary: "Open weight models fine tuned and served on self managed GPU infrastructure for clients whose data cannot reach a public API, with promotion gated on evaluation."
slug: "llm-hosting"
state: production
stack: ["LoRA / PEFT", "self-managed GPU", "quantisation", "model registry", "private cloud / on-prem"]
result: []
fallsOverAt: "GPU utilisation, which is an economic limit rather than a technical one. Reserved capacity is paid for whether requests arrive or not, so the approach stops making sense below a utilisation floor that depends on the traffic shape and the hardware, and that floor is a property of a specific deployment."
failures:
  - { id: "5.1", status: fixed, note: "A fine tune that loses to a well written prompt, shipped because nobody ran the comparison. Adapting a model produces something measurably different from the base, and different reads as better when the only evidence is a demonstration. The base model with a careful prompt and a few examples wins more often than teams expect, especially on tasks that turn on instruction following rather than vocabulary. The rule that fixes it is mechanical: every candidate is scored against a prompted baseline on the same evaluation set, and a candidate that does not beat it does not ship." }
  - { id: "5.2", status: open, note: "An evaluation catches the failures it was built from. A golden dataset is assembled out of problems already seen, so it encodes last quarter's weaknesses and is silent on anything new. A model can pass every regression suite, every hallucination probe and every safety check, then fail in production on a category nobody had thought to write a case for. Sampling live traffic back into the golden set narrows the window and does not close it, because the sample is drawn after the damage. This is the specific gap papers 5.19 and 5.20 argue about, and this note does not have an answer to it." }
  - { id: "5.3", status: accepted, note: "Utilisation decides the economics and traffic will not cooperate. GPUs are reserved and paid for continuously while request load is peaky, so the cost per useful token is set by the idle hours rather than the busy ones. Batching raises utilisation and adds queuing latency, which is the trade, and it is bounded by how long a caller will wait. Beyond that the levers are commercial rather than technical: consolidating models onto shared hardware, and routing work that has no residency requirement to a commercial API instead." }
  - { id: "5.4", status: open, note: "Quantisation damage is uneven and aggregate benchmarks hide it. Reducing precision buys throughput and memory at a cost that looks negligible on a summary score, while a specific capability degrades sharply. The usual casualties are long context reasoning, structured output that has to parse, and low resource languages, which is the one that matters here: Bangla performance can fall while an English-weighted benchmark barely moves. Per capability evaluation before and after quantisation is the only way to see it, and few teams run one." }
  - { id: "5.5", status: accepted, note: "Adapters are trained against a base model version, so upgrading the base invalidates them. A better open weight model arrives and the apparent work is a swap, while the real work is retraining every adapter and re-running the whole evaluation matrix against them. Teams that treat the upgrade as a routine dependency bump discover the cost afterwards. The decision is to plan base model migration as recurring scheduled work with its own budget, and to keep the adapter count small enough that the matrix stays affordable." }
---

<div class="memo"><b>How to read this note.</b> This is the reference design for training and
serving open weight models on infrastructure you own: the constraints, the decisions that follow,
and the failure modes this work has, with the known answers to each. It is a solution path for a
system like the one built rather than a disclosure of that system's internals. Corpora, model
choices, hardware, tuning parameters and per-client configuration are deliberately absent.
<br><br>What is specific and confirmed came from the owner: open weight models fine tuned with
LoRA and PEFT over domain corpora for terminology, tone and Bangla performance, served on self
managed GPU infrastructure in private cloud and on-premise installs, with promotion gated on
evaluation and model changes moving through a registry under the same change control as code.
This note reports no figures, and section 4 names the three that would matter.</div>

## 1. The constraint

Two requirements arrive together and pull against each other.

The first is that the data cannot leave. For a bank or a telecom operator under residency rules,
sending customer text to a public API is not a procurement question, it is a prohibited act, and
the model therefore has to run where the data already is.

The second is that the work still has to be good. A client accepting a weaker system because it
runs locally is a client who will stop using it, and the internal comparison people actually make
is against whatever they can reach on their phone.

Fine tuning an open weight model is the lever that closes most of that gap. The consequence,
which is easy to underestimate, is that **you have now bought the entire serving stack**. A
hosted API hides capacity planning, utilisation, batching, quantisation, model versioning and
rollback behind a price per token. Running it yourself means those become your problems on a
Tuesday, and the one that decides whether the approach survives contact with a finance review is
utilisation, because reserved GPUs cost the same whether requests arrive or not.

There is a third thing worth saying early. Fine tuning is the cheap part. Assembling an
evaluation you trust costs more, takes longer, and is what determines whether anything ships.

## 2. The decisions, and where each one is enforced

<figure>
<div class="dia">
<svg viewBox="0 0 640 292" role="img" aria-label="A domain corpus feeds LoRA training, producing a candidate adapter. The candidate goes to an evaluation gate holding four checks: a prompted baseline comparison, a golden dataset and regression suite, hallucination and safety probes, and human review for regulated flows. A candidate that fails any check is rejected and never reaches the registry. A candidate that passes enters the versioned model registry, from which serving pulls. Serving applies batching and quantisation and autoscales against GPU load. A router in front chooses per task between self-hosted adapters, the base model, and a commercial API, on cost, latency and accuracy. A rollback arrow runs from the registry back to serving, showing any previous version can be restored.">
<defs><marker id="ha" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10z" fill="currentColor"/></marker></defs>

<text class="d" x="10" y="14" font-size="9" letter-spacing=".9">TRAINING PRODUCES A CANDIDATE, NOT A RELEASE</text>
<rect x="10" y="24" width="92" height="40" rx="3" fill="none" stroke="currentColor" stroke-width="1.25"/>
<text x="56" y="42" font-size="9.5" text-anchor="middle">domain corpus</text>
<text class="d" x="56" y="56" font-size="8.5" text-anchor="middle">terminology, tone</text>

<rect x="114" y="24" width="92" height="40" rx="3" fill="none" stroke="currentColor" stroke-width="1.25"/>
<text x="160" y="42" font-size="9.5" text-anchor="middle">LoRA / PEFT</text>
<text class="d" x="160" y="56" font-size="8.5" text-anchor="middle">adapter, not a fork</text>

<rect x="218" y="24" width="92" height="40" rx="3" fill="none" stroke="currentColor" stroke-width="1.25"/>
<text x="264" y="47" font-size="9.5" text-anchor="middle">candidate</text>

<g class="sd" stroke-width="1.25">
<line x1="102" y1="44" x2="110" y2="44" marker-end="url(#ha)"/>
<line x1="206" y1="44" x2="214" y2="44" marker-end="url(#ha)"/>
<line x1="310" y1="44" x2="330" y2="44" marker-end="url(#ha)"/>
</g>

<rect class="ab sa" x="334" y="18" width="296" height="86" rx="3" stroke-width="1.5"/>
<text class="a" x="346" y="34" font-size="9.5">the gate, and nothing goes round it</text>
<text class="d" x="346" y="52" font-size="8.5">beats a prompted baseline on the same set</text>
<text class="d" x="346" y="66" font-size="8.5">golden dataset and regression suite</text>
<text class="d" x="346" y="80" font-size="8.5">hallucination and safety probes</text>
<text class="d" x="346" y="94" font-size="8.5">human review on regulated flows</text>

<line class="sd" x1="482" y1="104" x2="482" y2="126" stroke-width="1.25" marker-end="url(#ha)"/>
<text class="r" x="492" y="120" font-size="9">fail any one and it stops here</text>

<text class="d" x="10" y="148" font-size="9" letter-spacing=".9">THE REGISTRY IS THE ONLY WAY IN, AND THE WAY BACK</text>
<rect x="334" y="130" width="296" height="42" rx="3" fill="none" stroke="currentColor" stroke-width="1.5"/>
<text x="482" y="148" font-size="10" text-anchor="middle">model registry, versioned</text>
<text class="d" x="482" y="163" font-size="8.5" text-anchor="middle">same change control as a code release</text>

<rect x="334" y="188" width="296" height="42" rx="3" fill="none" stroke="currentColor" stroke-width="1.5"/>
<text x="482" y="206" font-size="10" text-anchor="middle">serving</text>
<text class="d" x="482" y="221" font-size="8.5" text-anchor="middle">batching, quantisation, autoscale on GPU load</text>
<line class="sd" x1="420" y1="172" x2="420" y2="184" stroke-width="1.25" marker-end="url(#ha)"/>
<line class="sa" x1="560" y1="184" x2="560" y2="176" stroke-width="1.5" marker-end="url(#ha)"/>
<text class="a" x="568" y="182" font-size="8.5">rollback</text>

<rect class="ab sa" x="10" y="188" width="300" height="42" rx="3" stroke-width="1.5"/>
<text class="a" x="160" y="206" font-size="10" text-anchor="middle">router, per task</text>
<text class="d" x="160" y="221" font-size="8.5" text-anchor="middle">adapter, base model, or commercial API</text>
<line class="sd" x1="330" y1="209" x2="314" y2="209" stroke-width="1.25" marker-end="url(#ha)"/>

<line class="sd" x1="10" y1="252" x2="630" y2="252" stroke-width="1" opacity=".4"/>
<text class="d" x="10" y="270" font-size="9.5">Routing is a cost decision on every request. Work with no residency requirement can leave,</text>
<text class="d" x="10" y="286" font-size="9.5">which is what keeps the reserved hardware busy with the work that cannot.</text>
</svg>
</div>
<figcaption>Figure 1. Training is the short arrow on the left. Everything expensive happens
between the candidate and the registry, and everything commercial happens after it.</figcaption>
</figure>

**2.1. Adapters rather than forks.** LoRA and PEFT produce a small artifact against a known base,
so one base model can serve several specialisations, a version is a file rather than a
deployment, and reverting is instant. Full fine tuning gives up all three of those properties for
a gain that rarely justifies them at this scale.

**2.2. Every candidate is scored against a prompted baseline.** This runs before anything else,
on the same evaluation set, and it exists because a fine tune that loses to a good prompt is
common and invisible without the comparison. The rule is **enforced at the registry**: a
candidate without a baseline result attached cannot be promoted, so skipping the comparison
blocks the release rather than quietly passing it.

**2.3. Promotion is gated, and the gate has four parts.** Golden datasets, regression suites,
hallucination and safety probes, and human review on anything touching a regulated flow. Failing
one is failing the gate. An override would be used within a month of existing, so none exists.

**2.4. A model change is a code change.** Versioned in the registry, promoted through the same
approvals, rolled back by the same mechanism. Model artifacts get treated as configuration in
most organisations, which is how a system arrives at nobody being able to say which weights
answered a question a customer is now complaining about.

**2.5. Routing per task, on cost and latency and accuracy together.** Work that carries no
residency requirement can go to a commercial API, which keeps the reserved hardware occupied by
the work that has nowhere else to go. Paper 5.17 makes this argument at length.

## 3. Why a client pays for this

The residency requirement is what creates the market, and the quality bar is what keeps it.

A client under residency rules has two options that both fail. They can use nothing, and watch
their competitors automate. Or they can accept a visibly worse local system, which their own
staff will route around within a quarter by pasting text into whatever they can reach personally,
which recreates the exact leak the rule existed to prevent. A locally hosted model that is
genuinely good enough removes the incentive to circumvent it, and that is the actual security
outcome.

Cost per model is the second half of the argument, and it is the half that decides renewal. A
client can see the GPU bill. Showing that a task moved to a smaller model at a fraction of the
cost with no measured loss in quality is the conversation that keeps the platform funded, and it
depends on having an evaluation credible enough that "no measured loss" means something.

## 4. Figures

**This note reports none.** The three the stub named remain the three that matter: GPU
utilisation, cost per model, and the size of the gain over a prompted baseline. All are measured
in production and none has been supplied for publication.

The third of those deserves a note. A gain over baseline is only as meaningful as the evaluation
it was measured on, and failure mode 5.2 says that evaluation is built from failures already
seen. A published improvement figure carries the coverage of its test set inside it, and quoting
the number without the coverage is how a system acquires more confidence than it earned.

## 5. What the evaluation could not catch

The stub for this note said the honest version of the page would have to answer this, so it goes
in its own section rather than a caveat at the end.

The gate described in section 2 is built out of known problems. Golden datasets come from
production incidents and reviewed transcripts, regression suites come from bugs that were fixed,
and safety probes come from categories somebody thought to enumerate. Each one is a record of
something that already went wrong. A failure with no precedent in that record passes every check
in the gate, arrives in production, and becomes a golden dataset entry afterwards, which protects
the next client rather than the one who found it.

Sampling live traffic back into the evaluation narrows the window. It does not close it, because
the sample is drawn after the fact and only from behaviour somebody flagged. Human review on
regulated flows narrows it further and reviews a fraction. Both of those are worth their cost and
neither converts the gate into a proof.

The honest description of what promotion gating buys is a floor rather than a guarantee: no
release is worse than the last one **on the things we have learned to measure**. Papers 5.19 and
5.20 are the argument for why that distinction matters, and this note is a case of it rather than
a rebuttal.

## 6. What I would do differently

**Build the golden dataset before training anything.** It is the artifact that decides what
ships, it takes the longest to assemble because it needs real examples with agreed answers, and
it routinely gets started after the first model is already waiting. Every week the evaluation
lags the model is a week of decisions made on a demonstration.

**Evaluate quantisation per capability rather than on an aggregate score.** Failure 5.4 is open
and it is the one most likely to be missed here, because an English-weighted benchmark can stay
flat while Bangla performance falls away underneath it. The check costs one extra evaluation run
per quantisation choice.

**Budget base model migration as scheduled recurring work.** Failure 5.5 is accepted, and what
makes it painful is treating each upgrade as a surprise. Adapters are trained against a base
version, so a base upgrade means retraining all of them and re-running the whole matrix. Planning
that on a cadence keeps the adapter count honest, because a specialisation nobody will pay to
retrain is a specialisation that should not exist.
