import { useState } from 'react'
import type { RoutingRule } from './types'

/**
 * UI state tracked for the routing rules page modals.
 *
 * @deprecated This hook lives in the `domain/` layer only temporarily.
 *             UI state should move to a Zustand slice in `store/ui.ts`.
 */
export type RoutingRulesUIState = {
  /** Whether the create-rule modal is open. */
  createOpen: boolean

  /** Rule currently being edited, or `null` if the modal is closed. */
  editRule:   RoutingRule | null

  /** Rule currently pending deletion, or `null` if the dialog is closed. */
  deleteRule: RoutingRule | null

  /** Opens the create-rule modal. */
  openCreate:  () => void

  /** Closes the create-rule modal. */
  closeCreate: () => void

  /** Opens the edit modal for the given rule. */
  openEdit:    (rule: RoutingRule) => void

  /** Closes the edit modal. */
  closeEdit:   () => void

  /** Opens the delete confirmation dialog for the given rule. */
  openDelete:  (rule: RoutingRule) => void

  /** Closes the delete confirmation dialog. */
  closeDelete: () => void
}

/**
 * React hook that manages modal visibility state for the routing rules page.
 *
 * @deprecated Should be replaced by a Zustand slice. Kept for backwards
 *             compatibility while the application layer is refactored.
 * @returns Modal visibility state and open/close helpers
 * @sideEffects Mutates local React state via `useState`.
 */
export function useRoutingRulesUI(): RoutingRulesUIState {
  const [createOpen, setCreateOpen] = useState(false)
  const [editRule,   setEditRule]   = useState<RoutingRule | null>(null)
  const [deleteRule, setDeleteRule] = useState<RoutingRule | null>(null)

  return {
    createOpen,
    editRule,
    deleteRule,

    openCreate:  (): void => setCreateOpen(true),
    closeCreate: (): void => setCreateOpen(false),
    openEdit:    (rule): void => setEditRule(rule),
    closeEdit:   (): void => setEditRule(null),
    openDelete:  (rule): void => setDeleteRule(rule),
    closeDelete: (): void => setDeleteRule(null),
  }
}
