# imran-site

The source for [mosthofaimran.com](https://mosthofaimran.com), a personal site
published as an Internet-Draft rather than as a portfolio.

Systems appear with the numbers they produced. Arguments appear with a confidence
value and the conditions under which they would be abandoned. Section 7 records
where the document was wrong.

## What this is

| | |
| --- | --- |
| Document | `draft-imran-systems-and-arguments-03` |
| Canonical host | `mosthofaimran.com` |
| Aliases | `johnefemer.com`, `imran.com.bd` |
| Generator | Astro 5, static output |
| Hosting | Cloudflare Pages |
| JavaScript in the reading path | 0 bytes |
| Third-party requests | 0 |

## Docs

Read these in order. `docs/TASKS.md` is the one you work from day to day.

| File | What it holds |
| --- | --- |
| [docs/PLAN.md](docs/PLAN.md) | Architecture, naming, domains, routes, the gate, SEO, budgets |
| [docs/TASKS.md](docs/TASKS.md) | 31 tasks, each with its validation step |
| [docs/WORKLOG.md](docs/WORKLOG.md) | Append-only journal, one entry per completed task |
| [docs/PLACEHOLDERS.md](docs/PLACEHOLDERS.md) | Content that is still illustrative and needs replacing |
| [docs/MCP.md](docs/MCP.md) | Design for the content MCP server: entry, rules, deploy path |
| [docs/intitial-handoff/](docs/intitial-handoff/) | The original prototype and spec, preserved untouched |

## Working on it

```bash
npm install
npm run dev        # local server
npm run build      # static build into dist/
npm run check      # schema, budgets, links, errata, expiry
npm run worklog    # append a templated entry to docs/WORKLOG.md
```

One task at a time. Branch, build the one thing, run its named validation,
open a PR whose body is the log entry, merge on green, confirm the deploy,
append to the work log, then stop. The loop is written out in
[docs/PLAN.md](docs/PLAN.md) section 11.

## Licence

Prose under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Quote it,
argue with it, carry the confidence value with it.

Code under MIT.
