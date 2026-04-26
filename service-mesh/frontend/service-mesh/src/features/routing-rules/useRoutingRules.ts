// ---------------------------------------------------------------------------
// useRoutingRules — все запросы и мутации для routing rules
// ---------------------------------------------------------------------------

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { routingApi, routingKeys } from './api'
import type { RoutingRule, RuleFormValues } from './types'

export type RoutingRulesState = {
  // данные
  rules: RoutingRule[]
  isLoading: boolean
  isError: boolean

  // состояние модалок
  createOpen: boolean
  editRule: RoutingRule | null
  deleteRule: RoutingRule | null

  // действия — открыть/закрыть
  openCreate: () => void
  closeCreate: () => void
  openEdit: (rule: RoutingRule) => void
  closeEdit: () => void
  openDelete: (rule: RoutingRule) => void
  closeDelete: () => void

  // мутации
  create: (values: RuleFormValues) => void
  update: (values: RuleFormValues) => void
  remove: () => void
  isCreating: boolean
  isUpdating: boolean
  isDeleting: boolean
}

export function useRoutingRules(): RoutingRulesState {
  const qc = useQueryClient()

  const [createOpen, setCreateOpen] = useState(false)
  const [editRule,   setEditRule]   = useState<RoutingRule | null>(null)
  const [deleteRule, setDeleteRule] = useState<RoutingRule | null>(null)

  const { data: rules = [], isLoading, isError } = useQuery({
    queryKey: routingKeys.list(),
    queryFn:  routingApi.list,
    staleTime: 10_000,
  })

  const invalidate = () => qc.invalidateQueries({ queryKey: routingKeys.list() })

  const createMutation = useMutation({
    mutationFn: (input: RuleFormValues) => routingApi.create(input),
    onSuccess: () => { void invalidate(); setCreateOpen(false) },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: RuleFormValues }) =>
      routingApi.update(id, input),
    onSuccess: () => { void invalidate(); setEditRule(null) },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => routingApi.delete(id),
    onSuccess: () => { void invalidate(); setDeleteRule(null) },
  })

  return {
    rules,
    isLoading,
    isError,

    createOpen,
    editRule,
    deleteRule,

    openCreate:  () => setCreateOpen(true),
    closeCreate: () => setCreateOpen(false),
    openEdit:    (rule) => setEditRule(rule),
    closeEdit:   () => setEditRule(null),
    openDelete:  (rule) => setDeleteRule(rule),
    closeDelete: () => setDeleteRule(null),

    create:     (values) => createMutation.mutate(values),
    update:     (values) => updateMutation.mutate({ id: editRule!.id, input: values }),
    remove:     () => deleteMutation.mutate(deleteRule!.id),
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  }
}
