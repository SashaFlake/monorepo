import { type ReactElement } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogActions,
  DialogCloseIconButton,
  Button,
} from '@/shared/ui'
import type { RoutingRule, RuleFormValues } from '../../domain/types'
import { useRuleForm } from '../../application/useRuleForm'
import { RuleNameField } from './RuleNameField'
import { RuleMatchFields } from './RuleMatchFields'
import { DestinationList } from '../DestinationList/DestinationList'
import s from './RuleFormModal.module.css'

/**
 * Props for {@link RuleFormModal}.
 */
export interface RuleFormModalProps {
  /** Existing rule to edit, or omitted for creation. */
  initial?:  RoutingRule
  /** Whether a submit request is in flight. */
  isPending: boolean
  /** Called with validated form values on submit. */
  onSubmit:  (values: RuleFormValues) => void
  /** Called when the user closes the modal (confirm or cancel). */
  onClose:   () => void
}

const DISCARD_MESSAGE = 'You have unsaved changes. Discard them?'

/**
 * Modal dialog for creating or editing a routing rule.
 *
 * @param props – see {@link RuleFormModalProps}
 * @returns RuleFormModal React element
 * @sideEffects Calls `window.confirm` on dirty close.
 */
export function RuleFormModal({ initial, isPending, onSubmit, onClose }: RuleFormModalProps): ReactElement {
  const { form, isDirty } = useRuleForm(initial, onSubmit)

  const requestClose = (): void => {
    if (isDirty && !window.confirm(DISCARD_MESSAGE)) return
    onClose()
  }

  const handleOpenChange = (open: boolean): void => {
    if (!open) requestClose()
  }

  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault()
    e.stopPropagation()
    void form.handleSubmit()
  }

  return (
    <Dialog open onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{initial ? 'Edit rule' : 'New rule'}</DialogTitle>
          <DialogCloseIconButton label="Close" />
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <fieldset disabled={isPending} className={s.fieldsetReset}>
            <form.Field name="name">
              {field => <RuleNameField field={field} />}
            </form.Field>

            <form.Field name="priority">
              {priorityField => (
                <form.Field name="match">
                  {pathPrefixField => (
                    <RuleMatchFields
                      priorityField={priorityField}
                      pathPrefixField={pathPrefixField}
                    />
                  )}
                </form.Field>
              )}
            </form.Field>

            <form.Field name="destinations">
              {field => (
                <DestinationList
                  destinations={field.state.value}
                  onChange={val => field.handleChange(val)}
                />
              )}
            </form.Field>
          </fieldset>

          <DialogActions>
            <Button type="button" variant="ghost" onClick={requestClose} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Saving…' : initial ? 'Save' : 'Create'}
            </Button>
          </DialogActions>
        </form>
      </DialogContent>
    </Dialog>
  )
}
