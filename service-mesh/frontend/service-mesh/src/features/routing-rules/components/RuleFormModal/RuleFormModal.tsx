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
import { useRuleForm } from '../../hooks/useRuleForm'
import { RuleNameField } from './RuleNameField'
import { RuleMatchFields } from './RuleMatchFields'
import { DestinationList } from '../DestinationList/DestinationList'

export interface RuleFormModalProps {
  initial?:  RoutingRule
  isPending: boolean
  onSubmit:  (values: RuleFormValues) => void
  onClose:   () => void
}

const DISCARD_MESSAGE = 'You have unsaved changes. Discard them?'

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
          <fieldset disabled={isPending} style={{ border: 'none', padding: 0, margin: 0 }}>
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
                  destinations={field.state.value as RuleFormValues['destinations']}
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
