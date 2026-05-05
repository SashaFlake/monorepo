import { useMutation, useQueryClient } from '@tanstack/react-query'
import { routingRulesApi, routingKeys } from '../api/api'
import type { RuleFormValues } from './types'
import type { RoutingRulesUIState } from './useRoutingRulesUI'

export type RoutingRulesMutations = {
  create:     (values: RuleFormValues) => void
  update:     (values: RuleFormValues) => void
  remove:     () => void
  isCreating: boolean
  isUpdating: boolean
  isDeleting: boolean
}

export function useRoutingRulesMutations(
  serviceId: string,
  ui: Pick<RoutingRulesUIState, 'editRule' | 'deleteRule' | 'closeCreate' | 'closeEdit' | 'closeDelete'>,
): RoutingRulesMutations {
  const qc = useQueryClient()

  const invalidate = (): Promise<void> =>
    qc.invalidateQueries({ queryKey: routingKeys.list(serviceId) })

  const createMutation = useMutation({
    mutationFn: (input: RuleFormValues) => routingRulesApi.create(serviceId, input),
    onSettled:  () => { void invalidate() },
    onSuccess:  () => ui.closeCreate(),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: RuleFormValues }) =>
      routingRulesApi.update(id, input),
    onSettled: () => { void invalidate() },
    onSuccess: () => ui.closeEdit(),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => routingRulesApi.delete(id),
    onSettled:  () => { void invalidate() },
    onSuccess:  () => ui.closeDelete(),
  })

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
