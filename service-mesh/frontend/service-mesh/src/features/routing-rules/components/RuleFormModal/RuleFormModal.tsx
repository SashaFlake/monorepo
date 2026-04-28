import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import type { RoutingRule, RuleFormValues } from '../../model/types'
import { useRuleForm } from '../../hooks/useRuleForm'
import { Button } from '@/components/ui/button'
import { RuleNameField } from './RuleNameField'
import { RuleMatchFields } from './RuleMatchFields'
import { DestinationList } from './DestinationList'
import styles from './RuleFormModal.module.css'

interface RuleFormModalProps {
  initial?: RoutingRule
  isPending: boolean
  onSubmit: (values: RuleFormValues) => void
  onClose: () => void
}

export function RuleFormModal({ initial, isPending, onSubmit, onClose }: RuleFormModalProps) {
  const form = useRuleForm(initial)
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    dialogRef.current?.showModal()
  }, [])

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    const handler = () => onClose()
    dialog.addEventListener('close', handler)
    return () => dialog.removeEventListener('close', handler)
  }, [onClose])

  const handleOverlayClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    if (e.target === dialogRef.current) onClose()
  }

  const handleSubmit = (e: React.FormEvent) => {
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
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Close">
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
            <Button type="button" variant="ghost" onClick={onClose} disabled={isPending}>Cancel</Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Saving…' : initial ? 'Save' : 'Create'}
            </Button>
          </div>
        </form>

      </div>
    </dialog>
  )
}
