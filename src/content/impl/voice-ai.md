---
section: "3.7"
title: "Voice AI for customer service"
summary: "Inbound and outbound voice agents on the Omazy CX platform, with Bangla and Banglish speech in production and live handoff to a human under SLA routing."
slug: "voice-ai"
revised: 2026-09-03
state: production
stack: ["streaming STT", "TTS", "telephony", "retrieval grounding", "Bangla / Banglish"]
result: []
fallsOverAt: "The latency budget, not the concurrency. Telephony scales by adding capacity. The loop from end of speech to first audio out does not, because every stage that would make the answer better spends the budget that keeps the conversation alive."
failures:
  - { id: "5.1", status: accepted, note: "Every quality improvement is bought with latency, and the budget is fixed by human patience rather than by engineering. A larger model, an extra retrieval hop, a better-sounding voice, a safety pass over the response: each is defensible alone and the sum is a conversation that feels broken. The discipline is a per-stage budget agreed before anything is built, with a named owner for each stage, so that spending 120 ms somewhere is a decision rather than a discovery." }
  - { id: "5.2", status: open, note: "Code-switched speech degrades in the places that matter most. Speakers move between Bangla and English inside a single sentence, and models trained on monolingual corpora handle the switch worst on exactly the tokens the call is about: names, amounts, account terminology, product names. Aggregate word error rate looks acceptable while the words that carry the intent are the ones being lost. It is narrowed by an evaluation set built from real code-switched audio and by biasing recognition toward domain vocabulary, and it is not solved." }
  - { id: "5.3", status: accepted, note: "Barge-in trades two failures against each other and cannot avoid both. Tuned sensitively, background noise and cross-talk stop the agent mid-sentence and the caller hears a stammer. Tuned conservatively, the caller talks over an agent that will not stop, which is the more infuriating of the two. There is no threshold that is right for a quiet office and a roadside call, so the decision is to favour interruption, because a caller who cannot interrupt concludes the system is not listening." }
  - { id: "5.4", status: open, note: "Containment rate is a perverse metric taken alone. It measures calls that did not reach a human, and the cheapest way to improve it is to make escalation harder, which harms the caller and moves the cost to a channel nobody is measuring. It only means anything paired with an outcome measure, and pairing it properly is unresolved: the outcome often lands days later in a different system, and attributing it back to the call is guesswork." }
  - { id: "5.5", status: open, note: "The automated quality scorer drifts from human judgement, and the moment it is used as ground truth it becomes a target rather than a measurement. Grading voice interactions for policy adherence, accuracy and empathy is the only way to review at volume, and a scorer nobody re-validates is an opinion with a decimal point. It needs a standing sample re-scored by people, with the agreement rate published alongside the scores. This is the specific case paper 5.19 argues about." }
---

<div class="memo"><b>How to read this note.</b> This is the reference design for a production
voice agent in customer service: the constraint, the decisions that follow, and the failure modes
this kind of system has, with the known answers to each. It is a solution path for a system like
the one built rather than a disclosure of that system's internals. Prompts, model choices, tuning
thresholds, carrier arrangements and per-tenant configuration are deliberately absent.
<br><br>What is specific and confirmed: the platform, code-switched Bangla and Banglish handled
in production, live handoff to a person under SLA routing, and telephony at carrier-scale
concurrency with recording retention rules and redaction on stored audio. This note reports no
figures, and section 4 names the four that would matter.</div>

## 1. The constraint

Voice is a latency contract that nobody signs and everybody enforces.

In text, a two second wait is normal. In a phone call, one second of silence is long enough for
the caller to say "hello?", and two is long enough for them to conclude the line has dropped.
The entire loop has to fit inside that: detect the end of speech, transcribe it, work out what
was meant, retrieve whatever grounds the answer, generate the answer, synthesise it, and get
audio moving. Six stages, one budget, set by human patience rather than by anything technical.

**Every improvement available spends that budget.** A better model, an extra retrieval hop, a
safety pass, a more natural voice: each is worth having and each costs time the conversation does
not have. That tension does not resolve. It gets managed, or it gets discovered late.

There is a second constraint here that is not general. **The callers code-switch.** Bangla and
English are mixed inside single sentences, and the models available off the shelf are trained on
corpora where that does not happen. They do not fail evenly. They fail on names, amounts and
account terminology, which is to say they fail on the words the call is actually about, while the
aggregate error rate stays respectable enough to look fine on a dashboard.

## 2. The decisions, and where each one is enforced

<figure>
<div class="dia">
<svg viewBox="0 0 640 288" role="img" aria-label="Caller audio enters voice activity detection and endpointing, then streaming speech to text which emits partial hypotheses. Those partials start retrieval and intent handling early, before the caller has finished speaking. Response generation feeds text to speech and audio returns to the caller. A barge-in path runs from the caller's audio directly to the text to speech stage and stops playback immediately. A separate branch shows handoff to a human agent carrying the transcript and context, routed against an SLA, drawn as a first-class path rather than an error path. Stored audio passes through redaction before retention.">
<defs><marker id="va" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10z" fill="currentColor"/></marker></defs>

<text class="d" x="10" y="14" font-size="9" letter-spacing=".9">ONE BUDGET, SIX STAGES, SPENT IN ORDER</text>
<rect x="10" y="24" width="70" height="42" rx="3" fill="none" stroke="currentColor" stroke-width="1.25"/>
<text x="45" y="42" font-size="10" text-anchor="middle">caller</text>
<text class="d" x="45" y="57" font-size="8.5" text-anchor="middle">audio in</text>

<rect class="ab sa" x="92" y="24" width="106" height="42" rx="3" stroke-width="1.5"/>
<text class="a" x="145" y="42" font-size="9.5" text-anchor="middle">endpointing</text>
<text class="d" x="145" y="57" font-size="8.5" text-anchor="middle">per locale</text>

<rect x="210" y="24" width="106" height="42" rx="3" fill="none" stroke="currentColor" stroke-width="1.5"/>
<text x="263" y="42" font-size="9.5" text-anchor="middle">streaming STT</text>
<text class="a" x="263" y="57" font-size="8.5" text-anchor="middle">partials, not waiting</text>

<rect x="328" y="24" width="106" height="42" rx="3" fill="none" stroke="currentColor" stroke-width="1.5"/>
<text x="381" y="42" font-size="9.5" text-anchor="middle">intent + retrieval</text>
<text class="d" x="381" y="57" font-size="8.5" text-anchor="middle">starts on partials</text>

<rect x="446" y="24" width="90" height="42" rx="3" fill="none" stroke="currentColor" stroke-width="1.5"/>
<text x="491" y="47" font-size="9.5" text-anchor="middle">generate</text>

<rect class="ab sa" x="548" y="24" width="82" height="42" rx="3" stroke-width="1.5"/>
<text class="a" x="589" y="47" font-size="9.5" text-anchor="middle">TTS</text>

<g class="sd" stroke-width="1.25">
<line x1="80" y1="45" x2="88" y2="45" marker-end="url(#va)"/>
<line x1="198" y1="45" x2="206" y2="45" marker-end="url(#va)"/>
<line x1="316" y1="45" x2="324" y2="45" marker-end="url(#va)"/>
<line x1="434" y1="45" x2="442" y2="45" marker-end="url(#va)"/>
<line x1="536" y1="45" x2="544" y2="45" marker-end="url(#va)"/>
</g>

<path class="sd" d="M589 66 L589 92 L45 92 L45 70" fill="none" stroke-width="1.25" marker-end="url(#va)"/>
<text class="d" x="300" y="88" font-size="8.5">audio out, and the clock stops here</text>

<path class="sa" d="M45 24 L45 12 L589 12 L589 20" fill="none" stroke-width="1.75" marker-end="url(#va)"/>
<text class="a" x="250" y="9" font-size="9">barge-in: the caller speaking stops playback at once</text>

<text class="d" x="10" y="126" font-size="9" letter-spacing=".9">TWO PATHS THAT ARE NOT ERROR PATHS</text>
<rect x="10" y="136" width="290" height="46" rx="3" fill="none" stroke="currentColor" stroke-width="1.5"/>
<text x="155" y="154" font-size="10" text-anchor="middle">handoff to a person</text>
<text class="d" x="155" y="170" font-size="8.5" text-anchor="middle">transcript and context carried, routed on SLA</text>
<line class="sd" x1="381" y1="66" x2="381" y2="112" stroke-width="1.25"/>
<line class="sd" x1="381" y1="112" x2="155" y2="112" stroke-width="1.25"/>
<line class="sd" x1="155" y1="112" x2="155" y2="132" stroke-width="1.25" marker-end="url(#va)"/>

<rect x="330" y="136" width="300" height="46" rx="3" fill="none" stroke="currentColor" stroke-width="1.25"/>
<text x="480" y="154" font-size="10" text-anchor="middle">redaction, then retention</text>
<text class="d" x="480" y="170" font-size="8.5" text-anchor="middle">enforced on write, not on read</text>
<line class="sd" x1="381" y1="112" x2="480" y2="112" stroke-width="1.25"/>
<line class="sd" x1="480" y1="112" x2="480" y2="132" stroke-width="1.25" marker-end="url(#va)"/>

<line class="sd" x1="10" y1="206" x2="630" y2="206" stroke-width="1" opacity=".4"/>
<text class="d" x="10" y="224" font-size="9.5">Handoff is built as a normal outcome. A system where reaching a person is the failure case</text>
<text class="d" x="10" y="240" font-size="9.5">will be tuned to prevent it, and the metric that rewards that is failure mode 5.4.</text>
<text class="d" x="10" y="264" font-size="9.5">Retrieval starting on partial transcripts is the single largest saving available, because it</text>
<text class="d" x="10" y="280" font-size="9.5">overlaps a stage with the caller still talking rather than making one stage faster.</text>
</svg>
</div>
<figcaption>Figure 1. The only structural way to buy latency is to overlap stages, which is why
partial hypotheses drive retrieval before the caller has stopped speaking.</figcaption>
</figure>

**2.1. Nothing waits for a complete utterance.** Speech to text emits partial hypotheses and
retrieval starts on them. This is the one change that buys real time, because it overlaps work
with the caller still talking instead of making a stage faster. It costs occasional wasted
retrieval when the hypothesis changes, which is cheap, and it is the difference between a system
that answers and one that pauses.

**2.2. Barge-in is enforced at the audio layer, not requested politely.** Caller speech stops
playback immediately, before any component higher up is consulted. A system that finishes its
sentence while being interrupted is not perceived as slow, it is perceived as not listening,
and that judgement is made once and not revisited.

**2.3. Endpointing is tuned per locale rather than set as a constant.** How long a pause means
"I have finished" is a property of a language and a speaking style, not a number. A fixed
threshold clips one group of speakers and makes the system feel sluggish to another.

**2.4. Handoff to a person is a first-class path.** The transcript and the context move with the
call, and routing runs against an SLA. Building it as the error path is the common shape, and it
produces a system that treats reaching a human as a defect, which is the direct road to failure
mode 5.4.

**2.5. Redaction and retention are enforced on write.** Stored audio and transcripts are
redacted as they are stored, not filtered when they are read. A rule applied at read time is a
rule that fails open the first time somebody queries the store a new way, and recorded voice in
a regulated context is the least forgiving place for that.

## 3. What voice changes commercially

Voice is where automation either becomes real or stays a demonstration, because it is the channel
customers use when something matters.

The commercial argument rests on availability rather than deflection. A caller reaching an answer
in ninety seconds at three in the morning is a different product from a caller waiting for an office to
open, and the operators running the service get their queue back for the calls that genuinely
need a person. That is also why containment as a standalone target is corrosive: the value is in
handling the calls that should be handled and passing on the ones that should not, and a metric
that only counts the first will be optimised by damaging the second.

The language work is what makes it usable rather than impressive. A voice agent that handles
English cleanly and degrades on code-switched speech is a product for a subset of callers, and
in this market that subset is the minority. Handling Bangla and Banglish in production is not a
feature on a list, it is the difference between the system being usable by the customer base and
being usable by a demo.

## 4. Figures

**This note reports none.** The four tracked per call are known by name: end to end response
latency, word error rate on Bangla and code-switched audio, containment rate and escalation rate.
Their values have not been supplied for publication.

Two of them should never be published alone even when they are. Containment means nothing without
an outcome measure beside it, for the reason failure mode 5.4 gives, and word error rate on
aggregate audio hides the code-switching problem that failure mode 5.2 describes. If these
numbers arrive, they arrive in pairs or they mislead.

## 5. What I would do differently

**Agree the latency budget per stage before building any stage.** Failure 5.1 is accepted rather
than fixed because it is structural, but the version of it that hurts is the one discovered at
integration, when six teams have each spent a reasonable amount of time and the total is
unacceptable. A budget with a named owner per stage turns that from an argument into arithmetic.

**Build the code-switched evaluation set before choosing a model.** It is the artifact that tells
you whether anything is improving, and it takes weeks to assemble because it needs real audio.
Choosing a model on published benchmarks and then discovering how it handles Banglish is the
expensive order, and it is the usual one.

**Publish the scorer's agreement with human review, from the first day the scorer exists.**
Failure 5.5 is open and it decays quietly. A quality score that nobody has checked against a
person in six months is a number the organisation trusts more the longer it goes unvalidated,
which is precisely backwards.
