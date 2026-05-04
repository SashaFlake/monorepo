import { Either } from 'effect'
import type { Destination, RuleFormValues, ValidationError, ValidationResult } from './types'

// ── Helpers ───────────────────────────────────────────────────────────────────

export const sumWeights = (destinations: Destination[]): number =>
  destinations.reduce((acc, d) => acc + d.weightPct, 0)

// ── Validators ────────────────────────────────────────────────────────────────

export const validateWeights = (destinations: Destination[]): ValidationResult<Destination[]> => {
  const sum = sumWeights(destinations)
  return sum !== 100
    ? Either.left([{ field: 'destinations', message: `Weight sum = ${sum}%, must be 100%` }])
    : Either.right(destinations)
}

export const validateRule = (values: RuleFormValues): ValidationResult<RuleFormValues> => {
  const errors: ValidationError[] = []

  if (!values.name.trim())
    errors.push({ field: 'name', message: 'Name is required' })

  if (values.priority < 0 || values.priority > 1000)
    errors.push({ field: 'priority', message: 'Priority must be 0–1000' })

  if (values.destinations.length === 0)
    errors.push({ field: 'destinations', message: 'Add at least one destination' })

  const hasEmptyVersion = values.destinations.some(d => !d.version?.trim())
  if (hasEmptyVersion)
    errors.push({ field: 'destinations', message: 'Every destination must have a version' })

  const hasDuplicates = new Set(values.destinations.map(d => d.version)).size !== values.destinations.length
  if (hasDuplicates)
    errors.push({ field: 'version', message: 'Duplicate versions are not allowed' })

  const weightsResult = validateWeights(values.destinations)
  if (Either.isLeft(weightsResult))
    errors.push(...weightsResult.left)

  return errors.length > 0
    ? Either.left(errors)
    : Either.right(values)
}
