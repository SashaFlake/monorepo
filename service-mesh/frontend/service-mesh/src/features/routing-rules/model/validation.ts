import { Either, Array as A, Option } from 'effect'
import type { Destination, RuleFormValues, ValidationError, ValidationResult } from './types'

// ── Helpers ─────────────────────────────────────────────────────────────────────

export const sumWeights = (destinations: Destination[]): number =>
  destinations.reduce((acc, d) => acc + d.weightPct, 0)

// ── Atomic validators ───────────────────────────────────────────────────────────
//
// Each validator returns Option<ValidationError>:
//   None  — rule passes
//   Some  — rule fails, carries the error

const validateName = (values: RuleFormValues): Option.Option<ValidationError> =>
  !values.name.trim()
    ? Option.some({ field: 'name', message: 'Name is required' })
    : Option.none()

const validatePriority = (values: RuleFormValues): Option.Option<ValidationError> =>
  values.priority < 0 || values.priority > 1000
    ? Option.some({ field: 'priority', message: 'Priority must be 0–1000' })
    : Option.none()

const validateDestinationsNotEmpty = (values: RuleFormValues): Option.Option<ValidationError> =>
  values.destinations.length === 0
    ? Option.some({ field: 'destinations', message: 'Add at least one destination' })
    : Option.none()

const validateNoDuplicateVersions = (values: RuleFormValues): Option.Option<ValidationError> =>
  new Set(values.destinations.map(d => d.version)).size !== values.destinations.length
    ? Option.some({ field: 'version', message: 'Duplicate versions are not allowed' })
    : Option.none()

// ── Weight validator (exported — also used standalone in useRuleForm) ─────────

export const validateWeights = (destinations: Destination[]): ValidationResult<Destination[]> => {
  const sum = sumWeights(destinations)
  return sum !== 100
    ? Either.left([{ field: 'destinations', message: `Weight sum = ${sum}%, must be 100%` }])
    : Either.right(destinations)
}

// ── Composed rule validator ───────────────────────────────────────────────────
//
// Pipeline:
//   1. Run all atomic validators → Option<ValidationError>[]
//   2. A.filterMap(identity) → keep only Some, unwrap → ValidationError[]
//   3. Merge with weight errors
//   4. Fold → Either.left(errors) | Either.right(values)

const RULE_VALIDATORS: ReadonlyArray<(v: RuleFormValues) => Option.Option<ValidationError>> = [
  validateName,
  validatePriority,
  validateDestinationsNotEmpty,
  validateNoDuplicateVersions,
]

export const validateRule = (values: RuleFormValues): ValidationResult<RuleFormValues> => {
  const fieldErrors = A.filterMap(RULE_VALIDATORS, validator => validator(values))

  const weightResult = validateWeights(values.destinations)
  const weightErrors = Either.isLeft(weightResult) ? weightResult.left : []

  const errors: ValidationError[] = [...fieldErrors, ...weightErrors]

  return errors.length > 0
    ? Either.left(errors)
    : Either.right(values)
}
