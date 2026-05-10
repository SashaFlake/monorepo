import { useMemo } from 'react'
import { useForm } from '@tanstack/react-form'
import { Equivalence, Array as A } from 'effect'
import { schemaValidator } from '@/shared/form/schemaResolver'
import { RuleFormSchema } from '../model/schema'
import type { RoutingRule, RuleFormValues, DestinationDraft } from '../model/types'
import { DestinationDraftEq } from '../model/types'

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

// Structural equality — ignores DestinationDraft.id (stable key, not user data)
const RuleFormEq: Equivalence.Equivalence<RuleFormValues> = Equivalence.make((a, b) =>
  a.name === b.name &&
  a.priority === b.priority &&
  a.match.pathPrefix === b.match.pathPrefix &&
  a.destinations.length === b.destinations.length &&
  A.zip(a.destinations, b.destinations).every(([da, db]) => DestinationDraftEq(da, db))
)

// Memoised validator — avoids recreating Schema.decodeUnknownEither on every render
const validate = schemaValidator(RuleFormSchema)

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useRuleForm(initial?: RoutingRule) {
  const initialValues = useMemo(
    () => (initial ? toFormValues(initial) : defaultValues()),
    // eslint-disable-next-line reactHooks/exhaustive-deps
    [initial?.id], // intentional: recompute only when rule identity changes
  )

  const form = useForm<RuleFormValues>({
    defaultValues: initialValues,
    validators: {
      onChange: ({ value }) => {
        const errors = validate(value)
        if (errors.length === 0) return undefined
        // Return first error message; field-level errors bubble via field.state.meta.errors
        return errors[0].message
      },
    },
  })

  // isDirty based on structural equality with initial values (same semantics as before)
  const isDirty = useMemo(
    () => !RuleFormEq(form.state.values, initialValues),
    [form.state.values, initialValues],
  )

  // Field-level error helper — reads from schema validator for a specific field name
  const fieldError = (field: string): string | undefined => {
    if (!form.state.isSubmitted && !form.state.isTouched) return undefined
    const errors = validate(form.state.values)
    return errors.find(e => e.field === field)?.message
  }

  return { form, isDirty, fieldError }
}
