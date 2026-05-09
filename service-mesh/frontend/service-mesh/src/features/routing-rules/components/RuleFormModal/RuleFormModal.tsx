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
import type { RoutingRule, RuleFormValues } from '../../model/types'
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
  const form = useRuleForm(initial)

  // The component is mounted only when it should be open, so the dialog is
  // considered open as long as we render. Any close intent — overlay click,
  // Escape, the close button, the Cancel action — funnels through this
  // single guard which performs the dirty check.
  const requestClose = (): void => {
    if (form.isDirty && !window.confirm(DISCARD_MESSAGE)) return
    onClose()
  }

  // Radix calls onOpenChange(false) for overlay click and Escape; we
  // delegate to requestClose. Returning is enough — there is no native
  // <dialog> cancel event to preventDefault on.
  const handleOpenChange = (open: boolean): void => {
    if (!open) requestClose()
  }

  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault()
    form.handleSubmit(onSubmit)
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
            <RuleNameField
              value={form.rule.name}
              error={form.fieldError('name')}
              onChange={form.setName}
            />
            <RuleMatchFields
              priority={form.rule.priority}
              pathPrefix={form.rule.match.pathPrefix ?? ''}
              priorityError={form.fieldError('priority')}
              onPriorityChange={form.setPriority}
              onPathPrefixChange={form.setPathPrefix}
            />
            <DestinationList
              destinations={form.rule.destinations}
              onChange={form.setDestinations}
            />
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
