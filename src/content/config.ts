import { defineCollection, z } from 'astro:content'

/*
 * The schema is the editorial policy. BUILD.md section 2 specifies it, and the
 * point is that a paper without retirement conditions fails the build instead
 * of shipping quietly.
 *
 * One addition to the specified enum: `unwritten`.
 *
 * The prototype's index lists 14 papers but carries a body for exactly one, and
 * retirement conditions for that same one. Under the specified schema those 13
 * entries cannot exist, because `retires` is required. The choices were to
 * invent 13 sets of falsification conditions, to relax the rule that the whole
 * site rests on, or to say plainly that a listed title is not yet a paper.
 *
 * `unwritten` is the third. It is an index entry, not an argument: no body, no
 * retirement conditions, and a page that says so. Everything that IS a paper
 * still has to carry `retires`, so the rule holds exactly where it matters. The
 * moment a body is written the state changes and the schema starts enforcing.
 */

const state = z.enum(['holding', 'revising', 'draft', 'retracted', 'unwritten'])

const papers = defineCollection({
  type: 'content',
  schema: z
    .object({
      section: z.string(),
      title: z.string(),
      summary: z.string().max(240),
      published: z.coerce.date().optional(),
      revised: z.coerce.date(),
      state,
      confidence: z.number().min(0).max(1).optional(),

      // Falsification is mandatory for anything claiming to be a paper.
      retires: z.array(z.string()).default([]),

      history: z
        .array(
          z.object({
            date: z.coerce.date(),
            note: z.string(),
            confidenceAfter: z.number().min(0).max(1).optional(),
          }),
        )
        .default([]),

      retraction: z
        .object({
          date: z.coerce.date(),
          reason: z.string(),
          erratum: z.string(),
          creditedTo: z.string().optional(),
        })
        .optional(),

      seeAlso: z.array(z.string()).default([]),
      signature: z.string().optional(),
    })
    .refine((d) => d.state === 'unwritten' || d.state === 'retracted' || d.retires.length > 0, {
      message: 'A paper MUST carry retirement conditions. Mark it `unwritten` if it has none yet.',
      path: ['retires'],
    })
    .refine((d) => d.state !== 'retracted' || !!d.retraction, {
      message: 'A retracted paper MUST carry a retraction block.',
      path: ['retraction'],
    })
    .refine((d) => d.state !== 'draft' || (d.confidence ?? 0) <= 0.7, {
      message: 'A draft claiming confidence above 0.7 is not a draft.',
      path: ['confidence'],
    })
    .refine((d) => d.state === 'unwritten' || d.state === 'retracted' || d.history.length > 0, {
      message: 'A published paper MUST carry a revision history.',
      path: ['history'],
    }),
})

const impl = defineCollection({
  type: 'content',
  schema: z.object({
    section: z.string(),
    title: z.string(),
    summary: z.string().max(240),
    since: z.coerce.date().optional(),
    revised: z.coerce.date(),
    state: z.enum(['production', 'complete', 'retired', 'unwritten']),
    stack: z.array(z.string()).default([]),
    result: z.array(z.string()).default([]),
    metrics: z
      .array(z.object({ name: z.string(), value: z.string(), note: z.string().optional() }))
      .default([]),
    // A system without a named failure mode is a system you do not understand yet.
    failures: z
      .array(z.object({ id: z.string(), status: z.enum(['fixed', 'open', 'accepted']), note: z.string() }))
      .default([]),
    fallsOverAt: z.string().optional(),
  }),
})

const errata = defineCollection({
  type: 'content',
  schema: z.object({
    section: z.string(),
    title: z.string(),
    date: z.coerce.date(),
    kind: z.enum(['downgrade', 'retraction', 'self-correction', 'correction']),
    affects: z.string().optional(),
    creditedTo: z.string().optional(),
  }),
})

export const collections = { papers, impl, errata }
