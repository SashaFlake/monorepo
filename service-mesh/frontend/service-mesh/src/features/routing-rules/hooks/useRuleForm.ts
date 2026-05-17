import { useMemo } from 'react'
import { useForm } from '@tanstack/react-form'
import { Equivalence, Array as A } from 'effect'
import { schemaValidator } from '@/shared/form/schemaResolver'
import { RuleFormSchema } from '../domain/schema'
import type { RoutingRule, RuleFormValues, DestinationDraft } from '../domain/types'
import { DestinationDraftEq } from '../domain/types'

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

const RuleFormEq: Equivalence.Equivalence<RuleFormValues> = Equivalence.make((a, b) =>
  a.name === b.name &&
  a.priority === b.priority &&
  a.match.pathPrefix === b.match.pathPrefix &&
  a.destinations.length === b.destinations.length &&
  A.zip(a.destinations, b.destinations).every(([da, db]) => DestinationDraftEq(da, db))
)

const validate = schemaValidator(RuleFormSchema)

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useRuleForm(
  initial: RoutingRule | undefined,
  onSubmit: (values: RuleFormValues) => void,
) {
  const initialValues = useMemo(
    () => (initial ? toFormValues(initial) : defaultValues()),
    // eslint-disable-next-line reactHooks/exhaustive-deps
    [initial?.id],
  )

  const form = useForm({
    defaultValues: initialValues,
    onSubmit: async ({ value }) => onSubmit(value),
  })

  const isDirty = useMemo(
    () => !RuleFormEq(form.state.values, initialValues),
    [form.state.values, initialValues],
  )

  const fieldError = (field: string): string | undefined => {
    if (!form.state.isSubmitted && !form.state.isTouched) return undefined
    const errors = validate(form.state.values)
    return errors.find(e => e.field === field)?.message
  }

  return { form, isDirty, fieldError }
}
