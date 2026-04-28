import { useState, useMemo } from 'react'
import type { RoutingRule, RuleFormValues, Destination } from '../model/types'
import { validateRule, sumWeights } from '../model/validation'

// ── Helpers (pure, testable in isolation) ───────────────────────────────────────────────

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
  destinations: [{ version: '', weightPct: 0 }],
})

// ── Public contract ────────────────────────────────────────────────────────

export type UseRuleFormResult = {
  rule: RuleFormValues
  fieldError: (field: string) => string | undefined
  weightSum: number
  weightValid: boolean
  setName:         (name: string)                => void
  setPriority:     (priority: number)            => void
  setPathPrefix:   (val: string)                 => void
  setDestinations: (destinations: Destination[]) => void
  handleSubmit: (onSubmit: (v: RuleFormValues) => void) => void
}

// ── Hook ────────────────────────────────────────────────────────────────

export function useRuleForm(initial?: RoutingRule): UseRuleFormResult {
  const [rule, setRule] = useState<RuleFormValues>(
    initial ? toFormValues(initial) : defaultValues()
  )
  const [submitAttempted, setSubmitAttempted] = useState(false)

  // ── Derived state ────────────────────────────────────────────────────────────────

  const result = useMemo(() => validateRule(rule), [rule])

  // errors wrapped in its own useMemo so errorMap dep doesn't change every render
  const errors = useMemo(
    () => (result.ok ? [] : result.errors),
    [result]
  )

  const errorMap = useMemo(
    () => Object.fromEntries(errors.map(e => [e.field, e.message])),
    [errors]
  )

  const weightSum   = sumWeights(rule.destinations)
  const weightValid = weightSum === 100

  // ── Field helpers ───────────────────────────────────────────────────────────────

  const fieldError = (field: string): string | undefined =>
    submitAttempted ? errorMap[field] : undefined

  // ── Setters ───────────────────────────────────────────────────────────────────

  const setName = (name: string): void =>
    setRule(r => ({ ...r, name }))

  const setPriority = (priority: number): void =>
    setRule(r => ({ ...r, priority }))

  const setPathPrefix = (val: string): void =>
    setRule(r => ({ ...r, match: { ...r.match, pathPrefix: val } }))

  const setDestinations = (destinations: Destination[]): void =>
    setRule(r => ({ ...r, destinations }))

  // ── Submit ────────────────────────────────────────────────────────────────────

  const handleSubmit = (onSubmit: (v: RuleFormValues) => void): void => {
    setSubmitAttempted(true)
    if (result.ok) onSubmit(rule)
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
