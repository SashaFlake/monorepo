import { Either, Equivalence } from 'effect'

// ── Validation primitives ────────────────────────────────────────────────────

export type ValidationError  = { field: string; message: string }
export type ValidationResult<A> = Either.Either<A, ValidationError[]>

// ── DestinationDraft ─────────────────────────────────────────────────────────

export type DestinationDraft = {
  id:         string
  serviceId?: string
  version:    string
  weightPct:  number
}

/**
 * Creates an empty destination draft with a fresh UUID.
 *
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
 * @param destinations – read-only array of drafts
 * @returns Sum of all `weightPct` values
 * @sideEffects none
 */
export const sumWeights = (destinations: ReadonlyArray<DestinationDraft>): number =>
  destinations.reduce((acc, d) => acc + d.weightPct, 0)

// ── Destination ──────────────────────────────────────────────────────────────

/**
 * A validated destination.  Previously carried a `_brand` tag, but the branded
 * field was removed so that values decoded from the backend API (plain JSON)
 * align with the domain type without runtime construction.
 *
 * Validation is still available via {@link Destination.create}.
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
   * @param raw – draft to validate
   * @returns `Right(destination)` or `Left(errors)`
   * @sideEffects none
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
   * @param raw – draft to coerce
   * @returns The same object typed as {@link Destination}
   * @sideEffects none
   */
  unsafe: (raw: DestinationDraft): Destination => raw,
}

// ── RuleMatch ────────────────────────────────────────────────────────────────

export type RuleMatch = {
  pathPrefix?: string
  headers?:    Record<string, string>
}

// ── RoutingRule ──────────────────────────────────────────────────────────────

export type RoutingRule = {
  id:           string
  serviceId:    string
  name:         string
  priority:     number
  match:        RuleMatch
  destinations: Destination[]
  createdAt:    string
  updatedAt:    string
}

// ── RuleFormValues ───────────────────────────────────────────────────────────

export type RuleFormValues = {
  name:         string
  priority:     number
  match:        RuleMatch
  destinations: DestinationDraft[]
}
