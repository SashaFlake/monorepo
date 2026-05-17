import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { routingRulesApi, routingKeys } from '../infrastructure/api'
import type { RoutingRule, RuleFormValues } from './types'
import { Destination } from './types'
import type { RoutingRulesUIState } from './useRoutingRulesUI'

export type RoutingRulesMutations = {
  create:     (values: RuleFormValues) => void
  update:     (values: RuleFormValues) => void
  remove:     () => void
  isCreating: boolean
  isUpdating: boolean
  isDeleting: boolean
}

// ── Optimistic helpers ────────────────────────────────────────────────────────

/** Build a temporary RoutingRule from form values for optimistic insert/update. */
const toOptimisticRule = (
  id: string,
  serviceId: string,
  values: RuleFormValues,
): RoutingRule => ({
  id,
  serviceId,
  name:         values.name,
  priority:     values.priority,
  match:        values.match,
  destinations: values.destinations.map(Destination.unsafe),
  createdAt:    new Date().toISOString(),
  updatedAt:    new Date().toISOString(),
})

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useRoutingRulesMutations(
  serviceId: string,
  ui: Pick<RoutingRulesUIState, 'editRule' | 'deleteRule' | 'closeCreate' | 'closeEdit' | 'closeDelete'>,
): RoutingRulesMutations {
  const qc = useQueryClient()
  const listKey = routingKeys.list(serviceId)

  const invalidate = (): Promise<void> =>
    qc.invalidateQueries({ queryKey: listKey })

  // ── Create ─────────────────────────────────────────────────────────────────

  const createMutation = useMutation({
    mutationFn: (input: RuleFormValues) => routingRulesApi.create(serviceId, input),

    onMutate: async (input) => {
      await qc.cancelQueries({ queryKey: listKey })
      const previous = qc.getQueryData<RoutingRule[]>(listKey)

      // Temporary ID — will be replaced when the server responds and we invalidate.
      const optimistic = toOptimisticRule(`optimistic-${Date.now()}`, serviceId, input)
      qc.setQueryData<RoutingRule[]>(listKey, (old = []) => [...old, optimistic])

      return { previous }
    },

    onError: (_err, _input, ctx) => {
      if (ctx?.previous !== undefined) {
        qc.setQueryData(listKey, ctx.previous)
      }
      toast.error('Failed to create routing rule')
    },

    onSuccess: () => {
      ui.closeCreate()
      toast.success('Routing rule created')
    },

    onSettled: () => { void invalidate() },
  })

  // ── Update ─────────────────────────────────────────────────────────────────

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: RuleFormValues }) =>
      routingRulesApi.update(id, input),

    onMutate: async ({ id, input }) => {
      await qc.cancelQueries({ queryKey: listKey })
      const previous = qc.getQueryData<RoutingRule[]>(listKey)

      qc.setQueryData<RoutingRule[]>(listKey, (old = []) =>
        old.map(r => r.id === id ? toOptimisticRule(id, r.serviceId, input) : r),
      )

      return { previous }
    },

    onError: (_err, _vars, ctx) => {
      if (ctx?.previous !== undefined) {
        qc.setQueryData(listKey, ctx.previous)
      }
      toast.error('Failed to update routing rule')
    },

    onSuccess: () => {
      ui.closeEdit()
      toast.success('Routing rule updated')
    },

    onSettled: () => { void invalidate() },
  })

  // ── Delete ─────────────────────────────────────────────────────────────────

  const deleteMutation = useMutation({
    mutationFn: (id: string) => routingRulesApi.delete(id),

    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: listKey })
      const previous = qc.getQueryData<RoutingRule[]>(listKey)

      qc.setQueryData<RoutingRule[]>(listKey, (old = []) => old.filter(r => r.id !== id))

      return { previous }
    },

    onError: (_err, _id, ctx) => {
      if (ctx?.previous !== undefined) {
        qc.setQueryData(listKey, ctx.previous)
      }
      toast.error('Failed to delete routing rule')
    },

    onSuccess: () => {
      ui.closeDelete()
      toast.success('Routing rule deleted')
    },

    onSettled: () => { void invalidate() },
  })

  // ── Return ─────────────────────────────────────────────────────────────────

  return {
    create: (values): void => {
      createMutation.mutate(values)
    },
    update: (values): void => {
      if (!ui.editRule) return
      updateMutation.mutate({ id: ui.editRule.id, input: values })
    },
    remove: (): void => {
      if (!ui.deleteRule) return
      deleteMutation.mutate(ui.deleteRule.id)
    },
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  }
}
