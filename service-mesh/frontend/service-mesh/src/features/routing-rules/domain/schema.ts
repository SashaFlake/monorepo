import { Schema } from 'effect'

/**
 * Effect Schema definitions for the routing-rules bounded context.
 *
 * Includes:
 *   - {@link RuleMatchSchema}     – path prefix and header matchers
 *   - {@link DestinationDraftSchema} – a single destination row in a form
 *   - {@link RuleFormSchema}      – full create/edit form with invariants
 *   - {@link RoutingRuleSchema}   – API response shape (mutable, no branded types)
 *
 * Invariants enforced by {@link RuleFormSchema}:
 *   - name: non-blank string
 *   - priority: integer in 0..1000
 *   - destinations: non-empty, no duplicate versions, weights sum to 100
 *   - per-destination: non-blank version, weight in 0..100
 */

// ── Helpers ──────────────────────────────────────────────────────────────────

const NonBlankString = Schema.String.pipe(
  Schema.filter(s => s.trim().length > 0 || 'must not be blank'),
)

// ── Match block ──────────────────────────────────────────────────────────────

/**
 * Schema for a routing-rule matcher.
 *
 * @sideEffects none
 */
export const RuleMatchSchema = Schema.Struct({
  pathPrefix: Schema.optional(Schema.String),
  headers: Schema.optional(Schema.Record({ key: Schema.String, value: Schema.String })),
})

// ── Destination row in the form ──────────────────────────────────────────────

/**
 * Schema for a single destination draft in the rule form.
 *
 * @sideEffects none
 */
export const DestinationDraftSchema = Schema.Struct({
  id: Schema.String,
  serviceId: Schema.optional(Schema.String),
  version: NonBlankString.annotations({ message: () => 'Version is required' }),
  weightPct: Schema.Number.pipe(
    Schema.filter(n => (n >= 0 && n <= 100) || 'Weight must be 0–100'),
  ),
})

// ── Whole form ───────────────────────────────────────────────────────────────

/**
 * Schema for the complete rule form, enforcing all domain invariants.
 *
 * @sideEffects none
 */
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

// ── API schemas ──────────────────────────────────────────────────────────────

/**
 * Schema for a {@link RoutingRule} as returned by the backend API.
 *
 * Uses {@link Schema.mutable} at every level so decoded values match the
 * mutable TypeScript domain types (e.g. `Destination[]` instead of
 * `readonly Destination[]`).  The branded `_brand` field was intentionally
 * omitted because the API returns plain JSON objects.
 *
 * @sideEffects none
 */
export const RoutingRuleSchema = Schema.mutable(Schema.Struct({
  id:           Schema.String,
  serviceId:    Schema.String,
  name:         Schema.String,
  priority:     Schema.Number,
  match:        Schema.mutable(Schema.Struct({
    pathPrefix: Schema.optional(Schema.String),
    headers:    Schema.optional(Schema.Record({ key: Schema.String, value: Schema.String })),
  })),
  destinations: Schema.mutable(Schema.Array(Schema.mutable(Schema.Struct({
    id:         Schema.String,
    serviceId:  Schema.optional(Schema.String),
    version:    Schema.String,
    weightPct:  Schema.Number,
  })))),
  createdAt: Schema.String,
  updatedAt: Schema.String,
}))
