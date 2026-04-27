import { useState, useMemo } from 'react'
import type { RoutingRule, RuleFormValues, Destination } from '../model/types'
import { validateRule, sumWeights } from '../model/validation'

// ── Helpers (pure, testable in isolation) ─────────────────────────────────────

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

// ── Public contract ───────────────────────────────────────────────────────────

export type UseRuleFormResult = {
  /** Current draft of the rule being created or edited */
  rule: RuleFormValues
  /** Validation message for a field — only shown after the first submit attempt */
  fieldError: (field: string) => string | undefined
  /** Sum of destination weights (must equal 100) */
  weightSum: number
  weightValid: boolean
  // setters
  setName:         (name: string)               => void
  setPriority:     (priority: number)           => void
  setPathPrefix:   (val: string)                => void
  setDestinations: (destinations: Destination[]) => void
  /** Triggers validation; calls onSubmit only if the form is valid */
  handleSubmit: (onSubmit: (v: RuleFormValues) => void) => void
}

// ── Hook ──────────────────────────────────────────────────────────────────────

/**
 * Manages form state for creating or editing a Routing Rule.
 *
 * @example
 * const form = useRuleForm()            // new rule
 * const form = useRuleForm(existingRule) // edit existing
 *
 * Validation errors are shown only after the first submit attempt.
 * Destination weights must sum to 100 for a successful submit.
 */
export function useRuleForm(initial?: RoutingRule): UseRuleFormResult {
  const [rule, setRule] = useState<RuleFormValues>(
    initial ? toFormValues(initial) : defaultValues()
  )
  const [submitAttempted, setSubmitAttempted] = useState(false)

  // ── Derived state ────────────────────────────────────────────────────────

  const result   = useMemo(() => validateRule(rule), [rule])
  const errors   = result.ok ? [] : result.errors
  const errorMap = useMemo(
    () => Object.fromEntries(errors.map(e => [e.field, e.message])),
    [errors]
  )

  const weightSum   = sumWeights(rule.destinations)
  const weightValid = weightSum === 100

  // ── Field helpers ────────────────────────────────────────────────────────

  const fieldError = (field: string): string | undefined =>
    submitAttempted ? errorMap[field] : undefined

  // ── Setters ──────────────────────────────────────────────────────────────

  const setName = (name: string) =>
    setRule(r => ({ ...r, name }))

  const setPriority = (priority: number) =>
    setRule(r => ({ ...r, priority }))

  const setPathPrefix = (val: string) =>
    setRule(r => ({ ...r, match: { ...r.match, pathPrefix: val } }))

  const setDestinations = (destinations: Destination[]) =>
    setRule(r => ({ ...r, destinations }))

  // ── Submit ───────────────────────────────────────────────────────────────

  const handleSubmit = (onSubmit: (v: RuleFormValues) => void) => {
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
