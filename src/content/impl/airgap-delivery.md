---
section: "3.5"
title: "Air-gapped delivery pipeline"
summary: "Shipping software into estates with no network path back, as one complete signed artifact, installed by an operator who cannot ask you a question."
slug: "airgap-delivery"
revised: 2026-09-03
state: production
stack: ["OCI bundles", "cosign", "Helm", "offline registry"]
result: []
fallsOverAt: "Version skew. A site updated by hand drifts, and every migration has to tolerate arriving several versions late. The practical limit is how many versions back the upgrade path is still tested, not anything about the bundle or the install itself."
failures:
  - { id: "5.1", status: fixed, note: "A hidden network dependency. Something resolves at runtime rather than at build time: a base image layer, a certificate revocation check, a license callback, an NTP sync, a DNS lookup with no fallback. It passes every test in a connected pipeline because the network quietly answers, and it fails only on the far side of the gap, where nobody can diagnose it. The answer is to build and test with egress denied by default, so that a missing dependency fails in CI rather than in somebody's data centre a month later." }
  - { id: "5.2", status: fixed, note: "Reproducibility drift. Embedded build timestamps, non-deterministic archive ordering, an unpinned transitive dependency, and the bundle the operator hashes no longer matches the bundle that was signed. The install is fine and the verification step fails, which is worse than it sounds: the operator learns that the check is unreliable, and the next time it fails they will be tempted to skip it. A verification step people route around has negative value." }
  - { id: "5.3", status: open, note: "Trust distribution is the unsolved part. A signature is only worth the process by which the public key reached the site, and that process is out of band by definition: a key fingerprint read over a phone, printed in a contract, or carried by the same person carrying the media. Rotating that key across a hundred disconnected sites is genuinely hard, and every scheme trades key freshness against the number of humans who have to do something correctly. Nobody has a clean answer." }
  - { id: "5.4", status: accepted, note: "Sites run different versions because updates travel at the speed of a person. Migrations therefore have to tolerate arriving several versions late, and upgrade paths need testing across a matrix that grows with every release. The decision is to support a bounded window of versions rather than pretend the estate is uniform, to test that window explicitly, and to refuse an upgrade that falls outside it rather than attempt it and corrupt data." }
  - { id: "5.5", status: open, note: "There is no telemetry, so failures are invisible until a person describes them. You learn about a problem weeks later, paraphrased by an operator who is not an engineer, in a message that omits the part you need. Local diagnostics narrow it: a support bundle the operator can generate and export, and error messages written to be quoted rather than interpreted. It does not close the gap, because the feedback loop still runs through a human and still takes weeks." }
---

<div class="memo"><b>How to read this note.</b> This is the reference design for delivering
software into environments with no network path back to the vendor: the constraint, the decisions
that follow, and the failure modes this kind of delivery has, with the standard answers to each.
It is a solution path for a system like the one built rather than a disclosure of that system's
internals. Site identities, counts, deployment topology and install history are deliberately
absent.
<br><br>The figures this page carried until 2026-09-03 (six sites, zero failed installs since
2024-09) were the handoff prototype's, as was its summary, and both are removed under
<a href="/errata/#e7-20">erratum 7.20</a>. No replacements are invented.</div>

## 1. The constraint

There is no network path, and there is never going to be one.

Not a firewall with an exception process. Not a proxy someone can whitelist a host on. A
disconnected estate, in a building you will not enter, running on hardware you will not see,
installed by an operator who has never met you and may not share a language with you. You cannot
ship a hotfix, read a log, attach a debugger, or ask what the screen says.

Everything difficult about this follows from one property: **the feedback loop is weeks long and
runs through a person who is not an engineer.** In a connected system a bad release is found in
minutes and fixed in an hour. Here it is found when somebody writes an email, and the email
omits the part you need.

So the artifact has to be complete, it has to be verifiable by someone with no way to ask a
question, and it has to fail in ways that are legible to a person reading an error message for
the first time.

## 2. The decisions, and where each one is enforced

<figure>
<div class="dia">
<svg viewBox="0 0 640 276" role="img" aria-label="On the connected side, a build produces one complete bundle containing every dependency and an offline registry, which is then signed. The bundle crosses the gap on physical media, shown as a one-way arrow with no return path. On the disconnected side the operator verifies the signature and hash against a key distributed out of band, runs preflight checks, and installs. The installer refuses to proceed if verification fails. A local support bundle is the only diagnostic output, and it travels back by hand, slowly.">
<defs><marker id="aa" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10z" fill="currentColor"/></marker></defs>

<text class="d" x="10" y="14" font-size="9" letter-spacing=".9">CONNECTED SIDE, WHERE EVERYTHING MUST ALREADY BE DECIDED</text>
<rect class="ab sa" x="10" y="24" width="250" height="60" rx="3" stroke-width="1.5"/>
<text class="a" x="24" y="42" font-size="10">build with egress denied</text>
<text class="d" x="24" y="58" font-size="8.5">every dependency, chart, migration,</text>
<text class="d" x="24" y="72" font-size="8.5">and the registry itself, in one artifact</text>

<rect x="272" y="24" width="112" height="60" rx="3" fill="none" stroke="currentColor" stroke-width="1.5"/>
<text x="328" y="48" font-size="10" text-anchor="middle">sign</text>
<text class="d" x="328" y="66" font-size="8.5" text-anchor="middle">reproducible bytes</text>
<line class="sd" x1="260" y1="54" x2="268" y2="54" stroke-width="1.25" marker-end="url(#aa)"/>

<line class="sd" x1="424" y1="14" x2="424" y2="262" stroke-width="1.25" stroke-dasharray="5 4"/>
<text class="r" x="430" y="12" font-size="9" letter-spacing=".9">THE GAP</text>

<line class="sa" x1="384" y1="54" x2="470" y2="54" stroke-width="1.75" marker-end="url(#aa)"/>
<text class="d" x="392" y="46" font-size="8.5">physical media</text>

<text class="d" x="474" y="14" font-size="9" letter-spacing=".9">DISCONNECTED</text>
<rect x="474" y="24" width="156" height="60" rx="3" fill="none" stroke="currentColor" stroke-width="1.5"/>
<text x="552" y="44" font-size="10" text-anchor="middle">verify, then preflight</text>
<text class="d" x="552" y="60" font-size="8.5" text-anchor="middle">key arrived out of band</text>
<text class="d" x="552" y="74" font-size="8.5" text-anchor="middle">install refuses if either fails</text>

<line class="sd" x1="552" y1="84" x2="552" y2="108" stroke-width="1.25" marker-end="url(#aa)"/>
<rect x="474" y="112" width="156" height="46" rx="3" fill="none" stroke="currentColor" stroke-width="1.5"/>
<text x="552" y="130" font-size="10" text-anchor="middle">install, idempotent</text>
<text class="d" x="552" y="146" font-size="8.5" text-anchor="middle">safe to run twice</text>

<rect x="474" y="176" width="156" height="46" rx="3" fill="none" stroke="currentColor" stroke-width="1.25" stroke-dasharray="4 3"/>
<text class="r" x="552" y="194" font-size="10" text-anchor="middle">support bundle</text>
<text class="d" x="552" y="210" font-size="8.5" text-anchor="middle">the only diagnostic there is</text>
<line class="sd" x1="552" y1="158" x2="552" y2="172" stroke-width="1.25" marker-end="url(#aa)"/>

<line class="sd" x1="470" y1="199" x2="384" y2="199" stroke-width="1.25" stroke-dasharray="3 3" marker-end="url(#aa)"/>
<text class="d" x="300" y="195" font-size="8.5">carried back by hand,</text>
<text class="d" x="300" y="208" font-size="8.5">weeks later, paraphrased</text>

<line class="sd" x1="10" y1="240" x2="410" y2="240" stroke-width="1" opacity=".4"/>
<text class="d" x="10" y="258" font-size="9.5">Anything resolved at install time is a network call, and</text>
<text class="d" x="10" y="272" font-size="9.5">there is no network. Everything else follows.</text>
</svg>
</div>
<figcaption>Figure 1. The arrow crossing the gap goes one way. Everything on the left has to be
right before it does, because nothing on the right can be corrected afterwards.</figcaption>
</figure>

**2.1. One artifact, genuinely complete.** Every dependency, every base layer, every chart and
migration, and the registry to serve them from, inside a single bundle. Anything resolved at
install time is a network call in disguise. This is **enforced at build time** by denying egress
in the pipeline, so a package that would have been fetched on the far side fails here instead,
where somebody can fix it in ten minutes.

**2.2. The same image ships everywhere, and configuration alone decides.** No separate air-gap
build. A special build for the hardest environment is the build that gets the least testing, and
it is the one that has to work with no way to intervene. Connected estates run the same bytes,
which means the air-gapped path is exercised continuously by everybody else.

**2.3. Verification is refusal, not a warning.** The installer checks the signature and the hash
against a key distributed out of band, and stops if either fails. Not a prompt, not a flag to
continue anyway. An override exists in every system that has one, gets used under deadline
pressure, and the property being protected is the only reason a regulated site accepted a vendor
artifact at all.

**2.4. Install is idempotent and resumable.** The operator will run it twice. Something will
time out halfway, the media will be re-inserted, a step will be repeated. An installer that is
only correct on a clean first run is an installer that will corrupt a site, and no one will be
watching when it does.

**2.5. Diagnostics are produced locally and designed to be quoted.** Preflight checks run before
anything is written and fail with messages meant to be read aloud or pasted into an email, not
interpreted. A support bundle the operator can generate on demand is the entire remote debugging
story, so it is a feature with a spec rather than a log directory somebody tars up.

## 3. Why this decides which customers exist

An air-gapped delivery path decides which customers can buy at all, which is a larger claim than
hardening usually gets to make.

Central banks, defence and government estates, and telecom operators under sovereignty rules do
not have a procurement route for software that requires a connection home. The requirement
arrives as a precondition, and a vendor without an answer is
filtered out before the technical evaluation starts.

The second effect is on everyone else. A product that installs with no network dependency
installs cleanly in a restricted enterprise environment too, where the customer's security team
has opinions about egress but not a physical gap. The work done for the strictest customer
lowers the integration cost for every customer below them, which is unusual: hardening usually
taxes the common case, and this is one of the times it subsidises it.

## 4. Figures

**This note reports none.** The four that would matter are the number of sites under management,
install success rate on first attempt, the version spread across the estate at a given moment,
and elapsed time from release to a site being updated.

They exist and are not published here, because site counts and identities are the customer's
information rather than mine. The figures this page did carry (six sites, zero failed installs
since a given month) were the handoff prototype's, and erratum 7.20 removes them.

## 5. What I would do differently

**Deny egress in the build pipeline on day one, not after the first failure across the gap.**
Failure 5.1 is entirely preventable and it is normally discovered the expensive way, because a
connected pipeline is quietly forgiving and the gap is not. This is one line of CI configuration
and it should predate the first bundle.

**Version the bundle format itself, separately from the software.** The installer on a site is
whatever version arrived last, and it has to read a bundle produced by a much newer build.
Treating the bundle as a versioned interface with its own compatibility rules avoids the failure
where a site cannot be upgraded because it cannot read the thing that would upgrade it.

**Write the operator's runbook before the installer.** The error messages, the preflight output
and the support bundle are the product for the person actually doing the work, and they get
treated as documentation to be written afterwards. Failure 5.5 is open, and the part of it that
is addressable is entirely a writing problem that engineers schedule last.
