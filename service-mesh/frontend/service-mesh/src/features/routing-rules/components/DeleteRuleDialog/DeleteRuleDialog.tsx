import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'
import type { RoutingRule } from '../../model/types'
import styles from './DeleteRuleDialog.module.css'

interface DeleteRuleDialogProps {
  rule: RoutingRule
  isPending: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function DeleteRuleDialog({ rule, isPending, onConfirm, onCancel }: DeleteRuleDialogProps): JSX.Element {
  return (
    <div className={styles.overlay} onClick={onCancel}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-desc"
        className={styles.dialog}
        onClick={e => e.stopPropagation()}
      >
        <div className={styles.header}>
          <div className={styles.iconWrap}>
            <Trash2 size={18} />
          </div>
          <h2 id="delete-dialog-title" className={styles.title}>
            Delete rule?
          </h2>
        </div>

        <p id="delete-dialog-desc" className={styles.description}>
          You are about to delete rule{' '}
          <strong className={styles.ruleName}>"{rule.name}"</strong>.
          {' '}This will remove it from traffic routing.
        </p>

        <div className={styles.actions}>
          <Button variant="ghost" onClick={onCancel} disabled={isPending}>
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={onConfirm}
            disabled={isPending}
            aria-busy={isPending}
          >
            {isPending ? 'Deleting…' : 'Delete'}
          </Button>
        </div>
      </div>
    </div>
  )
}
