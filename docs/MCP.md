# Content MCP server

A plan for editing the site's content from an MCP client instead of a text editor.

Single user, single writer, no multi-tenancy, no auth server, no queue, no admin UI. The
whole point is to remove steps, and a plan that adds infrastructure to a site whose
architecture is "files on a CDN" would be Principle 4.5 in miniature: friction relocated
rather than removed.

Status: **not started.** This is a design, not a build. Tasks are at the end.

- [1. What it is for](#1-what-it-is-for)
- [2. The one design decision](#2-the-one-design-decision)
- [3. Shape](#3-shape)
- [4. Tools](#4-tools)
- [5. The editorial rules it must not let you break](#5-the-editorial-rules-it-must-not-let-you-break)
- [6. Deploy path](#6-deploy-path)
- [7. Auth and secrets](#7-auth-and-secrets)
- [8. Failure modes](#8-failure-modes)
- [9. What is deliberately absent](#9-what-is-deliberately-absent)
- [10. Tasks](#10-tasks)

---

## 1. What it is for

Today, publishing a paper means: write Markdown with correct front matter, remember that
`retires` is mandatory, remember that changing a confidence value needs an errata entry,
commit, push, wait for CI, check the deploy. That is fine at a desk and useless from a
phone, and it is six chances to forget the errata rule.

The MCP server collapses that to a conversation:

> Draft a paper at 5.15 called "The Dashboard Nobody Opens", confidence 0.7, holding.
> Retirement conditions: ...

and later:

> Drop 5.3 to 0.55, an objection landed about private mailing lists. Credit K. Osei.

The second one is the interesting case. It is a change to a published claim, so it must
produce an errata entry, and the server should refuse to make the change without one.

## 2. The one design decision

**The server writes to git. It does not write to the site.**

Everything else follows. The site stays a static build from a repository, the history
stays in the commit log, the schema stays enforced by the same build that CI runs, and a
bad edit is reverted with `git revert` rather than with a database migration.

The alternative, a server that writes content into a database the site reads at request
time, would mean the reading path grows a dependency, the schema moves out of
`src/content/config.ts`, and "the backup is the clone" from BUILD.md section 7 stops
being true. Not worth it to save one commit.

So: **MCP server → GitHub API → push to main → existing Actions pipeline → Cloudflare
Pages.** The deploy path is the one that already exists and is already validated. The
server adds no new way for the site to go down.

## 3. Shape

One TypeScript process, stdio transport, run locally by the MCP client. No hosting, no
public endpoint, no inbound network surface at all.

```
Claude / any MCP client
        |  stdio
        v
  content-mcp  (node, ~400 lines)
        |
        +-- reads   a local clone of mosimran/imran-site
        +-- validates against src/content/config.ts (the same Zod schema)
        +-- writes  Markdown files, commits, pushes
        |
        v
  GitHub -> Actions (check, then deploy) -> Cloudflare Pages
```

Why a local clone rather than the GitHub Contents API: the schema check needs the whole
collection in hand (to compute the next section number, to diff a confidence value
against what is published, to know whether a slug is taken). A clone gives that for free
and makes a dry run genuinely dry.

Repo layout: `services/content-mcp/`, its own `package.json`, not part of the site build.

## 4. Tools

Nine, deliberately. Each maps to something you would otherwise do by hand.

| Tool | Does | Notes |
| --- | --- | --- |
| `list_papers` | Every paper with section, state, confidence, revised, expiry | The read that makes the others usable |
| `get_paper` | One paper, front matter plus body | |
| `draft_paper` | Create a new paper | Defaults to `state: unwritten` unless `retires` is supplied |
| `revise_paper` | Edit body or front matter | Refuses a confidence or state change without `erratum`, see section 5 |
| `retract_paper` | Set `retracted`, require a retraction block | Always writes an erratum |
| `add_erratum` | Create a Section 7 entry | Takes `creditedTo` |
| `list_impl` / `get_impl` / `revise_impl` | Same three for implementation notes | Refuses to save a note with no named failure mode |
| `preview` | Build locally, return the rendered page and the budget report | Never touches the remote |
| `publish` | Commit and push, return the run URL | Optional `dryRun` |

`publish` is separate from the write tools on purpose. Writing is cheap and reversible;
pushing starts a deploy. Two steps means a conversation can draft, look, and change its
mind without anything leaving the machine.

## 5. The editorial rules it must not let you break

This is most of the value. The server is not a file writer with a chat interface, it is
the editorial policy made conversational, and the rules are the same ones CI enforces.

1. **A paper with a body must carry retirement conditions.** `draft_paper` with prose and
   no `retires` fails with the reason, not a warning.
2. **Changing a published `confidence` or `state` requires an erratum.** `revise_paper`
   refuses without one and tells you exactly what changed. This is the `check-errata.mjs`
   rule from BUILD.md section 3, moved to the point of authorship where it is cheaper to
   obey.
3. **A retraction keeps the text.** `retract_paper` never deletes a body. Section 2.2 says
   nothing here is deleted.
4. **An implementation note needs a named failure mode.** `revise_impl` refuses to move a
   note to `production` without at least one entry in `failures`.
5. **Confidence is a number you have to type.** No default, no inherit, no "same as last
   time". If a claim's confidence is not worth stating, the claim is not worth publishing.
6. **The identifier and expiry are computed, never accepted as input.** The suffix is
   `history.length - 1`. A tool that let you set it would let the record lie.

Every refusal returns the rule and the file it comes from, so the answer is never just
"no".

## 6. Deploy path

Nothing new. `publish` pushes to `main`, and from there:

```
push -> Actions: check (build, astro check, budgets) -> deploy (wrangler pages deploy)
```

`publish` returns the Actions run URL and, once `CLOUDFLARE_API_TOKEN` is in secrets, the
deployment URL. If the check fails the deploy does not run, which was proven at T04 rather
than assumed.

**The server does not deploy.** It has no Cloudflare credential and no wrangler dependency.
One deploy path, already tested, already gated.

## 7. Auth and secrets

Single user, so there is no auth model beyond the machine you are sitting at.

- **GitHub**: a fine-grained PAT with `Contents: read and write` on this one repository,
  in the MCP client's env, never in the repo. `Pull requests: write` too if the PR loop is
  wanted; direct-to-main is the simpler default for one writer.
- **No Cloudflare credential.** See above.
- **No inbound port.** stdio only, so there is nothing to attack from the network.

The threat model is honestly small: the server can commit to one public repository that
already contains everything it can write. The worst case is a bad commit, and the fix for
a bad commit is `git revert`.

## 8. Failure modes

Naming them, per Principle 4.8.

| Failure | Blast radius | Handling |
| --- | --- | --- |
| Clone drifts behind the remote | Edits conflict on push | `pull --ff-only` before every write; refuse and report if it fails |
| Two clients write at once | Lost edit | Out of scope by construction, single user. A push rejection is the backstop |
| A tool writes valid front matter that fails the build | Red CI, no deploy | `preview` runs the real build; `publish` can be told to run it first |
| The model invents a metric or a correction | **Published falsehood** | The worst one. See below |
| PAT leaks | Commits to one public repo | Revoke, rotate. Happened twice already this project |

The fourth is the one that matters, because it is the failure this whole site is against.
Mitigation is structural rather than hopeful: `add_erratum` requires `creditedTo` to be
supplied explicitly and never infers it; numeric fields have no defaults; and the tool
descriptions state that unknown values are left blank rather than estimated. The residual
risk is real and is why `publish` is a separate, deliberate step.

## 9. What is deliberately absent

No web UI. No scheduling. No draft workflow with states beyond the ones the schema
already has. No image upload. No analytics. No multi-user anything. No hosted deployment
of the server itself.

Each of those is a reasonable feature for a CMS. This is not a CMS; it is a way to avoid
opening an editor to change one number, and every feature that would make it a CMS is a
feature that puts something between the author and a git commit.

## 10. Tasks

Slots in after the site's own build. Numbered separately so the main sequence stays
readable.

| # | Task | Validated by |
| --- | --- | --- |
| M01 | Scaffold `services/content-mcp`, stdio server, no tools | Client lists the server, zero tools |
| M02 | Repo adapter: clone, `pull --ff-only`, read collections | `list_papers` returns all 14 with correct expiry |
| M03 | Schema bridge, reusing `src/content/config.ts` | Invalid front matter is rejected with the schema's own message |
| M04 | Read tools: `list_papers`, `get_paper`, `list_impl`, `get_impl` | Round-trip a paper unchanged |
| M05 | `draft_paper`, `revise_impl` | A paper with a body and no `retires` is refused |
| M06 | `revise_paper` with the errata rule | A confidence change without an erratum is refused, with the diff |
| M07 | `retract_paper`, `add_erratum` | Retraction keeps the body; erratum requires `creditedTo` |
| M08 | `preview`: local build plus budget report | Catches a deliberate over-budget page |
| M09 | `publish`: commit, push, return the run URL | Dry run pushes nothing; real run turns CI green |
| M10 | Failure-mode pass | Every row in section 8 reproduced deliberately |
