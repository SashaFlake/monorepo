/**
 * @file DeleteRuleDialog – confirmation dialog before deleting a routing rule.
 *
 * Used inline by {@link RulesTable} and at page level by
 * {@link RoutingRulesPage}.
 */
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

/**
 * Props for {@link DeleteRuleDialog}.
 */
interface DeleteRuleDialogProps {
  /** Rule the user wants to delete. */
  rule:       RoutingRule

  /** Whether the delete request is in flight. */
  isPending:  boolean

  /** Called when the user confirms deletion. */
  onConfirm:  () => void

  /** Called when the user cancels or dismisses the dialog. */
  onCancel:   () => void
}

/**
 * Confirmation dialog displayed before deleting a routing rule.
 *
 * Prevents accidental dismissal while the delete mutation is pending.
 *
 * @param rule      - Rule to delete
 * @param isPending - Whether deletion is in progress
 * @param onConfirm - Confirm handler
 * @param onCancel  - Cancel / dismiss handler
 * @returns The alert dialog element
 * @sideEffects none
 */
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
