---
section: "5.24"
title: "A Capability Lives in Three Places and Nothing Checks They Agree"
summary: "A declaration that it exists, a route that reaches it, and code that does the work. Split across three files, they drift, and the result presents as working, which is worse than absent."
slug: "three-halves"
published: 2026-09-04
revised: 2026-09-04
state: draft
confidence: 0.70
retires:
  - "A system of this shape running for a year with no drift between its three parts and no test enforcing agreement, where the parts are edited by more than one person. That would make the drift a discipline problem rather than a structural one, and the paper claims it is structural."
  - "A registry-and-dispatch design where a mismatch fails loudly at boot in every case rather than only the cases somebody enumerated. If the failure can be made total and immediate by construction, the argument for reconciliation and dark shipping is an argument for a worse design."
  - "Evidence that a caller, human or model, recovers as well from a capability that answers wrongly as from one that is absent. The paper's whole weight is on those two being different, and if they are equivalent then partial deployment costs nothing."
history:
  - { date: '2026-09-04', note: 'First publication.' }
---

<div class="memo"><b>Abstract.</b> A capability is rarely one thing. It is a declaration that it
exists, a route that reaches it, and an implementation that does the work, and those three live
in different files, often in different services. Nothing in the ordinary run of a build checks
that all three refer to the same capability. When they diverge, the system does not fail. It
answers, incorrectly or emptily, which is a worse outcome than being unable to answer at all.
<b>Confidence 0.70.</b> Section 5 has the objection I cannot answer: a sufficiently strict
design makes the mismatch impossible rather than merely detectable, and I do not know how far
that generalises.
<div class="note"><b>Confidence set by the drafter, not the author.</b> A confidence value on
this site is the author's own credence and nobody else can hold it for him. This one is a
placeholder at the draft tier so that nothing is overclaimed while it stands, and it is tracked
at P26.</div></div>

## 1. The claim

Take any capability a system exposes: a tool an agent can call, a permission a role can hold, a
job a scheduler can run, a plugin a host can load. In almost every design it exists in three
places.

There is a **declaration** somewhere, saying the capability exists and what it is called. There
is a **route**, mapping an incoming name to something that handles it. And there is an
**implementation** that does the work. The declaration is usually data, the route is usually a
switch or a table, and the implementation is usually a class or a function in a third file.

Nothing checks that the three agree. Type systems do not, because the join happens on a string.
Tests do not, because a test calls the implementation directly or calls the route with a name
someone typed correctly. Review does not, because the three parts are rarely in the same diff.

**The claim is that this is structural rather than a matter of care**, and that the failure it
produces is worse than the capability being missing.

## 2. How it goes wrong, concretely

Four shapes, all of which have happened in a system I built.

**A rename lands in two places out of three.** The implementation is renamed and the route
updated, and the declaration still advertises the old name. A caller reads the declaration, asks
for the old name, and the route has no case for it.

**A declaration with nothing behind it.** The name is added to the registry during design and
the implementation is never written, or is written and later removed. Everything that reads the
registry believes the capability exists.

**An implementation nothing declares.** The work is done, the route can reach it, and the list
that callers read does not mention it. The capability is invisible and therefore never used,
which is the quiet version and can persist for a very long time.

**A shape mismatch at the boundary.** All three agree on the name and disagree on what comes
back. The caller renders nothing and reports nothing, because from its side an empty result and
an unexpected result look identical.

## 3. Why this is worse than absence

A missing capability produces a clean failure. The caller asks, gets a refusal that says the
thing does not exist, and does something else. A human reads the error and files a bug.

A capability that is declared and unreachable produces a **confident wrong answer**. The caller
consults the declaration, finds the capability, forms a plan that depends on it, and only
discovers the problem partway through, in a state it did not design for.

This is sharper with a model on the other end than with a person, though it is not new. A model
reads the declaration as ground truth, because that is what a declaration is for. It will build
a multi-step plan around a capability that cannot run, and when the step fails it will often
retry, reword, or narrate a plausible reason for the failure to the user. None of those are
recoveries. A person hitting the same wall opens the code.

## 4. What actually fixes it

**Test the three against each other, in both directions.** Every declared name must resolve to a
route and an implementation. Every implementation must be declared. Both directions matter: the
first catches the advertised-but-missing case and the second catches the invisible one, and a
test that only walks one direction finds half the problem while reporting a clean result.

**Reconcile at boot, and log rather than exit.** The system that holds the declaration and the
system that holds the routes are often different processes. Have the caller fetch the route list
at startup and compare it with what it intends to advertise. Making that fatal is tempting and
wrong: a mismatch on a capability nobody is calling today should not take down a service that is
otherwise healthy. It should be loud in a log that somebody reads.

**Ship dark, reads before writes.** A capability can exist in all three places and be withheld
from callers until it has been exercised. Turning on the read-only ones first bounds the damage
of the mismatch you did not catch, because a read that returns the wrong shape is a bug and a
write that does is an incident.

None of this is clever. It is a schedule and two tests, and the reason it is rare is that
nothing hurts until the day something does.

## 5. What I cannot answer

**A strict enough design makes the mismatch impossible rather than detectable.** If the
declaration is generated from the implementation, or the route is derived from the registry at
build time, there are no longer three things to disagree. Some systems can be built that way.
Whether most can, once the parts are owned by different teams and deployed on different
schedules, I do not know, and this paper is an argument for reconciliation because I have not
seen a system that achieved generation across a service boundary and kept it.

That is the objection that holds the confidence value down. If generation generalises, this
paper is advice for people who have already made the wrong choice.
