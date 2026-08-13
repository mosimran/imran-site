# mosthofaimran.com: build specification

RFC 0001 as a real site. Static everywhere, with exactly one dynamic surface (Section 6).

The design file `index.html` is a complete, deployable prototype using client-side routing so the whole
document fits in one file. Production does not use that. Every view becomes a real page at a real URL,
because a specification that needs JavaScript to be read is not a specification.

---

## 1. Repository layout

```
mosthofaimran.com/
├─ src/
│  ├─ content/
│  │  ├─ papers/                 # position papers (Section 5)
│  │  │  ├─ competence-porn.md
│  │  │  ├─ algorithmic-homophily.md
│  │  │  └─ ...
│  │  ├─ impl/                   # implementation notes (Section 3)
│  │  │  ├─ llm-gateway.md
│  │  │  └─ ...
│  │  ├─ errata/                 # Section 7 entries, one file each
│  │  └─ config.ts               # schema, enforced at build
│  ├─ layouts/
│  │  ├─ Rfc.astro               # masthead, TOC, page footer band
│  │  ├─ Paper.astro             # abstract, body, retirement conditions, history
│  │  └─ Impl.astro              # constraints, figures, measurements, failure modes
│  ├─ pages/
│  │  ├─ index.astro             # RFC 0001
│  │  ├─ papers/index.astro      # Section 5 complete
│  │  ├─ papers/[slug].astro
│  │  ├─ impl/[slug].astro
│  │  ├─ cv.astro                # Section 6
│  │  ├─ feed.xml.ts
│  │  ├─ errata.xml.ts
│  │  ├─ revisions.xml.ts
│  │  ├─ llms.txt.ts
│  │  ├─ llms-full.txt.ts
│  │  └─ papers/index.json.ts
│  └─ styles/rfc.css             # lifted verbatim from the prototype
├─ public/
│  ├─ robots.txt
│  ├─ pgp.asc
│  ├─ .well-known/security.txt
│  └─ papers/*.md, *.md.asc      # canonical source plus detached signatures
├─ services/cv-gate/             # the only server
└─ astro.config.mjs
```

Static output. Deploy `dist/` to any CDN. The gate is a separate small service on its own subdomain or
behind a path rule, so a failure there cannot take the document down.

---

## 2. Content schema

The schema is the editorial policy. A paper without retirement conditions fails the build instead of
shipping quietly, which is Principle 4.8 enforced by CI rather than by good intentions.

```ts
// src/content/config.ts
import { defineCollection, z } from 'astro:content'

const state = z.enum(['holding', 'revising', 'draft', 'retracted'])

const papers = defineCollection({
  type: 'content',
  schema: z.object({
    section:    z.string(),                      // "5.1"
    title:      z.string(),
    summary:    z.string().max(240),             // the one line shown in every index
    published:  z.date(),
    revised:    z.date(),
    state:      state,
    confidence: z.number().min(0).max(1),

    // Falsification is mandatory. This is the whole point of the site.
    retires:    z.array(z.string()).min(1),

    // Revision log rendered as the paper's history table.
    history: z.array(z.object({
      date: z.date(),
      note: z.string(),
      confidenceAfter: z.number().min(0).max(1).optional(),
    })).min(1),

    // Populated when state === 'retracted'.
    retraction: z.object({
      date: z.date(),
      reason: z.string(),
      erratum: z.string(),                       // "7.2"
      creditedTo: z.string().optional(),
    }).optional(),

    seeAlso: z.array(z.string()).default([]),
    signature: z.string().optional(),            // path to the detached .asc
  })
  .refine(d => d.state !== 'retracted' || !!d.retraction, {
    message: 'A retracted paper MUST carry a retraction block.',
  })
  .refine(d => d.state !== 'draft' || d.confidence <= 0.7, {
    message: 'A draft claiming confidence above 0.7 is not a draft.',
  }),
})

const impl = defineCollection({
  type: 'content',
  schema: z.object({
    section: z.string(),                         // "3.2"
    title: z.string(),
    summary: z.string().max(240),
    since: z.date(),
    state: z.enum(['production', 'complete', 'retired']),
    stack: z.array(z.string()).min(1),
    metrics: z.array(z.object({
      name: z.string(), value: z.string(), note: z.string().optional(),
    })).min(1),
    // A system without a named failure mode is a system you do not understand yet.
    failures: z.array(z.object({
      id: z.string(),                            // "5.1"
      status: z.enum(['fixed', 'open', 'accepted']),
      note: z.string(),
    })).min(1),
    fallsOverAt: z.string(),                     // Principle 4.7, stated as a failure point
  }),
})

export const collections = { papers, impl }
```

Example front matter:

```yaml
---
section: "5.1"
title: Competence Porn
summary: Watching a skilled person work occupies the same reward slot as being one.
published: 2025-09-03
revised: 2026-06-11
state: holding
confidence: 0.80
retires:
  - A longitudinal study showing heavy consumers of technical content outperform matched
    peers on blind, time-boxed debugging tasks.
  - Evidence the effect is generational rather than structural.
  - A large publisher disclosing what fraction of demonstrated architectures reached
    production and survived twelve months, where that fraction is high.
history:
  - { date: 2026-06-11, note: "Section 3 rewritten after a correction from bank operations.", confidenceAfter: 0.80 }
  - { date: 2026-02-08, note: "Retirement conditions added." }
  - { date: 2025-09-03, note: "Published.", confidenceAfter: 0.70 }
seeAlso: ["5.2", "5.4", "5.3"]
signature: /papers/competence-porn.md.asc
---
```

---

## 3. Publishing workflow

```
write paper.md  ->  npm run check  ->  sign  ->  commit (signed)  ->  CI build  ->  CDN
                         |                                              |
                    schema + link check                          feeds regenerated
```

```bash
# publish
npm run check                                   # schema, dead links, orphan sections
gpg --armor --detach-sign src/content/papers/competence-porn.md
mv src/content/papers/competence-porn.md.asc public/papers/
git commit -S -m "5.1: publish at conf 0.70"

# revise in place. The URL never changes.
git commit -S -m "5.1 rev 4: rewrite §3, conf held at 0.80, errata 7.5"
```

Revising a claim requires an errata entry. Enforce it:

```js
// scripts/check-errata.mjs  (run in CI on every PR)
// If a paper's `confidence` or `state` changed versus origin/main and no file was added
// under src/content/errata/, fail. Changing a published claim silently is the one thing
// this site exists to not do.
```

---

## 4. Section 6: the résumé gate

One service. Node with Fastify, PostgreSQL for tokens, Redis for rate limits. Runs in a container
next to whatever else you already operate, or as an edge function if you would rather not run anything.

### 4.1. Schema

```sql
-- services/cv-gate/schema.sql
CREATE TABLE cv_token (
  id           BIGSERIAL PRIMARY KEY,
  token_hash   BYTEA       NOT NULL UNIQUE,   -- sha256 of the token. Raw token is never stored.
  email        CITEXT      NOT NULL,
  issued_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at   TIMESTAMPTZ NOT NULL,
  redeemed_at  TIMESTAMPTZ,
  src_net      INET,                          -- truncated to /24 before insert
  revoked      BOOLEAN     NOT NULL DEFAULT false
);
CREATE INDEX ON cv_token (email);
CREATE INDEX ON cv_token (expires_at) WHERE redeemed_at IS NULL;

-- Retention, run daily. Section 6.4 says 12 months, so the database says 12 months.
DELETE FROM cv_token WHERE issued_at < now() - INTERVAL '12 months';
```

### 4.2. Service

```js
// services/cv-gate/server.js
import Fastify from 'fastify'
import crypto from 'node:crypto'
import pg from 'pg'
import { Redis } from 'ioredis'
import { sendLink } from './mail.js'
import { openPdf } from './storage.js'          // private bucket, no public URL, ever

const app   = Fastify({ logger: true, trustProxy: true })
const db    = new pg.Pool({ connectionString: process.env.DATABASE_URL })
const redis = new Redis(process.env.REDIS_URL)
const TTL_S = 86_400

const sha256 = (s) => crypto.createHash('sha256').update(s).digest()
const net24  = (ip) => (ip || '').split('.').slice(0, 3).concat('0').join('.')

// Sliding window. Two independent limits: per address, and per source network.
async function limited (key, max, windowS) {
  const n = await redis.incr(key)
  if (n === 1) await redis.expire(key, windowS)
  return n > max
}

app.post('/api/cv', async (req, reply) => {
  const email = String(req.body?.email || '').trim().toLowerCase()
  const net   = net24(req.ip)

  // Always 202. The response MUST NOT reveal whether an address is known, rate limited,
  // or malformed: an endpoint that answers differently is an enumeration oracle.
  const respond = () => reply.code(202).send({ status: 'accepted' })

  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return respond()
  if (await limited(`cv:e:${sha256(email).toString('hex')}`, 3, 86_400)) return respond()
  if (await limited(`cv:n:${net}`, 60, 3_600)) return respond()

  const token = crypto.randomBytes(32).toString('base64url')   // 256 bits. Not guessable.
  await db.query(
    `INSERT INTO cv_token (token_hash, email, expires_at, src_net)
     VALUES ($1, $2, now() + ($3 || ' seconds')::interval, $4)`,
    [sha256(token), email, TTL_S, net]
  )

  await sendLink(email, `https://mosthofaimran.com/cv/${token}`, TTL_S)
  return respond()
})

app.get('/cv/:token', async (req, reply) => {
  // Single atomic burn. Two simultaneous requests: exactly one wins.
  const { rows } = await db.query(
    `UPDATE cv_token SET redeemed_at = now()
      WHERE token_hash = $1
        AND redeemed_at IS NULL
        AND revoked = false
        AND expires_at > now()
      RETURNING id, email`,
    [sha256(req.params.token)]
  )
  if (!rows.length) {
    return reply.code(410).type('text/plain')
      .send('410 Gone. Token already used or expired. Request another at /cv, no penalty attached.')
  }

  req.log.info({ evt: 'cv.redeemed', id: rows[0].id })       // structured, no PII in the log line

  reply
    .header('X-Robots-Tag', 'noindex, nofollow, noarchive')
    .header('Cache-Control', 'no-store, private')
    .header('Content-Disposition', 'inline; filename="mosthofa-imran-cv.pdf"')
    .type('application/pdf')
  return openPdf()                                            // stream, never redirect to storage
})

// Section 6.4 promises same-day deletion. Promises need endpoints.
app.post('/api/cv/forget', async (req, reply) => {
  const email = String(req.body?.email || '').trim().toLowerCase()
  await db.query('DELETE FROM cv_token WHERE email = $1', [email])
  return reply.code(202).send({ status: 'accepted' })
})

app.listen({ port: 8080, host: '0.0.0.0' })
```

### 4.3. Properties this buys

| Property | Mechanism |
| --- | --- |
| Token unguessable | 256 bits of CSPRNG, base64url |
| Database breach does not leak links | Only the SHA-256 of the token is stored |
| Single use under concurrency | Atomic `UPDATE ... WHERE redeemed_at IS NULL RETURNING` |
| No enumeration oracle | Every `POST /api/cv` returns 202, regardless of outcome |
| Not indexable | `X-Robots-Tag` on the response, `Disallow` in robots.txt, and no public object URL |
| No object storage leak | The PDF is streamed by the app. It has no signed CDN URL and no public path |
| Retention honoured | Daily `DELETE`, plus an explicit forget endpoint |
| One tenant cannot spend the budget | Two independent rate limit dimensions, address and /24 |

### 4.4. What is deliberately absent

No password. No account. No "verify you are human" widget. No CRM webhook. The gate exists to protect
other people's contact details, not to build a pipeline, and every feature that would make it a pipeline
is a feature Section 6.1 promises not to have.

---

## 5. Headers

```
# public/_headers  (Cloudflare Pages / Netlify syntax)
/*
  Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
  Content-Security-Policy: default-src 'none'; img-src 'self'; style-src 'self'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'
  X-Content-Type-Options: nosniff
  Referrer-Policy: no-referrer
  Permissions-Policy: interest-cohort=(), geolocation=(), camera=(), microphone=()

/cv/*
  X-Robots-Tag: noindex, nofollow, noarchive
  Cache-Control: no-store, private
```

The CSP has no `script-src` because the production build ships no script. The prototype's router is a
build-time convenience and does not survive into `dist/`.

---

## 6. Performance and accessibility budget

Fail the build if any of these regress. A budget nobody enforces is a preference.

| Item | Budget |
| --- | --- |
| HTML, index page | under 60 KB uncompressed |
| CSS | one file, under 12 KB, inlined at build |
| JavaScript in the reading path | 0 bytes |
| Third-party requests | 0 |
| Webfonts | 0. System stacks only, so nothing can be blocked and nothing phones home |
| Largest Contentful Paint, 3G | under 1.2 s |
| Contrast | AA minimum in both colour schemes, verified in CI |
| Tap targets | 44 px minimum |
| Print | one stylesheet, renders as a passable specification |

---

## 7. Deployment

```bash
npm create astro@latest mosthofaimran.com -- --template minimal --typescript strict
npm i @astrojs/mdx @astrojs/sitemap
npm run build && npx serve dist
```

- DNS: apex `mosthofaimran.com` to the CDN, `www` redirects to apex, `api` to the gate service.
- Redirect every `http` to `https`, and preload HSTS once you are sure.
- CI: schema check, link check, errata check, contrast check, build, deploy on green.
- Backups: the site is a git repository, so the backup is the clone. The gate database holds nothing
  you would grieve, which is by design.

---

## 8. Before publishing

1. Replace every figure in Sections 3 and 5 with a number you can defend in an interview.
2. Generate a real OpenPGP key, publish the fingerprint in 9.3, sign RFC 0001 and every paper.
3. Seed Section 7 with at least two real corrections. An empty errata section is worse than no
   errata section, because it makes a promise the site has not yet kept.
4. Write the three highest-confidence papers in full before launch. The form asks a lot of the prose,
   and six strong papers read better here than thirty adequate ones.
5. Decide the inbox policy for Section 7 corrections before the first one arrives.
