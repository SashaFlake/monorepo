import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useUIStore } from '@/store/ui'
import { routingRulesApi, routingKeys } from '../infrastructure/api.infrastructure'
import type { RoutingRule, RuleFormValues } from '../domain/routing-rules.types'

/**
 * Combined server + UI state returned by {@link useRoutingRules}.
 */
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

  createError: Error | null
  updateError: Error | null
}

/**
 * Application hook that loads routing rules for a service and exposes
 * create/update/delete mutations plus modal visibility state.
 *
 * UI state is read from the global Zustand store ({@link useUIStore}) so
 * that the application layer only orchestrates server state.
 *
 * @param serviceId - Identifier of the service whose rules should be loaded
 * @returns Combined server and UI state (see {@link RoutingRulesState})
 * @sideEffects Subscribes to a TanStack Query observer and performs HTTP
 *              requests. Modal state is mutated via the Zustand store.
 */
export function useRoutingRules(serviceId: string): RoutingRulesState {
  const qc = useQueryClient()
  const ui = useUIStore()

  const { data: rules = [], isLoading, isError } = useQuery({
    queryKey: routingKeys.list(serviceId),
    queryFn:  () => routingRulesApi.list(serviceId),
    staleTime: 10_000,
  })

  const invalidate = (): Promise<void> => qc.invalidateQueries({ queryKey: routingKeys.list(serviceId) })

  const createMutation = useMutation({
    mutationFn: (input: RuleFormValues) => routingRulesApi.create(serviceId, input),
    onSuccess: () => { void invalidate(); ui.closeRoutingRulesCreate() },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: RuleFormValues }) =>
      routingRulesApi.update(id, input),
    onSuccess: () => { void invalidate(); ui.closeRoutingRulesEdit() },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => routingRulesApi.delete(id),
    onSuccess: () => { void invalidate(); ui.closeRoutingRulesDelete() },
  })

  return {
    rules, isLoading, isError,
    createOpen: ui.routingRulesCreateOpen,
    editRule: ui.routingRulesEditRule,
    deleteRule: ui.routingRulesDeleteRule,
    openCreate: ui.openRoutingRulesCreate,
    closeCreate: ui.closeRoutingRulesCreate,
    openEdit: ui.openRoutingRulesEdit,
    closeEdit: ui.closeRoutingRulesEdit,
    openDelete: (id): void => {
      const rule = rules.find(r => r.id === id) ?? null
      if (rule) ui.openRoutingRulesDelete(rule)
    },
    closeDelete: ui.closeRoutingRulesDelete,
    create:  (values): void => createMutation.mutate(values),
    update:  (values): void => {
      if (!ui.routingRulesEditRule) return
      updateMutation.mutate({ id: ui.routingRulesEditRule.id, input: values })
    },
    remove:  (): void => {
      if (!ui.routingRulesDeleteRule) return
      deleteMutation.mutate(ui.routingRulesDeleteRule.id)
    },
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    createError: createMutation.error,
    updateError: updateMutation.error,
  }
}
