import { Either, Equivalence } from 'effect'

// ── Validation primitives ────────────────────────────────────────────────────────────────────

export type ValidationError  = { field: string; message: string }
export type ValidationResult<A> = Either.Either<A, ValidationError[]>

// ── DestinationDraft ───────────────────────────────────────────────────────────────────────────────

export type DestinationDraft = {
  id:         string
  serviceId?: string
  version:    string
  weightPct:  number
}

export const emptyDestinationDraft = (): DestinationDraft => ({
  id:        crypto.randomUUID(),
  version:   '',
  weightPct: 0,
})

export const DestinationDraftEq: Equivalence.Equivalence<DestinationDraft> =
  Equivalence.make((a, b) =>
    a.version   === b.version   &&
    a.weightPct === b.weightPct &&
    a.serviceId === b.serviceId
  )

export const sumWeights = (destinations: ReadonlyArray<DestinationDraft>): number =>
  destinations.reduce((acc, d) => acc + d.weightPct, 0)

// ── Destination ──────────────────────────────────────────────────────────────────────────────────────

export type Destination = {
  readonly _brand:     'Destination'
  readonly id:         string
  readonly serviceId?: string
  readonly version:    string
  readonly weightPct:  number
}

export const Destination = {
  create: (raw: DestinationDraft): ValidationResult<Destination> => {
    const errors: ValidationError[] = []

    if (!raw.version.trim())
      errors.push({ field: 'version', message: 'Version is required' })
    if (raw.weightPct < 0 || raw.weightPct > 100)
      errors.push({ field: 'weightPct', message: 'Weight must be 0–100' })

    return errors.length > 0
      ? Either.left(errors)
      : Either.right({ _brand: 'Destination' as const, ...raw })
  },

  unsafe: (raw: DestinationDraft): Destination =>
    ({ _brand: 'Destination' as const, ...raw }),
}

// ── RuleMatch ──────────────────────────────────────────────────────────────────────────────────────────

export type RuleMatch = {
  pathPrefix?: string
  headers?:    Record<string, string>
}

// ── RoutingRule ────────────────────────────────────────────────────────────────────────────────────

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

// ── RuleFormValues ──────────────────────────────────────────────────────────────────────────────────

export type RuleFormValues = {
  name:         string
  priority:     number
  match:        RuleMatch
  destinations: DestinationDraft[]
}
