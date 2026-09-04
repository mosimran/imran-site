# A tools section

Rev B, 5 September 2026. Built and deployed as T47. Rev A was exploration; this
revision records where the plan held and where the data contradicted it.

**Where Rev A was right.** Not one big graph: the drawing would have been a hairball. Real pages
per category rather than a filter widget. No logos, for the reasons in section 5. Type only.

**Where Rev A was wrong.** It assumed integrations would be recoverable from the source lists and
that the argument would be about how to draw a hundred-node graph legibly. The edges barely exist:
one tool's description names another 85 times across 591 tools, and eleven of the fourteen
categories contain no internal edges at all. A curated list describes each product on its own
terms. Two categories get a drawing; the rest carry a paragraph saying why there is none.

**What Rev A did not anticipate at all.** The three source lists contain no programming languages,
no runtimes, no operating system tools and no editors anyone here uses. They are catalogues of
developer-facing products. So the ingest could never have produced "the tools I use", however it
was presented, and the section had to become two lists rather than one: a cited catalogue and a
short hand-written overlay carrying evidence. That split is now the thing the front page explains
first.

**Still unbuilt.** Section 6 argued that recording what was dropped and why is what stops this
being a CV appendix. It remains the strongest recommendation here and it is not implemented,
because it needs the owner. So do the depth vocabulary and the wider stack beyond this repository.

Original Rev A text follows unchanged.

- [1. What was asked for, and what survives contact with the constraints](#1-what-was-asked-for-and-what-survives-contact-with-the-constraints)
- [2. Four ways to draw a cloud, and why three of them fail here](#2-four-ways-to-draw-a-cloud-and-why-three-of-them-fail-here)
- [3. The recommendation](#3-the-recommendation)
- [4. The one interactive technique available](#4-the-one-interactive-technique-available)
- [5. Icons](#5-icons)
- [6. The field that makes this worth reading](#6-the-field-that-makes-this-worth-reading)
- [7. What will go wrong](#7-what-will-go-wrong)
- [8. Decisions that are the owner's](#8-decisions-that-are-the-owners)

## 1. What was asked for, and what survives contact with the constraints

The ask: a cloud of everything used in the workflow, categorised, with each tool visibly
connected to the others, carrying an icon, a description, references, and a usage depth.

Four constraints decide most of the design before taste gets a say.

**Zero JavaScript in the reading path.** No hover graph, no zoom, no physics simulation, no
search box that filters. Anything that would normally make a tool cloud feel alive is
unavailable, and weakening this is not on the table: it is the site's oldest claim and section
10 publishes it.

**Zero third-party requests, with one named exception.** No icon CDN, no font with glyph
logos, no embedded widget. Adding a second external host means correcting three sections and
writing the erratum first, which is the correct price and is not worth paying for logos.

**Every view is a real page at a real URL.** A cloud that only exists as one interactive canvas
is a view without addresses. Each tool wants a URL.

**Nothing is invented.** Depth, dates and descriptions come from the owner. A generated section
that guesses how well he knows Rust is worse than no section.

## 2. Four ways to draw a cloud, and why three of them fail here

**A tag cloud sized by usage.** Cheap, zero JavaScript, and poor. Size encodes one variable
badly, nothing is connected to anything, and it reads as decoration. It also cannot carry a
description or a reference, so the page becomes a picture of a list rather than the list.

**One big force-directed graph, laid out at build and emitted as static SVG.** Technically
possible: the same approach the site already uses for its diagrams, which are laid out by hand
today but could be generated. It fails on legibility. A hundred nodes with five edges each is a
hairball, and a hairball communicates "there are many tools" and nothing else. The site's
figures already carry `min-width: 600px` and scroll sideways on a phone; a graph that needs
1400px is unreadable on the device most people will open it on.

**A mind map with one root.** Implies a hierarchy that does not exist. Rust is not a child of
anything, and forcing tools into a tree produces arbitrary parents and hides the cross-links
that were the interesting part of the request.

**Per-category clusters, each small enough to read, plus a neighbourhood view per tool.** This
is the one that survives. Six to ten nodes per drawing is legible at 375 pixels. The
cross-category links that make it a cloud rather than a set of lists are carried on each tool's
own page, which is where somebody who cares about a specific tool has already arrived.

## 3. The recommendation

**A `tools` content collection, one file per tool, and three surfaces generated from it.** The
same shape as Sections 3 and 5, which is not a coincidence: this site's one durable lesson is
that a fact typed twice disagrees with itself, and a tools list is the most duplication-prone
thing yet proposed for it.

Front matter per tool, roughly:

```
name, slug, category, depth, since, dropped (optional), summary,
worksWith: [slugs], replaces: [slugs], links: [{ title, url }]
```

**`/tools/`** is the index: every tool, grouped by category, with depth and a one-line summary.
Generated, so adding a file adds a row and nothing needs editing twice.

**`/tools/<category>/`** carries that category's map, a generated SVG of six to fifteen nodes
with the edges between them, plus the full entries. Small enough to read on a phone.

**`/tools/<slug>/`** is a real page per tool: the description, the references, the depth with
its date, and a small drawing of that tool's immediate neighbourhood. This is where the cloud
actually becomes navigable, because a reader follows an edge by following a link.

Section 3 of the index draft gains a pointer, in the same short-table-plus-link arrangement
Sections 3 and 5 already use. It does not become a fourth big table on a page that has spent
three days fighting its byte budget.

## 4. The one interactive technique available

CSS `:target` is the only interaction this site can have, and it is better than it sounds.

Clicking a node in a generated SVG can navigate to `#tool-rust`, and `:target` styling can then
mark that entry as selected in the list below without a line of script. Highlighting *related*
entries is also possible, and it needs one generated CSS rule per tool naming its neighbours,
which is exactly the kind of thing a build step should write and a person should not.

**The budget allows this, on one page only.** `scripts/check-budget.mjs` measures style bytes in
`dist/index.html` alone, so a page-scoped block on `/tools/` costs nothing against the 12 KB
stylesheet. It adds no request and no `<link>`, so the zero-third-party and one-stylesheet rules
are untouched in substance. It is still a deliberate departure from "one stylesheet, inlined at
build" and should be recorded as such rather than slipped in.

## 5. Icons

**The recommendation is no logos**, and the reasons are practical rather than aesthetic.

Every logo is either a third-party request, which is forbidden, or an SVG committed to this
repository, which means a hundred vendor marks under someone else's trademark, a maintenance
burden every time a company rebrands, and several kilobytes in a build that measures itself in
bytes. The site has no images in the reading path today except the share card.

The alternative is what the rest of the site already does: monospace type, a category colour
from the existing palette, and the tool's name. It will look deliberate rather than
under-resourced, because everything around it looks the same way.

If logos are wanted anyway, the honest version is inline SVG committed to the repo, restricted
to tools where the mark is genuinely load-bearing for recognition, and never fetched.

## 6. The field that makes this worth reading

A list of a hundred tools with depth ratings is a CV appendix. Every engineer has one and
nobody reads them.

**The field worth adding is the one that says what was dropped, and why.** A tools section that
only accumulates reads as promotional, and this site does not have another section that only
accumulates: Section 5 carries retirement conditions, Section 7 carries what turned out to be
wrong, and Section 3 names failure modes. A tool entry that records "used for two years,
replaced by X because Y" is the same argument in a new place, and it is the only version of this
page a sceptical reader will find informative.

The same reasoning applies to depth. A number nobody can check is worth little; a number
attached to a date and a reason carries something. The site already has this exact mechanism in
the confidence value, and the discipline transfers: a depth of "expert" is a claim that gets
tested in an interview, so it should be set the way a confidence value is set.

## 7. What will go wrong

**It goes stale faster than anything else here.** Tools churn, links rot, and a page dated
eighteen months ago listing a deprecated library is worse than no page, on a site whose argument
is that unrevised claims decay. Every entry should carry `revised`, the index should say how old
its oldest entry is, and a check should report entries past some age. That check is cheap and it
is the thing that keeps this section honest.

**Category boundaries will be argued about and are not worth arguing about.** A tool sits in one
category for navigation and its edges do the real work.

**The graph will be sparser than expected.** Most tools genuinely connect to two or three
others, and writing `worksWith` for a hundred tools is where the enthusiasm runs out. Better to
ship thirty tools with real edges than a hundred with none.

## 8. Decisions that are the owner's

- **Logos or type.** Section 5 recommends type and explains the cost of the alternative.
- **Whether dropped tools are in scope.** Section 6 argues they are the most valuable part.
  Without them this is an inventory.
- **How many tools at launch.** Thirty with real relationships and honest depth beats a hundred
  padded out, and the section can grow.
- **Whether a page-scoped style block is acceptable** for the `:target` highlighting, given the
  contract says one stylesheet. It costs nothing measurable and it is a real departure.
- **Depth vocabulary.** Something with edges: "shipped production systems in it", "use weekly",
  "read the docs once". Anything on a one-to-five scale will be read as self-assessment and
  discounted.

---

## Rev C, 5 September 2026: the drawing is gone

Rev B said two categories get a drawing and the rest carry a paragraph saying why there is
none. Both halves of that shipped and both were wrong, and the owner said so from a
screenshot of each.

**The paragraph explained the mechanism instead of saying anything.** "An edge means one
tool's description names another. 1 edges between 2 of the 31 tools here." A reader who did
not ask how an edge is defined learns nothing from that, and a reader who did is being told
about a drawing rather than about the tools.

**The drawing was worse.** The numbers, measured across the whole catalogue rather than
recalled:

| Category | Tools | Nodes | Edges |
| --- | --- | --- | --- |
| ai-assistants | 115 | 19 | 17 |
| devops | 34 | 12 | 11 |
| testing | 66 | 4 | 3 |
| data | 35 | 4 | 2 |
| security | 45 | 3 | 2 |
| workflow | 88 | 3 | 2 |
| docs | 31 | 2 | 1 |
| eight others | 322 | 0 | 0 |

Eight of fourteen categories have no edges at all. Five of the six that drew had between two
and four connected tools, so `docs` published a two-node vertical line occupying 350px. And
the one category with a real shape, ai-assistants at 19 nodes, was excluded by the 16-node cap
the plan itself set: the rule admitted every drawing not worth making and rejected the only
one that was.

**The cause is the source data, not the drawing.** An awesome-list entry introduces a product
on its own terms and rarely names what it works with, so the edges do not exist to be found.
Rev A already rejected manufacturing them from shared category membership, on the grounds
that it would connect everything to everything, and that reasoning holds.

Removed. This landed on top of T50, which had already replaced the quoted list descriptions
with homepage copy and added a liveness probe, so what each category page carries instead is
built from that: the count, the date the descriptions were last checked, how many of those
homepages did not answer, and how many tools are used to build this site. Section 2's argument
for a per-category map is superseded by its own data.
