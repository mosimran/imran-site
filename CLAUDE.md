# CLAUDE.md

Project instructions for `mosimran/imran-site`, the source of mosthofaimran.com.

Read [docs/PLAN.md](docs/PLAN.md) before making architectural decisions and
[docs/TASKS.md](docs/TASKS.md) before starting work. They are the contract.

## The one rule that governs everything

This site's entire argument is that claims should carry their confidence and their
retractions. Anything that quietly changes a published claim, hides a failure, or
presents a number without provenance breaks the thing the site exists to demonstrate.
When a shortcut would produce that outcome, take the longer path and say why.

## Working cadence

One task at a time, from `docs/TASKS.md`, in order. The nine-step loop is in
[PLAN.md section 11](docs/PLAN.md#11-how-each-task-runs). Do not start the next task
before the current one is validated, deployed and logged. Do not batch tasks because
they look small.

Every completed task appends an entry to `docs/WORKLOG.md` with four fields: what
changed, what was validated and how, what is deployed, what is next. Failed
validations get an entry too.

## Hard constraints

These come from `docs/intitial-handoff/BUILD.md` and are enforced in CI. Do not
weaken one to make a task easier; raise it instead.

- **Zero bytes of JavaScript in the reading path.** No framework, no hydration. This
  build emits no script; the only `<script>` it writes is `type="application/ld+json"`.
  Still true and still enforced.
- **Exactly one third-party request, and it is named.** Changed 2026-09-03, erratum
  7.25. Cloudflare Web Analytics injects `static.cloudflareinsights.com/beacon.min.js`
  into every response, the owner chose to keep it, and the CSP now allows that one host
  in `script-src` and `connect-src`. `check-live.mjs` excepts that exact host and
  filename over HTTPS and nothing else: a different script on the same host, a lookalike
  host, another vendor and plain HTTP all still fail, and all five cases are asserted.
  <br>Adding a second one is not a config change. It means correcting sections 8, 10 and
  Appendix B, adding a row to the processor table, and writing the erratum first.
- **No webfonts, no embeds.** System font stacks only.
- **Index HTML under 60 KB, CSS under 12 KB**, one stylesheet, inlined at build.
- **No client-side routing.** Every view is a real page at a real URL.
- **URLs never change.** A paper revised from `-03` to `-04` keeps its path.
- **Nothing is deleted.** Retracted papers stay published, struck through, with the
  reason attached.
- **A paper without `retires` fails the build.** So does a retracted paper with no
  `retraction` block, and a draft claiming confidence above 0.7.

## Naming

The document is an Internet-Draft, not an RFC. Identifier is
`draft-imran-<subject>-<NN>` where `NN` is `history.length - 1` zero-padded, computed
at build in `src/lib/draft.ts`. Full reasoning in
[PLAN.md section 1](docs/PLAN.md#1-document-identifier).

Never paste IETF boilerplate or use "Network Working Group". The form is borrowed;
claiming its provenance would be a lie.

## Domains

`mosthofaimran.com` is canonical. `imran.com.bd` serves identical bytes with the
canonical tag pointing at the primary.

`johnefemer.com` does **not** serve this site. It is registered and still parked on
`lander.parity.domains`, returning a 4.7 KB lander with a third-party script and no
canonical tag. Its nameservers have to move to Cloudflare before any of the aliasing
below applies to it. Verified by request on 2026-09-03; PLAN section 2 has the table. Never add `X-Robots-Tag:
noindex` to the aliases: combined with a cross-domain canonical it can deindex the
primary. See [PLAN.md section 2.1](docs/PLAN.md#21-how-aliasing-works-here).

## Content is illustrative

The figures, errata and fingerprints from the prototype are placeholders and ship
that way by decision. They are tracked in [docs/PLACEHOLDERS.md](docs/PLACEHOLDERS.md).

**Do not invent replacements.** Do not write a paper body, a metric, an errata entry
or an acknowledgement that did not come from the owner. If a document needs content
that does not exist yet, leave it marked as pending and say so.

### Reference design is allowed. Invented measurement is not.

Set by the owner on 2026-09-03, when note 3.2 was rewritten. Implementation notes may
describe the **reference design** for the class of system: the constraints it operates
under, the standard decisions, and the failure modes the category actually has, with the
known answers to each. That is public engineering writing and it is how these should be
written, because the deployed internals are not ours to publish.

Two conditions, both mandatory:

- **The disclaimer goes at the top of the note**, before the first section, saying it is a
  solution path for a system like the one built rather than a disclosure of that system's
  internals, and naming what *is* specific and confirmed.
- **No figure is invented under cover of it.** Describing an architecture is legitimate.
  Attaching a number nobody measured is not, whatever the surrounding prose claims. If the
  measurements are real but unpublishable, say which ones would matter and that they are
  not published. Note 3.2 does this in its section 4.

`npm run impl` reports any front-matter note whose opening words appear verbatim in
`docs/intitial-handoff/`, because the prototype's prose was published as record for a year
and only its figures were ever catalogued. That count must stay at zero.

## Writing style

No em dashes anywhere, in code comments, commit messages, PR bodies, docs or site
prose. Restructure with a comma, a colon, parentheses or a full stop.

Match the prototype's voice in site content: short declarative sentences, concrete
nouns, no hype adjectives, no "not just X but Y" constructions. The prose in
`docs/intitial-handoff/index.html` is the reference.

## Commits

```
T07: papers migrated (#7)
```

Task ID, lowercase summary, issue reference. Signed once T30 lands. The per-repo
identity is already set; do not change it to the global one.

## Secrets

Never commit: the résumé PDF (`.gitignore` has a blanket `*.pdf`), the Cloudflare API
token, the Resend key, or any private key material. The PDF lives only in a private R2
bucket and is streamed by a function, never given a public URL.
