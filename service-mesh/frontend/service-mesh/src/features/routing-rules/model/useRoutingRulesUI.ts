import { useState } from 'react'
import type { RoutingRule } from './types'

export type RoutingRulesUIState = {
  createOpen: boolean
  editRule:   RoutingRule | null
  deleteRule: RoutingRule | null

  openCreate:  () => void
  closeCreate: () => void
  openEdit:    (rule: RoutingRule) => void
  closeEdit:   () => void
  openDelete:  (rule: RoutingRule) => void
  closeDelete: () => void
}

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
