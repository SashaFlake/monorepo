import type { ReactElement } from 'react'
import { Trash2 } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogActions,
  AlertDialogCancel,
  AlertDialogAction,
  Button,
} from '@/shared/ui'
import type { RoutingRule } from '../../domain/types'
import s from './DeleteRuleDialog.module.css'

interface DeleteRuleDialogProps {
  rule:       RoutingRule
  isPending:  boolean
  onConfirm:  () => void
  onCancel:   () => void
}

export function DeleteRuleDialog({ rule, isPending, onConfirm, onCancel }: DeleteRuleDialogProps): ReactElement {
  // Mounted only while open: any close intent (Escape, Cancel) maps to onCancel.
  const handleOpenChange = (open: boolean): void => {
    if (!open && !isPending) onCancel()
  }

  return (
    <AlertDialog open onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader icon={<Trash2 size={18} />} iconVariant="danger">
          <AlertDialogTitle>Delete rule?</AlertDialogTitle>
        </AlertDialogHeader>

        <AlertDialogDescription>
          You are about to delete rule <strong className={s.ruleName}>“{rule.name}”</strong>.
          {' '}This will remove it from traffic routing.
        </AlertDialogDescription>

        <AlertDialogActions>
          <AlertDialogCancel asChild>
            <Button variant="ghost" disabled={isPending}>Cancel</Button>
          </AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button
              variant="danger"
              onClick={onConfirm}
              disabled={isPending}
              aria-busy={isPending}
            >
              {isPending ? 'Deleting…' : 'Delete'}
            </Button>
          </AlertDialogAction>
        </AlertDialogActions>
      </AlertDialogContent>
    </AlertDialog>
  )
}
