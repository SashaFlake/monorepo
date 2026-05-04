import { useState, useMemo } from 'react'
import { Either } from 'effect'
import type { RoutingRule, RuleFormValues, Destination } from '../model/types'
import { validateRule, sumWeights } from '../model/validation'

// ── Helpers (pure) ────────────────────────────────────────────────────────────

const toFormValues = (rule: RoutingRule): RuleFormValues => ({
  name:         rule.name,
  priority:     rule.priority,
  match:        rule.match,
  destinations: rule.destinations,
})

const defaultValues = (): RuleFormValues => ({
  name:         '',
  priority:     100,
  match:        {},
  destinations: [],
})

// ── Public contract ───────────────────────────────────────────────────────────

export type UseRuleFormResult = {
  rule:         RuleFormValues
  fieldError:   (field: string) => string | undefined
  weightSum:    number
  weightValid:  boolean
  setName:         (name: string)                => void
  setPriority:     (priority: number)            => void
  setPathPrefix:   (val: string)                 => void
  setDestinations: (destinations: Destination[]) => void
  handleSubmit:    (onSubmit: (v: RuleFormValues) => void) => void
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useRuleForm(initial?: RoutingRule): UseRuleFormResult {
  const [rule, setRule]                   = useState<RuleFormValues>(
    initial ? toFormValues(initial) : defaultValues()
  )
  const [submitAttempted, setSubmitAttempted] = useState(false)

  // ── Derived ───────────────────────────────────────────────────────────────

  const validationResult = useMemo(() => validateRule(rule), [rule])

  const errorMap = useMemo(() =>
    Either.isLeft(validationResult)
      ? Object.fromEntries(validationResult.left.map(e => [e.field, e.message]))
      : {},
    [validationResult]
  )

  const weightSum   = sumWeights(rule.destinations)
  const weightValid = weightSum === 100

  // ── Accessors ─────────────────────────────────────────────────────────────

  const fieldError = (field: string): string | undefined =>
    submitAttempted ? errorMap[field] : undefined

  // ── Setters (pure updaters) ───────────────────────────────────────────────

  const setName         = (name: string): void        => setRule(r => ({ ...r, name }))
  const setPriority     = (priority: number): void    => setRule(r => ({ ...r, priority }))
  const setPathPrefix   = (val: string): void         => setRule(r => ({ ...r, match: { ...r.match, pathPrefix: val } }))
  const setDestinations = (destinations: Destination[]): void => setRule(r => ({ ...r, destinations }))

  // ── Submit ────────────────────────────────────────────────────────────────

  const handleSubmit = (onSubmit: (v: RuleFormValues) => void): void => {
    setSubmitAttempted(true)
    Either.match(validationResult, {
      onLeft:  () => { /* errors already shown via fieldError */ },
      onRight: onSubmit,
    })
  }

  return {
    rule,
    fieldError,
    weightSum,
    weightValid,
    setName,
    setPriority,
    setPathPrefix,
    setDestinations,
    handleSubmit,
  }
}
