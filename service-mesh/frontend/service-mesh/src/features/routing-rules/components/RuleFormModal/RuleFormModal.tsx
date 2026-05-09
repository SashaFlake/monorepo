import { type ReactElement, useEffect, useRef, useCallback } from 'react'
import { X } from 'lucide-react'
import type { RoutingRule, RuleFormValues } from '../../model/types'
import { useRuleForm } from '../../hooks/useRuleForm'
import { Button } from '@/shared/ui'
import { RuleNameField } from './RuleNameField'
import { RuleMatchFields } from './RuleMatchFields'
import { DestinationList } from '../DestinationList/DestinationList'
import styles from './RuleFormModal.module.css'

export interface RuleFormModalProps {
  initial?:  RoutingRule
  isPending: boolean
  onSubmit:  (values: RuleFormValues) => void
  onClose:   () => void
}

const DISCARD_MESSAGE = 'You have unsaved changes. Discard them?'

export function RuleFormModal({ initial, isPending, onSubmit, onClose }: RuleFormModalProps): ReactElement {
  const form      = useRuleForm(initial)
  const dialogRef = useRef<HTMLDialogElement>(null)

  // Guard: ask confirmation when form has unsaved changes
  const requestClose = useCallback((): void => {
    if (form.isDirty && !window.confirm(DISCARD_MESSAGE)) return
    onClose()
  }, [form.isDirty, onClose])

  useEffect((): void => {
    dialogRef.current?.showModal()
  }, [])

  useEffect((): (() => void) => {
    const dialog = dialogRef.current
    if (!dialog) return (): void => undefined

    // Intercept native close (Escape key) to apply dirty check
    const handleCancel = (e: Event): void => {
      e.preventDefault()
      requestClose()
    }

    dialog.addEventListener('cancel', handleCancel)
    return (): void => { dialog.removeEventListener('cancel', handleCancel) }
  }, [requestClose])

  const handleOverlayClick = (e: React.MouseEvent<HTMLDialogElement>): void => {
    if (e.target === dialogRef.current) requestClose()
  }

  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault()
    form.handleSubmit(onSubmit)
  }

  return (
    <dialog
      ref={dialogRef}
      className={styles.dialog}
      onClick={handleOverlayClick}
      aria-labelledby="rule-form-title"
    >
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2 id="rule-form-title" className={styles.title}>
            {initial ? 'Edit rule' : 'New rule'}
          </h2>
          <button type="button" className={styles.closeBtn} onClick={requestClose} aria-label="Close">
            <X size={16} />
          </button>
        </div>

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
          <div className={styles.actions}>
            <Button type="button" variant="ghost" onClick={requestClose} disabled={isPending}>Cancel</Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Saving…' : initial ? 'Save' : 'Create'}
            </Button>
          </div>
        </form>
      </div>
    </dialog>
  )
}
