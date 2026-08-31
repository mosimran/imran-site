---
section: "5.18"
title: "The Harness Is Half the Solver"
summary: "The same weights score 28 or 49 depending on what wraps them. Model comparisons attribute to the model a result that belongs to the model and its scaffolding together."
slug: "harness-half-the-solver"
published: 2026-09-01
revised: 2026-09-01
state: holding
confidence: 0.85
retires:
  - "A body of published agent evaluations that hold the harness fixed and openly specified across every model compared, showing model choice accounts for most of the variance once scaffolding is controlled. That would make this a paper about a transitional sloppiness rather than a structural one."
  - "A harness that is genuinely model-agnostic in measurement: one whose effect on score is within a point or two across models of different training lineage. Section 4 rests on the effect being uneven, and an even effect would remove the confound."
  - "Vendors publishing harness specifications alongside benchmark results in enough detail to reproduce them, at which point the reader can separate the two contributions and the complaint is answered."
  - "Evidence that teams selecting models by leaderboard reach the same production outcome as teams who ran both candidates inside their own scaffolding, once the cost of running both is charged against them."
history:
  - { date: 2026-09-01, note: "Published. Three measurements, one of them the author's own reading of a vendor's caveat rather than the vendor's headline.", confidenceAfter: 0.85 }
seeAlso: ["5.17", "5.8", "5.1"]
---

<div class="memo"><b>Abstract.</b> A coding agent is a model plus the code that decides what
the model sees, which tools it can reach, and what happens when it stalls. That second half
has a name, the harness, and it moves benchmark results by more than the gap between many
of the models being compared. One study froze the weights, changed only the harness, and
watched the fail-to-pass rate go from 28 percent to 49. A vendor harness took a model from
about 30 percent to a perfect score on a public set. A third scaffold gained one model 23
points and cost another up to nine. Almost every published comparison reports the model and
omits the harness. <b>Confidence 0.85.</b> The measurements in Section 3 are other people's
and they are strong. The gap from 0.95 is Section 7, where the objection about ecological
validity is better than I can answer.</div>

## 1. The claim

You read that model X scores 62 on some agentic benchmark and model Y scores 55, and you
file that away as a fact about X and Y. What you actually have is a fact about X inside
somebody's scaffolding and Y inside somebody's scaffolding, and where those were different
scaffolds, the seven points you just learned may belong entirely to the code around the
model.

This matters because the two halves are procured differently. You choose the model with a
contract and a price per million tokens. You inherit the harness from whatever framework you
picked in week one, and then never look at it again, because it does not appear on any
comparison chart and nobody sells it to you.

The claim is narrow. **The harness accounts for enough of the variance in agent results that
attributing a benchmark score to the model alone is a measurement error, not a
simplification.**

## 2. What a harness actually is

Worth being concrete, because the word gets used loosely and the paper falls apart if you
picture the wrong thing.

A model takes text in and emits text out. That is the whole of it. Everything else that
makes an agent work is ordinary software somebody wrote, and it makes decisions the model
never sees:

<table class="rt">
<thead><tr><th style="width:180px">The harness decides</th><th>Which means it controls</th></tr></thead>
<tbody>
<tr><td class="hd" data-l="Decides">What goes in the context</td><td data-l="Controls">Which past turns survive, whether old tool output is trimmed or kept whole, what order things appear in, what gets summarised away</td></tr>
<tr><td class="hd" data-l="Decides">Which tools exist</td><td data-l="Controls">The vocabulary of actions available. A model cannot use a tool it was never shown.</td></tr>
<tr><td class="hd" data-l="Decides">What a tool result looks like</td><td data-l="Controls">Whether a 400 line stack trace arrives whole, truncated from the top, or summarised</td></tr>
<tr><td class="hd" data-l="Decides">What happens on a stall</td><td data-l="Controls">Whether a model repeating itself gets interrupted, re-prompted, or left to burn the window</td></tr>
<tr><td class="hd" data-l="Decides">When to stop</td><td data-l="Controls">Turn limits, token budgets, wall clock deadlines</td></tr>
<tr><td class="hd" data-l="Decides">Whether there is a second model</td><td data-l="Controls">Planner and worker splits, review passes, orchestration</td></tr>
</tbody>
</table>

None of that is intelligence. All of it changes the score.

<figure>
<div class="dia">
<svg viewBox="0 0 640 232" role="img" aria-label="Two boxes. The inner box contains only the model weights and is labelled as what a benchmark score gets attributed to. The outer box contains the model plus context policy, tool set, result formatting, stall handling and stop conditions, and is labelled as what was actually measured. An arrow shows that a task enters the outer boundary and a score leaves it, so the score describes the whole outer box.">
<defs>
<marker id="hh" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10z" fill="currentColor"/></marker>
</defs>
<text class="d" x="16" y="16" font-size="9.5" letter-spacing=".9">WHAT WAS ACTUALLY MEASURED</text>
<rect class="ab sa" x="112" y="26" width="416" height="150" rx="3" stroke-width="1.5"/>
<text class="a" x="128" y="46" font-size="10.5" letter-spacing=".8">HARNESS</text>
<g class="d" font-size="9.5">
<text x="128" y="66">context policy</text>
<text x="128" y="82">tool set</text>
<text x="128" y="98">result formatting</text>
<text x="128" y="150">stall handling</text>
<text x="128" y="166">stop conditions</text>
<text x="392" y="66">orchestration</text>
<text x="392" y="82">retry rules</text>
<text x="392" y="98">turn budget</text>
<text x="392" y="150">second model?</text>
<text x="392" y="166">summarisation</text>
</g>
<rect x="248" y="88" width="144" height="50" rx="3" fill="none" stroke="currentColor" stroke-width="1.5"/>
<text x="320" y="108" font-size="11" text-anchor="middle">model weights</text>
<text class="d" x="320" y="125" font-size="9" text-anchor="middle">what the score gets</text>
<text class="d" x="320" y="136" font-size="9" text-anchor="middle">attributed to</text>
<line class="sd" x1="16" y1="101" x2="106" y2="101" stroke-width="1.25" marker-end="url(#hh)"/>
<text class="d" x="16" y="94" font-size="9">task in</text>
<line class="sd" x1="534" y1="101" x2="624" y2="101" stroke-width="1.25" marker-end="url(#hh)"/>
<text class="d" x="560" y="94" font-size="9">score out</text>
<line class="sd" x1="16" y1="196" x2="624" y2="196" stroke-width="1" opacity=".4"/>
<text class="d" x="16" y="214" font-size="9.5">The score leaves the outer boundary, so it describes the outer box. It gets filed</text>
<text class="d" x="16" y="226" font-size="9.5">under the name of the inner one, because the inner one is the thing with a price.</text>
</svg>
</div>
<figcaption>Figure 1. The confound, drawn. Nothing here is subtle. The measurement boundary
and the attribution boundary are different boxes, and everybody knows it, and the charts
are published anyway.</figcaption>
</figure>

## 3. Three measurements

**Sydney Lewis froze the weights.** The study runs 169 tasks at a 20,480 token context cap
with a fixed 480 second endpoint, and changes exactly one thing: how the harness manages
context. The control feeds the full conversation in time order. The treatment mechanically
shortens older tool results as the window fills and reacts when work repeats or stalls.
Mean per-task fail-to-pass went from **28 percent to 49**, and complete solutions from
**43 to 72**. The same frozen treatment lifted three more models of different design without
any per-model tuning. The paper's own conclusion is the sentence I would put on the wall:
evaluations "should treat the model and harness together as the tested solver."

Note what the treatment was. Trimming stale tool output and noticing a loop. That is a
Tuesday afternoon of ordinary engineering, and it was worth twenty-one points.

**NVIDIA published a perfect score and its own caveat.** Claude Opus 5 inside NVIDIA's AVO
system completed the 25 environment public set of ARC-AGI-3, all 183 levels, at 100.00 RHAE
in 6,624 environment actions. ARC Prize separately reports Opus 5 at about 30 percent on the
public benchmark at high reasoning effort. NVIDIA says plainly that the two numbers came
from different evaluation frameworks and are not a direct comparison, which is the honest
thing to say and is also the entire point: when a harness can move a result that far, no two
numbers from different harnesses are comparable, including the ones on the chart you are
using to pick a vendor. The semi-private and private competition sets were not part of the
run.

**A scaffold that helped and hurt in the same study.** The ledger-based manager and worker
work runs on the 100 latest hard LiveCodeBench problems at a 128k cap. Qwen3.8-27B went from
63.0 percent single-call to **86.4** under the manager, a gain of 23.4. GPT-5.6-Terra went
77.0 to 85.0, which brought it within noise of Claude Fable 5's single-call 87.4 at about a
fifth of the cost, $11.71 against $61.11. And Qwen3.6-35B lost ground, between one and nine
points, with reasoning off. The manager roughly triples the token bill.

<div class="mtr">
<div class="r"><span class="k">Same weights, harness A</span><span class="b"><i style="width:28%"></i></span><span class="v">28%</span></div>
<div class="r"><span class="k">Same weights, harness B</span><span class="b"><i style="width:49%"></i></span><span class="v">49%</span></div>
<div class="r"><span class="k">Opus 5, reported baseline</span><span class="b"><i style="width:30%"></i></span><span class="v">~30%</span></div>
<div class="r"><span class="k">Opus 5, AVO, public set</span><span class="b"><i class="f" style="width:100%"></i></span><span class="v">100%</span></div>
<div class="r"><span class="k">Qwen3.8-27B, single call</span><span class="b"><i style="width:63%"></i></span><span class="v">63.0%</span></div>
<div class="r"><span class="k">Qwen3.8-27B, manager</span><span class="b"><i style="width:86%"></i></span><span class="v">86.4%</span></div>
</div>

<p class="dim">Figure 2. Six numbers from three different studies on three different task
sets. They are not comparable to each other and that is deliberate, because the point is
the size of the movement within each pair, where the weights did not change.</p>

## 4. It is not a free lever

The tempting reading is that harness work is cheap upside. Two of the three studies say
otherwise.

The manager scaffold triples the token bill, so a 23 point gain arrives attached to a
roughly threefold cost increase, and whether that trade is good depends on numbers only you
have. Paper 5.17 is the arithmetic for that.

The same scaffold cost Qwen3.6-35B up to nine points. A harness is tuned, explicitly or
accidentally, against some set of models, and a model that plans well internally can be
actively harmed by a wrapper that plans for it. So a harness behaves like a component that has to be
matched to a particular model, which is the opposite of how it gets adopted. Teams pick one
and expect it to lift whatever they point it at.

And Lewis found the gap largely closes at a wide context window. The 21 point swing was
measured at 20,480 tokens, where trimming matters enormously. Give the same setup room and
the arms converge. Harness effects are largest exactly where you are constrained, which is
where most production systems live and where almost no benchmark runs.

## 5. Why nobody fixes this

The confound survives because everybody publishing has a reason to leave it in.

<table class="rt">
<thead><tr><th style="width:150px">Who publishes</th><th>What they hold fixed</th><th style="width:210px">What the reader takes away</th></tr></thead>
<tbody>
<tr><td class="hd" data-l="Who">A model vendor</td><td data-l="Fixed">Their own harness, usually unspecified, often tuned against their own model</td><td data-l="Takeaway">"Their model is better"</td></tr>
<tr><td class="hd" data-l="Who">A harness or framework author</td><td data-l="Fixed">One model, chosen because it responds well to their scaffolding</td><td data-l="Takeaway">"Their framework is better"</td></tr>
<tr><td class="hd" data-l="Who">A benchmark maintainer</td><td data-l="Fixed">The task set, while submitters vary everything else</td><td data-l="Takeaway">"The leaderboard ranks models"</td></tr>
<tr><td class="hd" data-l="Who">You</td><td data-l="Fixed">Nothing, because you compared two published numbers from two different setups</td><td data-l="Takeaway">A procurement decision</td></tr>
</tbody>
</table>

Nobody in that table is lying. Each is answering the question they were asked, and the
composition of four honest answers is a misleading one.

## 6. What to do about it on a Tuesday

The remedy is the same shape as the one in 5.17 and it costs about the same.

**Run both candidates inside your own harness.** Twenty or thirty tasks from your own logs,
your context policy, your tools, your timeouts. This is the only comparison that answers the
question you are actually asking, which is not "which model is better" but "which model is
better inside the thing I have already built".

**Write down your harness once.** Context policy, tool list, truncation rule, stall
handling, stop conditions. One page. Then when a result surprises you, you have something to
diff against. Most teams cannot answer "what do you do when a tool result is 400 lines"
without reading the code, which is a strange thing not to know about a system you are
buying models for.

**Change one half at a time.** Swapping the model and the framework in the same sprint
produces a number you cannot attribute, which is exactly the error the whole paper is about,
committed at home instead of in a press release.

**Look at the harness before the model when results are bad.** It is cheaper to change, you
own it, and on the evidence above it has comparable leverage. The Qwen chat template work is
the cleanest example of this shape: a shipped template produced an eighty percent plus
premature turn abort rate, and flattening it fixed the behaviour. The weights were never the
problem, and anybody debugging that by swapping models would have burned a week.

## 7. The strongest objection, unanswered

If harness effects are this large, then a benchmark that holds the harness fixed is not
measuring anything you care about either, because it is measuring model-inside-that-harness
and you will not use that harness. Standardising the scaffold makes the comparison internally
valid and externally useless.

I do not have a good answer. The best I can offer is that a fixed, published harness at
least lets you read the result correctly, and that the honest output of an agent benchmark
may be a range across several scaffolds rather than a number. That is more work for the
people running benchmarks and less satisfying for the people reading them, which is probably
why it does not happen.

This objection is the reason the confidence value sits at 0.85 rather than higher.

## 8. What this paper does not claim

It does not claim models are interchangeable. Opus 5 at 91 percent in one pass in the ledger
study is doing something the smaller models are not, and the gap between model generations is
real.

It does not claim harness work always pays. It cost one model nine points and tripled a bill.

And it does not claim the vendors are behaving badly. NVIDIA published the caveat next to the
headline. Lewis published the wide-window result that weakens the finding. The failure is at
the point where four honest publications get read side by side by somebody making a decision,
and that person is usually you.
