import { useState, useMemo } from 'react'
import { Array as A, Either, Equivalence } from 'effect'
import type { RoutingRule, RuleFormValues, DestinationDraft } from '../model/types'
import { DestinationDraftEq } from '../model/types'
import { validateRule, sumWeights } from '../model/types'

// ── Helpers (pure) ────────────────────────────────────────────────────────────

const toFormValues = (rule: RoutingRule): RuleFormValues => ({
  name:         rule.name,
  priority:     rule.priority,
  match:        rule.match,
  destinations: rule.destinations.map(
    ({ serviceId, version, weightPct }): DestinationDraft => ({
      id:        crypto.randomUUID(),
      serviceId,
      version,
      weightPct,
    })
  ),
})

const defaultValues = (): RuleFormValues => ({
  name:         '',
  priority:     100,
  match:        {},
  destinations: [],
})

// Structural equality for RuleFormValues — ignores DestinationDraft.id (stable key, not user data)
const RuleFormEq: Equivalence.Equivalence<RuleFormValues> = Equivalence.make((a, b) =>
  a.name === b.name &&
  a.priority === b.priority &&
  a.match.pathPrefix === b.match.pathPrefix &&
  a.destinations.length === b.destinations.length &&
  A.zip(a.destinations, b.destinations).every(([da, db]) => DestinationDraftEq(da, db))
)

// ── Public contract ───────────────────────────────────────────────────────────

export type UseRuleFormResult = {
  rule:            RuleFormValues
  isDirty:         boolean
  fieldError:      (field: string) => string | undefined
  weightSum:       number
  weightValid:     boolean
  setName:         (name: string)                      => void
  setPriority:     (priority: number)                  => void
  setPathPrefix:   (val: string)                       => void
  setDestinations: (destinations: DestinationDraft[]) => void
  handleSubmit:    (onSubmit: (v: RuleFormValues) => void) => void
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useRuleForm(initial?: RoutingRule): UseRuleFormResult {
  const initialValues = useMemo(
    () => initial ? toFormValues(initial) : defaultValues(),
    // eslint-disable-next-line reactHooks/exhaustive-deps
    [initial?.id], // intentional: recompute only when the rule identity changes
  )

  const [rule, setRule] = useState<RuleFormValues>(initialValues)
  const [submitAttempted, setSubmitAttempted] = useState(false)

  const isDirty = useMemo(() => !RuleFormEq(rule, initialValues), [rule, initialValues])

  const validationResult = useMemo(() => validateRule(rule), [rule])

  const errorMap = useMemo(() =>
    Either.isLeft(validationResult)
      ? Object.fromEntries(validationResult.left.map(e => [e.field, e.message]))
      : {},
    [validationResult]
  )

  const weightSum   = sumWeights(rule.destinations)
  const weightValid = weightSum === 100

  const fieldError = (field: string): string | undefined =>
    submitAttempted ? errorMap[field] : undefined

  const setName         = (name: string): void          => setRule(r => ({ ...r, name }))
  const setPriority     = (priority: number): void      => setRule(r => ({ ...r, priority }))
  const setPathPrefix   = (val: string): void           => setRule(r => ({ ...r, match: { ...r.match, pathPrefix: val } }))
  const setDestinations = (destinations: DestinationDraft[]): void => setRule(r => ({ ...r, destinations }))

  const handleSubmit = (onSubmit: (v: RuleFormValues) => void): void => {
    setSubmitAttempted(true)
    Either.match(validationResult, {
      onLeft:  () => { /* errors shown via fieldError */ },
      onRight: onSubmit,
    })
  }

  return {
    rule, isDirty, fieldError, weightSum, weightValid,
    setName, setPriority, setPathPrefix, setDestinations, handleSubmit,
  }
}
