---
section: "3.7"
title: "Voice AI for customer service"
summary: "Inbound and outbound voice agents on the Omazy CX platform, with Bangla and Banglish speech in production and live handoff to a human under SLA routing."
slug: "voice-ai"
state: unwritten
stack: ["streaming STT", "TTS", "telephony", "retrieval grounding", "Bangla / Banglish"]
result: []
---

This implementation note is **listed but not written**. The index carries what the work
covers: a speech pipeline running streaming speech to text, intent and slot handling,
retrieval grounded response generation and text to speech, with barge-in and turn-taking
tuned for latency. Code-switched Bangla and Banglish audio is handled in production, which
off-the-shelf models do poorly. A live handoff moves the call to a person with transcript and
context preserved, routed against an SLA. Telephony integration carries carrier-scale
concurrency, with recording retention rules and PII redaction on stored audio.

It carries no numbers. The operational targets tracked per call are known by name, end to
end response latency, word error rate on Bangla audio, containment rate and escalation rate,
and none of their values have been supplied for publication. Section 3 admits a system with
the numbers it produced, so this page waits.

It carries no failure mode either, and Principle 4.8 says an architecture is not presented
without one.

The automated quality scoring on this platform, which grades voice interactions for policy
adherence, accuracy and empathy, is an instance of the thing paper 5.19 is about. When the
numbers arrive, that section should say how the scorer is validated against human review.
