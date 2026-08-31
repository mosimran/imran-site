---
section: "5.2"
title: "Vibe Coding and the IKEA Effect"
summary: "Assembly feels like understanding. It is not the same feeling twice."
slug: "vibe-coding"
published: 2026-05-02
revised: 2026-08-31
state: holding
confidence: 0.75
retires:
  - "A blind study in which engineers who assembled a system without reading its generated internals diagnose induced faults in it at the same rate and speed as engineers who wrote the equivalent system by hand."
  - "Evidence that the confidence gap in Section 3 closes with tooling rather than with reading, for example a generation workflow whose users predict failure modes as accurately as authors do."
  - "A demonstration that the effect is about ownership rather than comprehension, appearing at equal strength for code the engineer merely selected rather than assembled, which would make this a paper about a different mechanism."
history:
  - { date: 2026-08-31, note: "A pointer added under the abstract naming 5.1 as the general argument, after 5.1 absorbed this mechanism as its Section 8. Nothing in the argument changed and the confidence did not move. The link is stated in the text because seeAlso is only carried in the machine-readable surfaces, so a reader on this page could not see it.", confidenceAfter: 0.75 }
  - { date: 2026-08-14, note: "Text written: the three kinds of knowledge, why the confidence signal misfires, the four practices, and the library objection. Retirement conditions added. Confidence unchanged.", confidenceAfter: 0.75 }
  - { date: 2026-05-02, note: "Listed in Section 5 with a title, a summary and a confidence value. No text.", confidenceAfter: 0.75 }
seeAlso: ["5.1", "5.4", "5.8"]
---

<div class="memo"><b>Abstract.</b> Assembling a working system from parts you never read
produces a strong, sincere sense of understanding it. The labour is real, so the
ownership is real, but the labour was integration and the understanding it purchased is
of the seams rather than of the parts. The gap is invisible while the system works and
becomes the whole problem the first time it fails in a way the assembly did not cover.
This is not an argument about who or what wrote the code. It is an argument about what
reading buys and what assembling does not. <b>Confidence 0.75.</b> Section 5 has the
objection I cannot answer: nobody reads their TLS library either.</div>

<p class="note">This paper is the long form of one mechanism. Paper 5.1, <a href="/papers/competence-porn/">Competence Theatre</a>, sets it beside the other one, watching, and argues that the two are the same substitution reached from opposite postures. Its Section 8 compresses what is below; this page remains the full treatment.</p>

## 1. The claim

The IKEA effect is the finding that people place higher value on things they assembled
themselves. The interesting part for engineering is not the valuation. It is that the
sensation of competence produced by assembly is nearly indistinguishable, from the
inside, from the sensation produced by comprehension.

Both feel like understanding. Both produce accurate answers to "what does this do". They
diverge on one question, and it is the only question that matters during an incident:
*how does this fail?*

## 2. Three kinds of knowledge

<table class="rt">
<thead><tr><th>Knowledge</th><th>What buys it</th><th>When it is needed</th></tr></thead>
<tbody>
<tr><td class="hd" data-l="Knowledge">What it does</td><td data-l="Bought by">Reading the interface, or watching it run once</td><td data-l="Needed">Every day. Cheap and sufficient most of the time.</td></tr>
<tr><td class="hd" data-l="Knowledge">How it does it</td><td data-l="Bought by">Reading the implementation, or reconstructing it from behaviour</td><td data-l="Needed">During extension and optimisation. Assembly sometimes supplies this by accident.</td></tr>
<tr><td class="hd" data-l="Knowledge">How it fails</td><td data-l="Bought by">Reading the error paths, or surviving them in production</td><td data-l="Needed">During incidents, and only then. Assembly never supplies it.</td></tr>
</tbody>
</table>

The third row is where the argument lives. Error paths are the least-read code in any
system: they are rarely exercised in development, rarely covered by the happy-path tests
that assembly produces, and rarely present in the example the code was modelled on.
Generated and copied code inherits this bias, because it is trained on and drawn from
code that is itself mostly happy path.

<figure>
<pre>
  perceived                     actual
  competence                    competence

     |###########|                |####|
     |###########|                |####|
     assembly done               what it does
     working system              how it fails: 0
</pre>
<figcaption>Figure 1. The divergence is not laziness. Assembly genuinely produces
one of the three kinds of knowledge, and the feeling does not distinguish
them.</figcaption>
</figure>

## 3. Why the confidence signal misfires

Effort is the proxy the mind uses for depth of understanding, and integration work is
genuinely effortful. Getting four components to agree on a data format, an auth scheme
and a deployment target is hard, absorbing, and produces a legitimate sense of
achievement. The proxy is not stupid. It is measuring the wrong quantity.

Two effects make it worse in current practice.

**3.1. The feedback loop is fast and one-sided.** A generated module that compiles and
passes the tests you asked for arrives in seconds, and the loop closes on "it works".
Nothing in that loop ever asks what happens when the upstream returns a 503 mid-stream.

**3.2. Review inherits the same bias.** A reviewer reads a diff for correctness against
the stated intent. If neither author nor reviewer has read the error paths, the review
confirms the happy path twice and records it as two independent confirmations.

<div class="mtr">
<div class="r"><span class="k">Happy path, authored</span><span class="b"><i style="width:95%"></i></span><span class="v">read</span></div>
<div class="r"><span class="k">Happy path, generated</span><span class="b"><i style="width:70%"></i></span><span class="v">skimmed</span></div>
<div class="r"><span class="k">Error paths, authored</span><span class="b"><i style="width:45%"></i></span><span class="v">partly</span></div>
<div class="r"><span class="k">Error paths, generated</span><span class="b"><i class="f" style="width:10%"></i></span><span class="v">rarely</span></div>
</div>

<p class="dim">Figure 2. Ranked from code review, not measured. The bottom row is the claim; the others are context for it.</p>

## 4. The remedy, which is not "write it yourself"

Refusing generated or borrowed code is not available and would not be correct. Every
engineer working today assembles from parts they did not write, and that has been true
since the first shared library. The remedy is to buy the third kind of knowledge
deliberately, because it is the only kind assembly never supplies for free.

**4.1. The prediction test.** Before merging, state in one sentence how this component
fails: what it does on timeout, on partial write, on malformed input, on a dependency
returning success with an empty body. If you cannot answer without running it, you have
assembled it and not read it. That is fine, and now you know which one you did.

**4.2. Read the error paths only.** A full read of generated code is often not worth the
time. A read of every branch that handles a non-success condition almost always is, and
it is a small fraction of the lines.

**4.3. Put the failure mode in the pull request.** One line, in the description. It makes
the gap visible to the reviewer, converts an assumption into a claim, and is the artefact
that pays off during the incident eighteen months later. See 5.11.

**4.4. Add one adversarial test per component, not per function.** Not coverage. One test
that does the rude thing: kills the connection halfway, sends the wrong content type,
returns 200 with an empty body.

## 5. The strongest objection

<div class="note"><b>This has always been true and we have been fine.</b> Nobody reads the
implementation of their TLS library, their JSON parser or their database driver, and the
industry works. If the argument does not explain why assembling from a well-tested
library is safe while assembling from generated code is not, it is nostalgia rather than
analysis. My attempted answer is that a widely used library has had its error paths
exercised by thousands of other people, and the resulting knowledge exists publicly in
issue trackers and postmortems even if I have not read it, whereas code generated for me
alone has a population of one and no such commons. I think that distinction is real, but
I cannot yet state where the population threshold sits, and without that the argument
does not give actionable advice about any specific dependency. That is the entire gap
between 0.75 and 0.9. A second objection I take seriously: the effect may be about
ownership rather than comprehension, in which case the remedy in Section 4 is aimed at
the wrong target.</div>

## 6. What this paper does not claim

Generated code is not lower quality. In my experience it is often better than the median
hand-written equivalent on the happy path, and the engineers using these tools are not
less skilled than the ones who do not. Reading is not always worth the time either;
Section 4.2 exists precisely because it usually is not.

The claim is narrow. Assembly produces two of the three kinds of knowledge in Section 2,
the missing one is the one incidents require, and the feeling of understanding does not
report which of them you are holding.
