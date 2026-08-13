# Content MCP server

Rev B. Rev A planned a local stdio server. This one is a Cloudflare Worker, revised
against the Builders Lab guidelines, with the parts that exist to solve multi-user
problems left out.

Single user, single writer. No staff table, no domains, no federation.

Status: **not started.** Design only. Tasks at section 10.

- [1. What changed from rev A, and why](#1-what-changed-from-rev-a-and-why)
- [2. Transport](#2-transport)
- [3. Identity](#3-identity)
- [4. Tiers, and the branch that makes them mean something](#4-tiers-and-the-branch-that-makes-them-mean-something)
- [5. Tools](#5-tools)
- [6. Errors](#6-errors)
- [7. Deliberately skipped](#7-deliberately-skipped)
- [8. Failure modes](#8-failure-modes)
- [9. Testing](#9-testing)
- [10. Tasks](#10-tasks)

---

## 1. What changed from rev A, and why

Rev A ran on stdio against a local clone. That is simpler and it is wrong for the actual
use, which is changing a confidence value from a phone. stdio requires the laptop the
clone is on. A Worker does not.

So: **stateless Streamable HTTP Worker, writing to GitHub over the API.**

One thing survives from rev A unchanged, and it is the load-bearing decision:

> **The server writes to git. It does not write to the site.**

The reading path grows no dependency, the schema stays enforced by the same build CI
runs, a bad edit is a `git revert`, and the deploy path is the one already proven at T04.

**Its own Worker, not a Pages Function on the site.** `mcp.mosthofaimran.com`, deployed
separately. BUILD.md section 1 says the gate is "a separate small service... so a failure
there cannot take the document down". The same argument applies twice over to a service
whose whole job is accepting instructions from a language model.

```
Claude Code / claude.ai
        |  POST /mcp   JSON-RPC 2.0   Authorization: Bearer …
        v
  mcp.mosthofaimran.com   (Worker, stateless)
        |
        +-- D1: one token row, an audit table
        +-- GitHub API: read and write src/content/**
        |
        v
  drafts branch  --(publish)-->  main  -->  Actions  -->  Pages
```

---

## 2. Transport

POST-only Streamable HTTP, no session state. A Worker isolate is not a process you can
hold a session in, and a Durable Object for chat transport is a lot of machinery for a
protocol that works request by request.

Four details that are easy to get wrong and cost nothing to get right:

- **Notifications get no response.** A message with no `id` is a notification.
  `notifications/initialized` arrives straight after `initialize` and must produce no
  JSON-RPC reply. Return `202` with an empty body.
- **Batches are real.** If the payload is an array, dispatch each element and return an
  array of the non-null results. All notifications means `202` and no body.
- **Echo the client's protocol version** when it is one you know, otherwise your default.
  Refusing an older version buys nothing.
- **Answer `GET /mcp`.** The transport is POST-only, but clients probe with an
  unauthenticated GET to discover the auth challenge. Give the 401 with its
  `WWW-Authenticate`, then a 405 saying to POST.

---

## 3. Identity

One user, so this is short, but two rules from the guidelines still earn their place.

**The token stores who you are, not what you may do.** Even at one user, the tier cap is
read from the token row on every call and the kill switch is read from config. Revocation
is then immediate and there is nothing to sweep.

**Hash at rest, show the plaintext once.** `sha256(token)` in the row, look up by hash.
The real value is printed at mint and never again.

**Say why a token failed.** "Invalid or revoked" makes an orphaned token undebuggable.
Naming the reason is safe here because you only reach that message by presenting a token
that resolved.

**A kill switch in one place every path passes through.** A single `enabled` flag checked
before dispatch. When something goes wrong at 03:00 the fix should be one row, not a
redeploy.

---

## 4. Tiers, and the branch that makes them mean something

Tier is about **consequence**, not difficulty:

- **T0** reads. Nothing changes.
- **T1** produces a draft nobody would call real.
- **T2** changes a record.
- **T3** is irreversible **OR** visible outside. Either is sufficient.

That OR is where this project got interesting. Every write here ends in a git push, and a
push to `main` deploys to a public site. Applied naively, **every write tool is T3**, the
model stops discriminating, and the tier gate becomes a rubber stamp.

The fix is not to fudge the tiers. It is to make the writes genuinely not outward-facing:

> **Write tools commit to a `drafts` branch. Only `publish` touches `main`.**

Actions deploys on push to `main` only, so a commit to `drafts` changes a record and
reaches nobody. Now the tiers discriminate honestly:

| Tier | Tools | Why |
| --- | --- | --- |
| T0 | `list_papers`, `get_paper`, `list_impl`, `get_impl`, `diff` | Reads |
| T2 | `draft_paper`, `revise_paper`, `revise_impl`, `add_erratum`, `retract_paper` | Commit to `drafts`. Changes a record, reaches nobody |
| T3 | `publish` | Merges `drafts` to `main`. Outward-facing, and a deploy is awkward to unwind |

**Mode is derived from tier, never stored beside it.** Two fields encoding overlapping
truth is how they drift. `mode = tier === 'T0' ? 'read' : 'write'`, conservative on
purpose: a mis-tiered tool then demands a stronger token than it needed, rather than
accepting a weaker one it should have refused. Get the direction of the failure right.

**Default the token to T2.** A fresh connector drafts and revises but cannot publish.
Raising to T3 is deliberate.

---

## 5. Tools

Eleven. One definition each, one object consumed by the dispatcher.

| Tool | Tier | Does |
| --- | --- | --- |
| `list_papers` | T0 | Section, state, confidence, revised, expiry, identifier |
| `get_paper` | T0 | Front matter plus body |
| `list_impl` / `get_impl` | T0 | Same for implementation notes |
| `diff` | T0 | What is on `drafts` and not yet on `main` |
| `draft_paper` | T2 | Create. Defaults to `state: unwritten` unless `retires` is given |
| `revise_paper` | T2 | Edit. Refuses a confidence or state change without an erratum |
| `revise_impl` | T2 | Refuses to move a note to `production` with no named failure |
| `add_erratum` | T2 | Section 7 entry. `creditedTo` must be supplied, never inferred |
| `retract_paper` | T2 | Sets `retracted`, requires a retraction block, never deletes the body |
| `publish` | T3 | Merge `drafts` to `main`, return the Actions run URL |

**Lock every schema with `additionalProperties: false`.** Models invent fields. Better to
refuse loudly than to silently ignore something the model believed it had set.

**Coerce, do not trust.** Small typed helpers that clamp, trim and throw a typed
`McpInputError`. Accept an array or a comma-separated string for lists, because models
produce both. If a helper takes a default, pass it rather than `??`-ing the result, which
produces a dead branch.

**Write descriptions for a model, not a changelog.** Say what the tool does, what it does
not do, and what to use instead. A description that describes a two-call dance will reliably
get the first call and not the second, and the model will report success.

**Handlers go through one content module**, the same one that reads and writes the
collection files, never ad-hoc string surgery on YAML. Two implementations of the front
matter rules means one of them is wrong.

### The editorial rules, which are the actual product

The server is not a file writer with a chat interface. These are the same rules CI
enforces, moved to the point of authorship where obeying them is cheaper.

1. A paper with a body must carry retirement conditions.
2. Changing a published `confidence` or `state` requires an erratum. Refuse, and show the diff.
3. A retraction keeps the text. Nothing here is deleted.
4. An implementation note reaching `production` needs a named failure mode.
5. Confidence has no default. If it is not worth stating, the claim is not worth publishing.
6. The identifier and expiry are computed, never accepted as input. A tool that let you
   set the version would let the record lie.

Every refusal returns the rule and the file it comes from.

---

## 6. Errors

Two kinds, and they are not interchangeable.

| | Vehicle | Who sees it |
| --- | --- | --- |
| Protocol error | JSON-RPC `error` | the client |
| Tool error | `{ content: [...], isError: true }` in a **result** | the model |

Unknown method is a protocol error. Unknown tool, denied tier, bad input, handler threw:
all `isError` results, because the model can read those and correct itself. A JSON-RPC
error usually just ends the turn.

Refusals say what would make it work:

```
'publish' is a T3 action and this token is capped at T2.
Raise the cap on the token if that is intended.
```

For unexpected throws, return something generic. Do not leak a stack trace into a model's
context.

---

## 7. Deliberately skipped

Named, with the reason, so the omissions are decisions rather than gaps.

| Skipped | Why |
| --- | --- |
| **OAuth 2.1, DCR, PKCE** | Exists so a browser client with no header field can sign in. One user with Claude Code mints a bearer token by hand. This is the single biggest chunk of the guidelines and the least applicable. It is the upgrade path if editing from claude.ai in a browser ever matters, and nothing here forecloses it. |
| **The permission gate** | Third of the three gates, and it answers "does this human have this domain". There is one human and no domains. Mode and tier remain; perm would be a constant. |
| **Live staff resolution** | No staff table to resolve against. The equivalent is the kill switch. |
| **Federation** | The server calls no other MCP servers. If that changes, the guidelines' rules apply in full and none of them are optional. |
| **Durable Objects** | Nothing is remembered between calls by design. |
| **Two-transport parity tests** | There is no in-house agent to be at parity with. |
| **Cron triggers** | None needed. Worth knowing the account cap is five, and the CV janitor at T25 will want one of them. |

---

## 8. Failure modes

| Failure | Blast radius | Handling |
| --- | --- | --- |
| `drafts` diverges from `main` | Publish conflicts | Refuse and report; never force |
| Model invents a metric or a correction | **Published falsehood** | The worst one. `creditedTo` must be supplied, numeric fields have no defaults, `publish` is a separate deliberate act |
| Bad edit reaches `main` | Public wrong page | `git revert`, and the errata rule means the change left a trail |
| Token leaks | Commits to one public repo | Kill switch, then rotate. Has happened twice on this project already |
| Rate limiter unavailable | None | **Fail open.** A limiter outage must not take the server down |
| Audit write fails | A missing row | Swallow it. An audit failure that fails the call is worse than a missing row |
| GitHub API down | No writes | Report plainly. The site is unaffected, being static |

**Audit what a call did, not that it happened.** Tool name alone cannot answer "what did
it change", which is the only question worth asking about a T3 call. Record token id,
tool, ok, duration, error, tier, and arguments for anything above T0, capped. Reads are
omitted: they are the bulk of the traffic and their arguments are the query, not the
consequence.

Git is the audit log for anything that lands on `drafts`. The D1 table exists for the
calls that did not land: refusals, throws, and the publish that failed halfway.

---

## 9. Testing

In rough order of value.

1. **A golden snapshot** of every `(name, tier, mode)` triple. This is the thing that
   makes a later refactor safe.
2. **Tier invariants**: no T3 tool is read-mode, a T0 cap admits exactly the read tools.
3. **Round-trips through the real handler**, against an in-memory D1 built from the actual
   migration files. A test database assembled by hand drifts from production; one built
   from migrations cannot.
4. **The editorial rules**, one test each: body without `retires` refused, confidence
   change without erratum refused, retraction preserving the body, identifier computed
   and not settable.
5. **Schema hygiene**: every tool has `additionalProperties: false`, a tier, and a
   description over a minimum length.
6. **Transport conformance**: notification returns 202 with no body, batch returns an
   array, unknown protocol version falls back, `GET /mcp` returns the challenge.

---

## 10. Tasks

| # | Task | Validated by |
| --- | --- | --- |
| M01 | Worker scaffold, `POST /mcp`, `initialize`, `tools/list` empty | Claude Code connects and lists zero tools |
| M02 | Transport conformance: notifications, batches, version echo, GET challenge | The six checks in section 9.6 |
| M03 | D1 schema, token mint, hash at rest, kill switch | A revoked token refuses with a reason |
| M04 | Tier and mode gates, cap on the token | T3 tool with a T2 token refuses and says how to fix it |
| M05 | Content module over the GitHub API, `drafts` branch | Round-trip a paper unchanged |
| M06 | Read tools | `list_papers` returns 14 with correct identifiers and expiry |
| M07 | Write tools with the editorial rules | Each rule in section 5 has a test that proves the refusal |
| M08 | `publish` and `diff` | Publish turns CI green; a conflicting publish refuses |
| M09 | Rate limit failing open, audit table | Limiter outage does not take the server down; a T2 call records its arguments |
| M10 | Golden snapshot and tier invariants | Snapshot committed, invariants green |
| M11 | Failure-mode pass | Every row in section 8 reproduced deliberately |
