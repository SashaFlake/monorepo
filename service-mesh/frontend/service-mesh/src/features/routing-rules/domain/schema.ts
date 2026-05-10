import { Schema } from 'effect'

/**
 * Effect Schema description of a routing-rule form, mirroring the invariants
 * historically enforced by `validation.ts`:
 *
 *   - name: non-blank string
 *   - priority: integer in 0..1000
 *   - destinations: non-empty, no duplicate `version`s, weights sum to exactly 100
 *   - per-destination: non-blank version, weight in 0..100
 *
 * This file intentionally has **no consumers yet**. PR 3b will wire it up to
 * `useRuleForm` via `schemaValidator`. Keeping it isolated lets the schema
 * land independently and be reviewed against the existing `validation.test.ts`
 * cases.
 */

// ── Helpers ──────────────────────────────────────────────────────────────────

const NonBlankString = Schema.String.pipe(
  Schema.filter(s => s.trim().length > 0 || 'must not be blank'),
)

// ── Match block ──────────────────────────────────────────────────────────────

export const RuleMatchSchema = Schema.Struct({
  pathPrefix: Schema.optional(Schema.String),
  headers: Schema.optional(Schema.Record({ key: Schema.String, value: Schema.String })),
})

// ── Destination row in the form ──────────────────────────────────────────────

export const DestinationDraftSchema = Schema.Struct({
  id: Schema.String,
  serviceId: Schema.optional(Schema.String),
  version: NonBlankString.annotations({ message: () => 'Version is required' }),
  weightPct: Schema.Number.pipe(
    Schema.filter(n => (n >= 0 && n <= 100) || 'Weight must be 0–100'),
  ),
})

// ── Whole form ───────────────────────────────────────────────────────────────

export const RuleFormSchema = Schema.Struct({
  name: NonBlankString.annotations({ message: () => 'Name is required' }),
  priority: Schema.Number.pipe(
    Schema.filter(n => Number.isInteger(n) || 'Priority must be an integer'),
    Schema.filter(n => (n >= 0 && n <= 1000) || 'Priority must be 0–1000'),
  ),
  match: RuleMatchSchema,
  destinations: Schema.Array(DestinationDraftSchema).pipe(
    Schema.filter(arr =>
      arr.length === 0
        ? 'Add at least one destination'
        : true,
    ),
    Schema.filter(arr => {
      const versions = arr.map(d => d.version)
      return new Set(versions).size === versions.length
        ? true
        : 'Duplicate versions are not allowed'
    }),
    Schema.filter(arr => {
      const sum = arr.reduce((acc, d) => acc + d.weightPct, 0)
      return sum === 100 ? true : `Weight sum = ${sum}%, must be 100%`
    }),
  ),
})

export type RuleFormSchemaInput = Schema.Schema.Encoded<typeof RuleFormSchema>
export type RuleFormSchemaOutput = Schema.Schema.Type<typeof RuleFormSchema>
