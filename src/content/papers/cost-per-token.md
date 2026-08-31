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

## 1. The claim

**Model selection is an arithmetic problem that is almost always solved with a
brand preference.**

Two numbers drive the decision in most teams. The first is price per million
tokens, which appears on a pricing page. The second is a position on a
leaderboard, which appears in a blog post. Both are real numbers. Neither is a
measurement of your system.

The argument here is not that expensive models are a swindle, nor that the cheap
one is secretly fine. Either can be true. The argument is that the industry has
standardised on a denominator that is easy to obtain and wrong, and that the
correct denominator costs about a day to build and is then reusable forever.

Everything below follows from one substitution: stop dividing by tokens and
start dividing by **accepted outputs**.

## 2. The denominator

The quantity that governs a production system is cost per unit of work that
survives review. Write it out:

```
cost_per_accepted =  (tokens_in x price_in  +  tokens_out x price_out)
                     x  attempts_per_completion
                     /  acceptance_rate
                     +  (1 - acceptance_rate) x cost_of_human_review
```

Four terms. Only the first is on the pricing page. The other three are
properties of the pairing between a model and your workload, and they are not
knowable from any published source.

Consider two models. The numbers below are stated inputs, not measurements, so
that the arithmetic can be checked and your own figures substituted.

| | Model A | Model B |
| --- | --- | --- |
| Input, per million tokens | $3.00 | $0.80 |
| Output, per million tokens | $15.00 | $4.00 |
| Output tokens on this task | 600 | 1,020 |
| Tool-call schema violations | 1.5% | 8% |
| Output accepted without review | 96% | 82% |

Task takes 4,000 input tokens. On price alone, B looks 3.75 times cheaper.

Per attempt, A costs $0.0210 and B costs $0.0073. B is more verbose, which eats
into its advantage, but not much. Add retries for malformed tool calls and A
costs $0.02132, B costs $0.00791.

**B is 2.69 times cheaper, and the conclusion is still wrong**, because no term
so far accounts for a person.

Add review. The break-even is the review cost at which the two models cost the
same:

```
review_breakeven  =  (token_cost_A - token_cost_B) / (review_rate_B - review_rate_A)
                  =  (0.02132 - 0.00791) / (0.18 - 0.04)
                  =  $0.0958 per review
```

At a loaded rate of $60 an hour, $0.0958 buys **5.7 seconds** of a person's
attention. At $90 an hour it buys 3.8 seconds.

That is the whole paper in one number. If a human ever looks at the output of
this system for longer than about six seconds, the cheaper model is the more
expensive one, and the pricing page had no way of telling you.

At a realistic four-minute review, A costs $0.181 per accepted output and B
costs $0.728. The model that was 3.75 times cheaper on the pricing page is four
times more expensive in production. Nothing exotic produced that inversion. It
came from one term that nobody puts in the spreadsheet because nobody measures
it.

## 3. Where the hype gets in

The proxies are not neutral. They fail in a direction.

**Leaderboards measure general capability on public sets. Your task is neither
general nor public.** A model tuned to do well across a broad aggregate is
optimised for a distribution you do not have. The correlation between aggregate
rank and performance on one narrow task is positive and much weaker than the
confidence with which it is cited.

**Preference arenas reward style.** When ranking is derived from humans choosing
between two responses, the winner is systematically the one that is longer,
better formatted and more confidently worded. Those three properties correlate
with cost directly, because they are output tokens, and with correctness only
loosely. A leaderboard built on preference is partly a verbosity ranking, and
verbosity is the thing you are paying for.

**Contamination makes scores non-comparable over time.** Public benchmarks leak
into training corpora. A rising score across model generations is a mixture of
genuine capability gain and increasing exposure, in an unknown ratio. The
direction is knowable; the magnitude is not.

**Release notes describe an aggregate you do not share.** "Better at coding" is
a statement about a mean over a set of tasks selected by the vendor. Your agent
does one task. The mean moved. Yours may have moved the other way, and the note
will not tell you, because the vendor does not know either.

None of this requires anybody to be lying. Every number is real. They are
answers to questions you did not ask.

## 4. The bias, named

The proxies would matter less if engineers held them loosely. They do not, and
the reasons are ordinary.

**The demo prior.** A model does something impressive in a thread and the
impression becomes a standing belief about capability. The sample was three
examples, none from your distribution, all selected by someone who was pleased
with them. This is the same failure as watching a refactoring video and feeling
you have refactored, treated at length in paper 5.1.

**Recency as quality.** Newer is assumed better. Newer is different, which is a
weaker and more useful claim. Version changes routinely alter refusal
behaviour, verbosity, tool-call formatting and latency distribution, and those
four things are what an agent is built against.

**Capability insurance.** The frontier model is chosen for headroom nobody has
measured needing. This feels prudent and is a standing charge against every
request for a capability that may never be exercised. Headroom is not free and
should be sized, like any other margin.

**Survivorship in the memory.** You remember the good completions. Failures are
absorbed as one-offs, retried by hand and forgotten, which is precisely how a
degraded acceptance rate stays invisible.

**Anchoring on the vendor's eval.** A published eval suite is a genuine
contribution and a marketing artifact simultaneously. Nobody publishes the
tasks their model handles badly.

The common structure is that all five substitute a cheap signal for a
measurement, and then hold the result with a confidence appropriate to a
measurement. That is the untested part, and it is untested in the strict sense:
no experiment was run that could have come out the other way.

## 5. Why choosing once is the wrong shape

Here is the part that matters more than model choice, and gets a fraction of the
attention.

**A model endpoint is not a stable artifact.** It is a service. It changes,
sometimes announced and sometimes not, and your agent is built against
behaviour rather than against an interface. An interface change breaks loudly. A
behaviour change does not break at all. It degrades.

The characteristic failure of an agent on a model upgrade:

- Tool-call formatting drifts. A field that was reliably present becomes
  occasionally absent. The parser catches it, retries, and the retry succeeds.
  Nothing alerts. Latency and cost rise by a few percent.
- Verbosity increases. Context accumulates faster per turn. Long conversations
  begin hitting the window and truncating their own history. Answers get worse
  in a way that looks like the user asking harder questions.
- Refusal behaviour shifts on edge inputs. A category of request that used to be
  handled starts being declined politely. Those users do not file bugs. They
  leave.
- Latency distribution widens at the tail. The p50 is unchanged, so the
  dashboard looks fine. The p99 crosses a client timeout, which becomes a retry,
  which becomes double billing and a duplicate side effect.

Every one of those is a silent quality drop, and Principle 4.1 exists because a
silent quality drop is worse than an error. An error gets investigated. This
gets absorbed by users until they stop coming.

**So the eval is not primarily a selection tool. It is a detector.** Selection is
a one-time act performed under uncertainty. Detection is continuous and is the
only thing standing between you and a degradation you will otherwise diagnose
six weeks later from a churn report.

## 6. The protocol

This is the discipline. It is deliberately small, because an eval programme that
needs a quarter to build is an eval programme that does not exist.

**6.1. Write the eval before you choose.** Not after. If it is written after,
its cases will be the ones the chosen model already handles, and you will have
built a certificate rather than an instrument.

**6.2. Take 30 to 50 cases from real traffic.** Not synthetic, not from a
benchmark. Sample your actual logs. Stratify: the common path, the long tail,
and the inputs that are malformed or hostile. If you have an incident log, every
incident that reached production is a case, and those are the most valuable ones
you own.

**6.3. Grade against consequence, not quality.** "Is this a good answer" is not
gradeable and will not survive two reviewers. "Did it call the right tool with
the right arguments", "did it decline when it should have declined", "would this
have to be corrected before a customer saw it" are gradeable. Write the rubric
before you see any outputs.

**6.4. Measure five things, not one.** Pass rate against the rubric. Cost per
accepted output, computed with all four terms from section 2. Schema violation
rate. Refusal rate. Latency at p95 and p99, separately, because the tail is
where the timeouts are.

**6.5. Run it against the incumbent first.** This is the step that gets skipped
and it is the one that validates the instrument. If your eval cannot distinguish
your current model from a deliberately worse configuration, it cannot detect a
regression either. Break something on purpose. Truncate the system prompt, drop
the temperature to zero, swap in the previous version. If the score does not
move, the eval is decorative.

**6.6. Only then run candidates.** By this point the decision is usually obvious
and takes ten minutes, which is a good sign rather than a sign the work was
wasted.

**6.7. Re-run on every version change, including the silent ones.** Pin the
model version in configuration so that changes are yours to make. Then run the
eval on a schedule anyway, because pinning protects you from the vendor moving
and not from your own prompt, tool schema or retrieval corpus moving underneath
the same model.

**6.8. Store the results with dates.** A single eval run is a number. A series is
a control chart, and a control chart tells you the thing you actually want to
know, which is whether today is different from last month.

## 7. What this costs

Forty cases. A rubric with four or five binary questions. A script that runs the
cases, records the five measurements, and writes a row to a file.

That is an afternoon for the harness, and the harness is written once. Each run
is minutes and the token cost of forty cases is negligible against the cost of
one afternoon of the engineer who would otherwise be arguing about which model
feels better.

The expensive part is the cases, and the cases are not built. They are
harvested, from traffic you already have and incidents you already survived.

Set against that: one silent degradation, discovered late, costs a debugging
week, an unknown number of users who left without telling you, and a decision
made in the meantime on the assumption that the system was working. The
asymmetry is not close.

## 8. The strongest objection, unanswered

**A bad eval is worse than no eval, and most first evals are bad.**

An eval with 40 cases and a loose rubric gives a number. A number invites
confidence. If the cases are unrepresentative or the rubric measures something
adjacent to what you care about, you have replaced an admitted uncertainty with
a false certainty, and false certainty is more expensive because it stops the
inquiry.

Goodhart's law arrives immediately after. The moment the eval score becomes a
target, prompts get tuned until the score moves, and the score stops measuring
the thing it was proxying for. The eval decays into exactly the kind of proxy
this paper opens by attacking, and the decay is invisible from the inside.

There is a narrower objection with more force. For a large class of tasks the
frontier model genuinely is better on every axis, the ranking is stable, and a
practitioner's guess would have selected correctly in thirty seconds. In those
cases the eval confirms what was already known and its cost was pure overhead.
The argument survives only because the same harness later catches the silent
upgrade, and that is a claim about the future which the eval-sceptic is entitled
to discount.

I do not have a clean answer to the Goodhart problem. The partial one is to hold
out cases that are never used for tuning and never looked at, and to rotate
fresh traffic in on a schedule. That reduces the decay rate rather than stopping
it. Until I can state something stronger, confidence sits at 0.80 rather than
higher, and section 6 should be read as a floor on rigour rather than a
sufficient practice.
