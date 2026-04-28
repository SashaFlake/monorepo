import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { routingRulesApi, routingKeys } from '../api/api'
import type { RoutingRule, RuleFormValues } from './types'

export type RoutingRulesState = {
  rules: RoutingRule[]
  isLoading: boolean
  isError: boolean

  createOpen: boolean
  editRule: RoutingRule | null
  deleteRule: RoutingRule | null

  openCreate: () => void
  closeCreate: () => void
  openEdit: (rule: RoutingRule) => void
  closeEdit: () => void
  openDelete: (id: string) => void
  closeDelete: () => void

  create: (values: RuleFormValues) => void
  update: (values: RuleFormValues) => void
  remove: () => void
  isCreating: boolean
  isUpdating: boolean
  isDeleting: boolean
}

export function useRoutingRules(serviceId: string): RoutingRulesState {
  const qc = useQueryClient()

  const [createOpen, setCreateOpen] = useState(false)
  const [editRule,   setEditRule]   = useState<RoutingRule | null>(null)
  const [deleteRule, setDeleteRule] = useState<RoutingRule | null>(null)

  const { data: rules = [], isLoading, isError } = useQuery({
    queryKey: routingKeys.list(serviceId),
    queryFn:  () => routingRulesApi.list(serviceId),
    staleTime: 10_000,
  })

  const invalidate = (): Promise<void> => qc.invalidateQueries({ queryKey: routingKeys.list(serviceId) })

  const createMutation = useMutation({
    mutationFn: (input: RuleFormValues) => routingRulesApi.create(serviceId, input),
    onSuccess: () => { void invalidate(); setCreateOpen(false) },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: RuleFormValues }) =>
      routingRulesApi.update(id, input),
    onSuccess: () => { void invalidate(); setEditRule(null) },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => routingRulesApi.delete(id),
    onSuccess: () => { void invalidate(); setDeleteRule(null) },
  })

  return {
    rules, isLoading, isError,
    createOpen, editRule, deleteRule,
    openCreate:  (): void => setCreateOpen(true),
    closeCreate: (): void => setCreateOpen(false),
    openEdit:    (rule): void => setEditRule(rule),
    closeEdit:   (): void => setEditRule(null),
    openDelete:  (id): void => setDeleteRule(rules.find(r => r.id === id) ?? null),
    closeDelete: (): void => setDeleteRule(null),
    create:  (values): void => createMutation.mutate(values),
    update:  (values): void => updateMutation.mutate({ id: editRule!.id, input: values }),
    remove:  (): void => deleteMutation.mutate(deleteRule!.id),
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  }
}
