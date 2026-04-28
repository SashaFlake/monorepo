import { Either } from 'effect'

// ── Validation primitives ─────────────────────────────────────────────────────

export type ValidationError = { field: string; message: string }
export type ValidationResult<A> = Either.Either<A, ValidationError[]>

// ── Destination ───────────────────────────────────────────────────────────────
//
// Opaque-тип: создать Destination можно только через Destination.create().
// Невалидный объект (пустая version, вес вне 0–100) не может быть построен.

export type Destination = {
  readonly _brand: 'Destination'
  readonly serviceId?: string
  readonly version: string
  readonly weightPct: number
}

type DestinationInput = {
  serviceId?: string
  version: string
  weightPct: number
}

export const Destination = {
  create: (raw: DestinationInput): ValidationResult<Destination> => {
    const errors: ValidationError[] = []

    if (!raw.version.trim())
      errors.push({ field: 'version', message: 'Version is required' })

    if (raw.weightPct < 0 || raw.weightPct > 100)
      errors.push({ field: 'weightPct', message: 'Weight must be 0–100' })

    return errors.length > 0
      ? Either.left(errors)
      : Either.right({ _brand: 'Destination' as const, ...raw })
  },

  // Используется в тестах и моках — обходит валидацию для уже доверенных данных
  unsafe: (raw: DestinationInput): Destination =>
    ({ _brand: 'Destination' as const, ...raw }),
}

// ── RuleMatch ─────────────────────────────────────────────────────────────────

export type RuleMatch = {
  pathPrefix?: string
  headers?: Record<string, string>
}

// ── RoutingRule ───────────────────────────────────────────────────────────────
//
// Приходит с сервера — бэкенд отвечает за валидность.
// Smart Constructor не нужен.

export type RoutingRule = {
  id: string
  serviceId: string
  name: string
  /** 0–1000, меньше = выше приоритет */
  priority: number
  match: RuleMatch
  destinations: Destination[]
  createdAt: string
  updatedAt: string
}

// ── RuleFormValues ────────────────────────────────────────────────────────────
//
// Промежуточный тип для формы — destinations здесь сырые (ещё не валидированы).
// После validateRule превращается в Either<ValidationError[], RuleFormValues>.

export type RuleFormValues = {
  name: string
  priority: number
  match: RuleMatch
  destinations: Destination[]
}
