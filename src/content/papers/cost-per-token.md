---
section: "5.17"
title: "Cost Per Token Is Not Cost"
summary: "The price on the pricing page is the smallest term in the real cost function, and the only one anybody measures. Model choice is made against a denominator supplied by marketing."
slug: "cost-per-token"
published: 2026-08-31
revised: 2026-08-31
state: holding
confidence: 0.80
retires:
  - "A published comparison across several production workloads showing that ranking models by per-token price predicts their ranking by cost per accepted output. If the cheap proxy tracks the real quantity, the argument for measuring is an argument for wasted effort."
  - "A vendor publishing per-version behavioural diffs specific enough that a team could predict the effect of an upgrade on their own workload without running it. That would make re-evaluation redundant rather than negligent."
  - "Longitudinal evidence that teams selecting models by leaderboard reach the same production outcomes as teams selecting by task-specific eval, once the cost of building the eval is charged against them."
  - "A demonstration that small evals systematically mislead: that a 40-case suite drawn from production traffic picks the wrong model more often than a leaderboard does. The claim here is that a cheap measurement beats a free proxy, and that is a falsifiable comparison."
history:
  - { date: 2026-08-31, note: "Published.", confidenceAfter: 0.80 }
seeAlso: ["5.4", "5.1", "5.8"]
---

<div class="memo"><b>Abstract.</b> Almost everybody picks a model by looking at two numbers,
the price per million tokens and a position on a leaderboard, and neither of those numbers
is about your system. The price is the smallest term in what a model actually costs you,
and the leaderboard is measuring a different workload than the one you run. The fix is about
forty examples pulled out of your own logs, a rubric written on a Tuesday, and the
discipline to run the thing again after somebody ships a new version, rather than an
evaluation platform or a quarter of work. <b>Confidence 0.80.</b> The arithmetic in Section 2 is solid
and the failure mode in Section 6 is one I have watched. The gap from 0.90 is Section 9,
where I have no good answer to what happens when the evaluation itself goes stale.</div>

## 1. The claim

Somebody posts a thread where a model does something genuinely clever, you read it on a
Thursday, and about six weeks later that model is in your architecture diagram without
anybody having run a single test against your own traffic. The decision felt technical. It
was made from a demo you did not design, on examples you did not choose, by someone who was
pleased with the results.

This is not an argument that expensive models are a swindle, or that the cheap one is
secretly good enough. Either can be true on any given day and neither is knowable from a
pricing page. The argument is that the industry has settled on a way of comparing models
that is easy to obtain and wrong, and that the correct comparison takes an afternoon to
build and then works forever.

The whole paper is one substitution. Stop dividing by tokens and start dividing by outputs
that a human being was willing to accept.

## 2. The number on the pricing page is the small one

What governs your bill is the cost of a piece of finished, usable work rather than the
cost of a token, and that has four terms in it:

```
cost per accepted output =  (tokens in x price in  +  tokens out x price out)
                            x  attempts before it parses
                            /  fraction a human accepts as-is
                            +  cost of a person fixing the rest
```

Only the first term is published. The other three are properties of the marriage between
one model and your particular workload, and no vendor can tell you what they are because
no vendor has seen your workload.

So let us do it properly with two models. Everything in the table below is an input I am
stating rather than a measurement I am claiming, so you can put your own figures in and
watch what happens.

<table class="rt">
<thead><tr><th style="width:230px">What you are comparing</th><th style="width:1%">Model A</th><th style="width:1%">Model B</th></tr></thead>
<tbody>
<tr><td class="hd" data-l="Item">Input, per million tokens</td><td class="num" data-l="A">$3.00</td><td class="num" data-l="B">$0.80</td></tr>
<tr><td class="hd" data-l="Item">Output, per million tokens</td><td class="num" data-l="A">$15.00</td><td class="num" data-l="B">$4.00</td></tr>
<tr><td class="hd" data-l="Item">Output tokens it actually emits</td><td class="num" data-l="A">600</td><td class="num" data-l="B">1,020</td></tr>
<tr><td class="hd" data-l="Item">Tool calls that come back malformed</td><td class="num" data-l="A">1.5%</td><td class="num" data-l="B">8%</td></tr>
<tr><td class="hd" data-l="Item">Output a human accepts untouched</td><td class="num" data-l="A">96%</td><td class="num" data-l="B">82%</td></tr>
</tbody>
</table>

The task uses four thousand input tokens. On the pricing page B is three and three quarter
times cheaper, which is the sort of gap that ends an argument before it starts.

Work it through and B is more verbose, which eats some of the lead, and B fumbles the tool
schema more often, which means retries, which eats a bit more. After both of those A costs
$0.02132 per completion and B costs $0.00791. B is still cheaper by a factor of 2.69, and
if you stop here you buy B and you are wrong, because nothing so far has accounted for a
person.

Now put the person in. The interesting question is not what review costs, it is how cheap
review would have to be before B wins, and that has an answer:

```
break-even review cost = (0.02132 - 0.00791) / (0.18 - 0.04) = $0.0958
```

At a loaded rate of sixty dollars an hour, nine and a half cents buys you **under six seconds**
of somebody's attention. At ninety an hour it buys under four.

So if any human being ever looks at the output of this system for longer than about six
seconds, the cheap model is the expensive one, and every published number you used to
choose it was pointing the other way. At a realistic four-minute review, A comes out at
$0.18 per accepted output and B at $0.73. The model that was 3.75 times cheaper is now four
times dearer. The whole inversion came out of a column nobody had put in the spreadsheet.

<figure>
<pre>
  what you compared                    what you were billed for
  -----------------                    ------------------------
  price per token             ------>  price per token
                                       retries on malformed output
                                       the extra tokens it rambled
                                       the reviewer's afternoon
                                       the customer who left quietly
       |                                        |
       v                                        v
  published by the vendor              measurable only by you

  share of the bill that is tokens, on the numbers above:
      model A   11.8%
      model B    1.1%
</pre>
<figcaption>Figure 1: the cheaper the model, the smaller the fraction of your bill it is
responsible for, which is the opposite of the intuition that makes people choose it. On
these inputs, ninety-nine cents of every dollar model B costs you is spent somewhere no
pricing page has ever mentioned.</figcaption>
</figure>

## 3. Why the published numbers point the wrong way

None of this needs anybody to be dishonest. Every number published is a real number. They
are simply answers to questions you did not ask, and they fail in a consistent direction.

**A leaderboard is an average over somebody else's work.** A model that does well across a
broad aggregate has been tuned for a distribution you do not have, and your agent does one
narrow thing all day. Aggregate rank does correlate with performance on your task. It correlates far more weakly
than the confidence with which people quote it in planning meetings.

**Preference rankings are partly a length contest.** When the ranking comes from humans
picking a winner between two answers, the winner tends to be the longer one, the better
formatted one and the one that sounds more sure of itself. Those three qualities correlate
strongly with your bill, because they are output tokens, and much more loosely with being
correct. You are reading a chart where "wordier" and "better" have been quietly added
together, and then you are paying by the word.

**The scores are not comparable across years.** Public benchmarks leak into training data,
so a rising score is some mixture of the model getting better and the model having seen the
test, in a ratio nobody can give you. You know the direction of the bias. You do not know
how big it is, which makes the year-on-year improvement a number you can read but cannot
use.

**"Better at coding" is a claim about a mean.** Somebody moved an average across a suite the vendor chose. Your workload is one point in
that average. It was probably not in the suite at all, and it may have moved the other way. The release note cannot warn you about that because the people
writing it genuinely do not know.

## 4. The five ways an engineer talks himself into it

The published numbers would do less damage if we held them loosely, and we do not.

**The demo you saw once.** Three examples, none of them yours, all of them chosen by
somebody who liked how they turned out, and the impression hardens into a standing belief
about what the model can do. This is the same machinery as watching somebody refactor a
module on video and coming away feeling you have refactored something, which is paper 5.1
in its entirety.

**Newer must be better.** Newer is different, which is a smaller claim and a much more
useful one. Point releases change refusal behaviour, verbosity, tool-call formatting and the shape of
the latency tail. Those four things are precisely what your agent is wired into.

**Headroom nobody has measured.** You take the frontier model as insurance against
difficulty you have never quantified, which feels responsible and is a standing charge on
every request you will ever make for a capability you may never call on. It is buying a van
because twice a year you move a sofa. Sometimes correct, worth actually checking.

**You remember the good ones.** Failures get retried by hand, muttered at, and forgotten. That is exactly how an acceptance
rate falls for a month with nobody able to say when it started.

**The vendor's own evaluation suite.** It is a real contribution and a marketing document
at the same time, and no organisation has ever published the benchmark on which its product
looks worst.

Every one of these swaps a cheap signal for a measurement and then holds the answer with
the confidence you would be entitled to only if you had measured. That is the untested part,
in the strict sense that no experiment was run which could have come out the other way.

## 5. The thing you are really buying is a moving target

Here is the part that matters more than the choice and gets a fraction of the attention.

The endpoint you are calling is somebody else's running service rather than a file you
vendored, and it changes underneath you, sometimes with an announcement and sometimes not.
Your agent is built against behaviour rather than an interface, and that is a
much softer thing to be standing on. When an interface changes you get an exception and a
stack trace. When behaviour changes you get nothing at all, and the system quietly gets
worse while every dashboard stays green.

**The tool call drifts.** A field that was always there becomes occasionally absent, your
parser catches it, the retry succeeds, and nobody is paged because from the outside nothing
failed. Cost and latency creep up by a few percent a week.

**The answers get longer.** Context fills faster, long conversations start truncating their
own history, and the quality falls off in a way that looks exactly like users asking harder
questions this month.

**It starts declining things it used to do.** Some category of request now gets a polite
refusal. Those users do not open tickets. They go away, and you find out from a churn
report in the following quarter.

**The tail moves and the middle does not.** The p50 is untouched, so the dashboard stays
serene. Meanwhile p99 crosses a client timeout and turns into a retry. That is double
billing, and if you were careless about idempotency it is also a duplicate side effect in
somebody else's system.

Every one of those is a quality drop with no alarm attached, which is the exact thing
Principle 4.1 exists to forbid. An error gets a ticket and a person. This gets absorbed by
your users until they stop being your users.

Which means the evaluation is not really a tool for choosing. Choosing happens once. The
ground moves continuously, and a suite you can re-run in five minutes is the only thing
standing between a silent regression and a very confusing week six weeks later.

## 6. Forty examples and a rubric

This is the discipline, and it is deliberately small, because an evaluation programme that
needs a quarter to stand up is an evaluation programme that will not exist.

<table class="rt">
<thead><tr><th style="width:44px">§</th><th>Do this</th></tr></thead>
<tbody>
<tr><td class="n" data-l="Step">6.1</td><td data-l="Do">Write it before you choose, not after. Written afterwards, it fills up with the cases your chosen model already handles, and you have produced a certificate rather than an instrument.</td></tr>
<tr><td class="n" data-l="Step">6.2</td><td data-l="Do">Take thirty to fifty cases out of real traffic. Not synthetic, not a public benchmark. Sample your logs, and cover the common path, the strange tail and the inputs that are malformed or hostile. If you keep an incident log, every incident in it is a case you already paid for, and those are the most valuable examples you own.</td></tr>
<tr><td class="n" data-l="Step">6.3</td><td data-l="Do">Grade on consequences. "Is this good" will not survive two reviewers disagreeing. "Did it call the right tool with the right arguments", "did it refuse when it should have", "would somebody have to fix this before a customer saw it" are answerable by two people who reach the same answer. Write the rubric before you look at any output.</td></tr>
<tr><td class="n" data-l="Step">6.4</td><td data-l="Do">Record five things, not one. Pass rate, cost per accepted output with all four terms from Section 2, malformed-output rate, refusal rate, and latency at p95 and p99 kept apart, because the tail is where the timeouts live.</td></tr>
<tr><td class="n" data-l="Step">6.5</td><td data-l="Do">Run it against what you are already using, first. This step gets skipped and it is the one that proves the instrument works. Break something deliberately: truncate the system prompt, swap in last quarter's version, take away a tool. If the score does not move, you have built a decoration and it will not notice a regression either.</td></tr>
<tr><td class="n" data-l="Step">6.6</td><td data-l="Do">Only now run the candidates. The decision usually takes about ten minutes at this point, which feels like the work was wasted and is in fact the work paying out.</td></tr>
<tr><td class="n" data-l="Step">6.7</td><td data-l="Do">Pin the version, then re-run on a schedule anyway. Pinning stops the vendor moving under you. It does nothing about your own prompt, tool schema or retrieval corpus moving under the same model, and one of those changes most weeks.</td></tr>
<tr><td class="n" data-l="Step">6.8</td><td data-l="Do">Keep the results with dates on them. One run is a number and tells you very little. A year of runs is a control chart, and a control chart answers the only question you ever actually ask, which is whether this month is different from last.</td></tr>
</tbody>
</table>

## 7. What it costs

Forty examples, a rubric with four or five yes-or-no questions, and a script that runs the
examples and writes one row per run into a file.

The harness is an afternoon and you write it once. Each run costs minutes and a rounding
error in tokens, against the cost of the engineer who would otherwise spend that afternoon
in a meeting about which model feels better.

The genuinely expensive part is the examples, except that you do not write examples. You
harvest them, out of traffic you already serve and incidents you already survived and
mostly wrote up. The work is already done. It is sitting in your logs being useless.

## 8. The named failure mode

**The upgrade nobody ran anything against.** A new version ships, it is better on every
published measure, somebody bumps the string in the config on a Thursday afternoon, and the
diff is one line so it gets approved in about ninety seconds. For three weeks everything is
fine, because it mostly is fine. The malformed tool calls go from one in seventy to one in
twelve, which your retry logic absorbs. The answers get about forty percent longer, which
nobody notices because nobody watches token counts on a Tuesday. Then a long conversation
starts truncating its own context, and the agent begins confidently answering questions
using the half of the thread it can still see.

The support tickets never say "the model regressed". They say the assistant has been odd
this week. Somebody opens the prompt and starts adjusting it, because the prompt is
the thing we know how to change, and now you are tuning a prompt against a moving baseline
with no measurement on either side of it. That is where the week goes, and the week after.

A five-minute evaluation run before the config change would have shown a malformed-output
rate going from 1.4% to 8.3% and stopped the whole thing on the Thursday. The reason it did
not run is that nobody had built it rather than that anybody decided against it, and it was
only ever an afternoon.

## 9. The strongest objection, unanswered

**A bad evaluation is worse than none, and most first attempts are bad.**

Forty cases and a loose rubric still produce a number, and a number invites exactly the
confidence this paper spends eight sections arguing you should not have. Suppose the cases are unrepresentative, or the rubric measures something next door to what
you care about. You have swapped an uncertainty you knew about for a certainty you have not
earned. That trade is the more expensive one, because it stops you looking.

Then Goodhart arrives, on schedule. The moment the score is a target, prompts get tuned
until the score moves, and the score stops standing in for the thing you wanted. Your
instrument decays into precisely the sort of proxy this paper opens by complaining about,
and it decays invisibly, from the inside, while the chart continues going up.

There is a narrower objection with more force behind it. For a large class of ordinary
tasks the frontier model is simply better on every axis, the ranking is stable for months,
and an experienced person would have picked correctly in thirty seconds without any of
this. In those cases the evaluation confirms what was already known and the afternoon was
pure overhead. The argument survives only because the same harness is what catches the
silent upgrade in Section 8, and that is a claim about something that has not happened yet,
which anybody is entitled to discount.

I do not have a clean answer to the decay problem. The partial one is to hold back a set of
cases that are never used for tuning and never even looked at, and to rotate fresh traffic
in on a schedule, which slows the rot without stopping it. Until I can say something better
than that, this sits at 0.80 rather than higher, and Section 6 should be read as the least
you can get away with rather than as sufficient practice.
