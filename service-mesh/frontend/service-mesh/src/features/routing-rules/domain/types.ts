import { Either, Equivalence } from 'effect'

// ── Validation primitives ────────────────────────────────────────────────────

/**
 * Single field-level validation error returned by domain validators.
 *
 * `field` is the last segment of the JSON path (e.g. `priority`, `name`).
 * For root-level filters without a specific field, `field` is an empty string.
 */
export type ValidationError  = { field: string; message: string }

/**
 * Validation result: either a successfully validated value or a non-empty
 * list of {@link ValidationError}.
 */
export type ValidationResult<A> = Either.Either<A, ValidationError[]>

// ── DestinationDraft ─────────────────────────────────────────────────────────

/**
 * Draft destination row used while editing a routing rule in the UI.
 *
 * Unlike {@link Destination}, drafts are mutable, may contain empty strings,
 * and are validated before submission.
 */
export type DestinationDraft = {
  /** Stable row identifier (usually a UUID). */
  id:         string

  /** Optional target service override. */
  serviceId?: string

  /** Target version string (e.g. `v1.2.0`). */
  version:    string

  /** Traffic weight percentage (0–100). */
  weightPct:  number
}

/**
 * Creates an empty destination draft with a fresh UUID.
 *
 * @returns A new {@link DestinationDraft} with empty version, zero weight, and a fresh id
 * @sideEffects Calls `crypto.randomUUID()`.
 */
export const emptyDestinationDraft = (): DestinationDraft => ({
  id:        crypto.randomUUID(),
  version:   '',
  weightPct: 0,
})

/**
 * Equivalence relation for {@link DestinationDraft}.
 *
 * Compares `version`, `weightPct`, and `serviceId`. Two drafts with the
 * same semantic values but different `id`s are considered equivalent.
 *
 * @sideEffects none
 */
export const DestinationDraftEq: Equivalence.Equivalence<DestinationDraft> =
  Equivalence.make((a, b) =>
    a.version   === b.version   &&
    a.weightPct === b.weightPct &&
    a.serviceId === b.serviceId
  )

/**
 * Sums the weight percentages of a list of destination drafts.
 *
 * @param destinations - Read-only array of drafts
 * @returns Sum of all `weightPct` values
 * @sideEffects none
 * @invariants Returns 0 for an empty array.
 */
export const sumWeights = (destinations: ReadonlyArray<DestinationDraft>): number =>
  destinations.reduce((acc, d) => acc + d.weightPct, 0)

// ── Destination ──────────────────────────────────────────────────────────────

/**
 * A validated destination ready for persistence.
 *
 * The branded `_brand` field was intentionally removed so values decoded
 * from the backend API (plain JSON) align with the domain type without
 * runtime construction. Validation is available via {@link Destination.create}.
 */
export type Destination = {
  id:         string
  serviceId?: string
  version:    string
  weightPct:  number
}

/**
 * Factory and validator for {@link Destination} values.
 *
 * @sideEffects none
 */
export const Destination = {
  /**
   * Validates a draft and returns a {@link Destination} on success.
   *
   * @param raw - Draft to validate
   * @returns `Right(destination)` when valid, otherwise `Left(errors)`
   * @sideEffects none
   * @invariants `version` must be non-blank; `weightPct` must be in 0..100.
   */
  create: (raw: DestinationDraft): ValidationResult<Destination> => {
    const errors: ValidationError[] = []

    if (!raw.version.trim())
      errors.push({ field: 'version', message: 'Version is required' })
    if (raw.weightPct < 0 || raw.weightPct > 100)
      errors.push({ field: 'weightPct', message: 'Weight must be 0–100' })

    return errors.length > 0
      ? Either.left(errors)
      : Either.right(raw)
  },

  /**
   * Unsafely coerces a draft to a {@link Destination} without validation.
   *
   * Use only when the draft has already been validated or comes from a
   * trusted source (e.g. the backend API after schema decoding).
   *
   * @param raw - Draft to coerce
   * @returns The same object typed as {@link Destination}
   * @sideEffects none
   */
  unsafe: (raw: DestinationDraft): Destination => raw,
}

// ── RuleMatch ────────────────────────────────────────────────────────────────

/**
 * Match criteria for a routing rule.
 *
 * All fields are optional; when multiple are provided they are typically
 * combined with AND semantics by the data plane.
 */
export type RuleMatch = {
  /** Match requests whose path starts with this prefix. */
  pathPrefix?: string

  /** Match requests that carry these exact header key/value pairs. */
  headers?:    Record<string, string>
}

// ── RoutingRule ──────────────────────────────────────────────────────────────

/**
 * Aggregate root of the routing-rules bounded context.
 *
 * Represents a named rule owned by a service, containing matchers and
 * weighted destinations that the data plane applies to incoming requests.
 */
export type RoutingRule = {
  /** Rule identifier assigned by the backend. */
  id:           string

  /** Identifier of the owning service. */
  serviceId:    string

  /** Human-readable rule name. */
  name:         string

  /** Rule priority (higher values are evaluated first). */
  priority:     number

  /** Request matcher. */
  match:        RuleMatch

  /** Weighted destinations for traffic splitting. */
  destinations: Destination[]

  /** ISO-8601 timestamp of creation. */
  createdAt:    string

  /** ISO-8601 timestamp of the last update. */
  updatedAt:    string
}

// ── RuleFormValues ───────────────────────────────────────────────────────────

/**
 * Values collected by the create/edit rule form.
 *
 * Destinations are stored as {@link DestinationDraft}s so the UI can keep
 * partially valid rows while the user is still editing.
 */
export type RuleFormValues = {
  name:         string
  priority:     number
  match:        RuleMatch
  destinations: DestinationDraft[]
}
