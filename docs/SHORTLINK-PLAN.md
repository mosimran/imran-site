# A short link for every paper

Rev C, 5 September 2026. **Built and shipped as T48.** The recommendation stands as
written and every open decision was taken.

Rev A was an exploration. Rev B answered the owner's objection to a dot in the URL and
section 3.1 records why the hyphen was already this repository's convention rather than
a compromise. Rev C is the record of what was decided and built, in section 10.

- [1. What is being asked for](#1-what-is-being-asked-for)
- [2. The objection to answer first](#2-the-objection-to-answer-first)
- [3. Three ways to make the code](#3-three-ways-to-make-the-code)
- [3.1 Writing the number without a dot](#31-writing-the-number-without-a-dot)
- [4. Mechanism](#4-mechanism)
- [5. The ledger, and the invariant that makes a 301 safe](#5-the-ledger-and-the-invariant-that-makes-a-301-safe)
- [6. The published map](#6-the-published-map)
- [7. Where it appears on the page](#7-where-it-appears-on-the-page)
- [8. What this deliberately does not do](#8-what-this-deliberately-does-not-do)
- [9. What will go wrong](#9-what-will-go-wrong)
- [10. Decisions that are the owner's](#10-decisions-that-are-the-owners)

## 1. What is being asked for

A second, shorter address for each paper, on both serving hosts.

```
58  https://mosthofaimran.com/papers/kubernetes-for-a-bicycle/
32  https://mosthofaimran.com/l/5-14
27  https://imran.com.bd/l/5-14
```

Fifty-eight characters is not a problem in a browser. It is a problem in the three
places a paper actually gets shared: read aloud in a talk, printed in a document
nobody can click, and pasted into a message where the slug wraps across two lines and
half of it stops being a link.

Machines do not need this. Crawlers, feed readers and the JSON index already have the
canonical URL and should keep using it. This is for people.

## 2. The objection to answer first

A short link is a URL that hides where it goes. On a site whose entire argument is
that a claim should carry its provenance, an opaque redirect is the wrong default, and
"everyone does it" is not an answer here.

Three properties fix it, and all three are cheap:

1. **The code is not random.** It is derived from something the document already
   publishes, so a reader can tell what the link is before following it.
2. **The whole map is published** at a real URL, so the mapping is auditable rather
   than trusted.
3. **The redirect is a 301 to a real page**, so the address bar shows the full URL a
   moment later. Nothing stays hidden after the click.

A scheme that cannot hold all three is not worth shipping on this site.

## 3. Three ways to make the code

**A truncated hash.** `sha256("/papers/kubernetes-for-a-bicycle/")`, base32, first six
characters: `/l/K7QP2M`. Verifiable in one direction, which is better than nothing, and
unreadable in the other. It needs a collision check at build, it is case-sensitive in a
way that hurts when read aloud, and at 34 and 29 characters it is *longer* than the
alternative below. It buys nothing.

**A curated word.** `/l/k8s-bike`. Pleasant, and it creates a second name for a
document that already has two (a slug and a section number). Three names drift. This
site has an erratum about a title moving away from a slug already, 7.8.

**The section number it already has.** `/l/5-14`. Recommended.

The case for it:

- The site already refers to its own documents this way, in prose, in the masthead, in
  headings and in every erratum: "§5.14", "note 3.2", "erratum 7.25". The short link
  becomes the address of a name that is already in use rather than a new one.
- The numbers are unique across all three collections today: 25 papers at 5.x, 10
  notes at 3.x, 43 errata at 7.x, no collision. One namespace covers the whole site by
  construction.
- It is the shortest of the three and the only one that can be said out loud without
  spelling.
- Section stability is already a committed constraint here. Erratum 7.8 records
  refusing to renumber a section specifically because published anchors depend on the
  numbers holding still. A short link makes that commitment load-bearing in one more
  place, which is the correct direction for it to move.

The cost, stated plainly: **a section number may never be reused.** If 5.14 is ever
retired and the number handed to a different paper, every short link printed on paper
starts lying. Nothing is deleted here, so a number is never freed in practice, but the
rule has to be written down rather than assumed.

## 3.1 Writing the number without a dot

A dot in a path is legal and still a bad idea. It reads as a file extension, it gets
swallowed by the sentence when a link is printed at the end of one, and every
autolinker in a chat client draws the boundary somewhere different.

**This site already solved it.** When a section number has to go somewhere a dot cannot,
the codebase converts it, and it has done so since the errata page was built:

| Where | Form | Source |
| --- | --- | --- |
| Errata anchors | `#e7-32` | `errata/index.astro:27`, literally `.replace('.', '-')` |
| Errata content files | `7-25.md` | `src/content/errata/` |
| Index anchors | `#s21`, `#s131` | published by the prototype, permanent |

So the hyphen is not a new convention invented for short links. It is the convention
this repository already uses for exactly this problem, in code, in filenames and in
published anchors.

`/l/5-14`. Same length as the dotted form, unambiguous, and it survives being read
aloud, printed, and pasted into a client that guesses where a URL ends.

The four candidates, measured on the shorter host:

| Form | Example | Length | Ambiguity | Precedent here |
| --- | --- | --- | --- | --- |
| Dot | `/l/5.14` | 27 | none | none, and rejected |
| **Hyphen** | **`/l/5-14`** | **27** | **none** | **errata anchors and filenames** |
| Digits joined | `/l/514` | 26 | needs single-digit majors forever | index anchors `s21` |
| Letter and ordinal | `/l/p14` | 26 | none | masthead reads "Position Paper 5.14" |

**Digits joined saves one character and buys an unstated invariant.** `s131` on the
index means 13.1 only because no section 1.31 exists. That worked for a numbering
nobody has to extend. It is the wrong bet for a link that gets printed, because the
day the numbering breaks it, every old link stays valid and starts pointing somewhere
plausible and wrong. A silent wrong answer is the failure mode this site exists to
argue against.

**Letter and ordinal is the runner-up.** `p14`, `n10`, `e25` for a paper, a note and an
erratum. Equally short, equally unambiguous, and it drops the 5 as redundant, since a
paper is always in section 5. It loses because it is a fourth name for a document that
has three, and because `5-14` needs no explanation on the `/l/` page while `p14` does.

If the owner wants the shortest thing that can still be said out loud, `p14` is
defensible and the rest of this plan is unchanged by the choice. The recommendation
stays `5-14`.

## 4. Mechanism

Static redirects in `_redirects`, generated after the build, the same shape as
`scripts/csp-hashes.mjs` appending per-path policies to `dist/_headers`.

```
/l/5-14   /papers/kubernetes-for-a-bicycle/   301
/l/5-14/  /papers/kubernetes-for-a-bicycle/   301
```

- **Limits are not close.** Cloudflare documents 2,000 static redirects and 100
  dynamic, 2,100 combined, with a 1,000 character limit per declaration. Twenty-five
  papers take 50 lines. Every code, note and erratum included would take 156.
- **301, not 302.** The mapping is permanent by design, and it should be cached that
  way. Section 5 makes it a build failure to change one after publication.
- **The target is a path, not an absolute URL,** so the requesting host is preserved:
  `imran.com.bd/l/5-14` lands on `imran.com.bd/papers/…/`, which serves the same bytes
  with a canonical naming the primary. That is exactly the aliasing mechanism PLAN
  section 2.1 already relies on, rather than a second one.
- **Zero JavaScript, zero third-party requests, no Function, no `_routes.json`
  change.** The edge answers the redirect before any asset or Worker is reached. None
  of the four hard constraints is touched.
- Pages matches `_redirects` on the path only, which is why one file covers both hosts
  and why no host rule is needed. Already the reason the file has the comment it has.

`/l/` is a prefix nothing else uses. `_redirects` entries here are exact matches, no
wildcard, so the index page at `/l/` in section 6 is unaffected.

## 5. The ledger, and the invariant that makes a 301 safe

`src/data/shortlinks.json`, checked in, append-only:

```json
{ "5-14": { "section": "5.14", "target": "/papers/kubernetes-for-a-bicycle/", "since": "2026-09-04" } }
```

The paper template reads it to print the link. The post-build script reads it to write
the rules. One source, so the page and the redirect cannot disagree.

`scripts/check-short.mjs` fails the build on any of:

1. A paper whose section has no entry.
2. An entry whose target does not exist in `dist/`.
3. An entry that was **removed or repointed** since the last commit, compared against
   `git show HEAD:src/data/shortlinks.json`.
4. Two entries sharing a code.

Check 3 is the one that matters. A 301 is cached by browsers indefinitely and printed
on paper permanently. Without an enforced append-only rule, a short link is a promise
made by whoever edits a JSON file next.

`scripts/check-links.mjs` currently scans `href`s in HTML and never reads
`dist/_redirects`. Every rule in that file should resolve to a real page too, and it
does not today, which is a small existing gap this task can close.

`scripts/check-live.mjs` gets one more assertion: a known short link returns 301 with
the expected `Location`, on both serving hosts. Assert it against the edge rather than
against `dist/`, for the reason that file already documents at length.

## 6. The published map

`/l/` is a real page listing every code, its target, its title and the date it was
issued. This is what turns an opaque link into an auditable one, and it costs one page.

It stays out of the sitemap, along with the redirect paths themselves. The sitemap
filter in `astro.config.mjs` already works by path, so this is one more exclusion.

`llms.txt` can carry the mapping as well, which costs a few lines and means a machine
reader that meets a short link somewhere else can resolve it without following it.

## 7. Where it appears on the page

The "Machine readable" block at the foot of each paper already lists the alternative
URL forms for that document. One more line belongs there, printed as a full absolute
URL rather than as a bare anchor, so it survives printing and copy-paste.

No copy button. That needs JavaScript.

Which host to print is a real question. `imran.com.bd` is five characters shorter and
is the better one to say aloud; `mosthofaimran.com` is canonical and is what every
other URL on the site names. Printing both is honest and doubles what the reader has
to read. Recommendation: print the canonical, and note on `/l/` that the alias serves
the same codes.

## 8. What this deliberately does not do

**No click counting.** A static redirect reports nothing, and there is no way to count
without a Function writing to D1, `/l/*` added to `_routes.json`, a row in the
processor table in PLAN section 6.6, and a disclosure in section 4. Building that is
half a day. Publishing it honestly is the expensive part, and the value of knowing how
many people opened §5.14 is not obviously worth a new data collection surface on a
site that currently collects nothing outside the CV gate. Recommendation: not at
launch, and if it is ever wanted, the disclosure gets written first.

**No QR codes.** The natural follow-on for a printed CV or a talk slide, and a
separate decision. Generating them at build with no dependency is possible; it is not
this task.

**No short links for notes and errata at launch**, although the numbering covers them
for free. Papers are what gets shared.

## 9. What will go wrong

**A section gets renumbered anyway.** The ledger keeps the old code pointing at the
same paper and the paper acquires a second code. Both resolve, nothing breaks, and the
map at `/l/` shows two codes for one document with the dates that explain why. Ugly and
honest, which is the right trade.

**A slug changes.** Already forbidden, and check 2 turns it from a silent 404 into a
build failure.

**Someone reads `/l/` as a tracking link and does not click it.** A reasonable prior
about short links in 2026. The answer is that the code is the document's own section
number, so it tells you where it goes before you follow it, and the map is published.
That is the whole reason for section 3's recommendation.

**Trailing slash.** `/l/5-14/` is what a browser will produce if the site's own
`trailingSlash: 'always'` habit leaks into a hand-typed URL. Two rules per code, not
one, which is why the count in section 4 is 50 and not 25.

## 10. Decisions that are the owner's

Delegated on 2026-09-05 with "decide for me and build", so all five were taken and are
recorded here rather than left open.

1. **Code form: `5-14`.** Section numbers, hyphenated, over `p14`. Both are unambiguous
   and `p14` is one character shorter. `5-14` wins because it is the number already
   printed in the masthead of the page it points at, so the map page has nothing to
   explain. It depends on a section number never being reused, which is now enforced by
   `check-short.mjs` rather than remembered.
2. **The page prints the canonical host.** `mosthofaimran.com/l/5-14`. The five
   characters `imran.com.bd` saves are worth less than every URL on the site naming the
   same origin, and `/l/` documents that the alias answers the same codes.
3. **Papers and implementation notes, not errata.** 35 codes. Both are real pages at
   real URLs with a section number each. Errata are anchors on one shared page, and a
   301 to a fragment is a different mechanism that would need verifying rather than
   assuming, so they wait until somebody wants one.
4. **No click counting.** As recommended in section 8. The code is cheap and the honest
   disclosure is not, and this site collects nothing outside the CV gate.
5. **Shipped as T48**, after T47 closed.

## What was built

| Piece | File |
| --- | --- |
| The ledger, append-only | `src/data/shortlinks.json` |
| Issuing, by hand | `scripts/shortlinks.mjs` |
| Rules into `dist/_redirects` | `scripts/shortlinks.mjs --emit`, in `npm run build` |
| Seven invariants | `scripts/check-short.mjs`, in `npm run check` |
| Redirect awareness | `scripts/check-links.mjs`, both directions |
| Live assertion, both hosts | `scripts/check-live.mjs` |
| The published map | `src/pages/l/index.astro` |
| The share line | `papers/[slug].astro`, `impl/[slug].astro`, `.sl` in `rfc.css` |

One thing changed shape during the build. Section 7 proposed the link go in the
"Machine readable" block at the foot of the page. It sits under the title instead,
because the requirement was sharing with minimal attention and the foot of a paper is
not where an unhurried reader looks, let alone a hurried one.
