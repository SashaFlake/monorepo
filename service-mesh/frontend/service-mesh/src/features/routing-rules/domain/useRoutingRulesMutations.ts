import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { routingRulesApi, routingKeys } from '../infrastructure/api'
import type { RuleFormValues } from './types'
import type { RoutingRulesUIState } from './useRoutingRulesUI'

/**
 * Create/update/delete mutations exposed by {@link useRoutingRulesMutations}.
 *
 * @deprecated This type belongs to the application layer and will move out
 *             of `domain/` during the pending architectural refactor.
 */
export type RoutingRulesMutations = {
  /** Creates a new routing rule from form values. */
  create:     (values: RuleFormValues) => void

  /** Updates the rule currently held in `ui.editRule`. */
  update:     (values: RuleFormValues) => void

  /** Deletes the rule currently held in `ui.deleteRule`. */
  remove:     () => void

  /** Whether the create mutation is pending. */
  isCreating: boolean

  /** Whether the update mutation is pending. */
  isUpdating: boolean

  /** Whether the delete mutation is pending. */
  isDeleting: boolean
}

/**
 * Application hook that exposes create/update/delete mutations for routing
 * rules of a single service.
 *
 * @deprecated Located in `domain/` temporarily; should move to
 *             `application/useRoutingRulesMutations.application.ts`.
 * @param serviceId - Identifier of the service whose rules are mutated
 * @param ui        - Modal state helpers used to close dialogs on success
 * @returns Mutation callbacks and pending flags
 * @sideEffects Subscribes to three TanStack Query mutations, invalidates the
 *              rule list on settle, and shows Sonner toast notifications.
 */
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
    onSuccess:  () => {
      ui.closeCreate()
      toast.success('Routing rule created')
    },
    onError: () => {
      toast.error('Failed to create routing rule')
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: RuleFormValues }) =>
      routingRulesApi.update(id, input),
    onSettled: () => { void invalidate() },
    onSuccess: () => {
      ui.closeEdit()
      toast.success('Routing rule updated')
    },
    onError: () => {
      toast.error('Failed to update routing rule')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => routingRulesApi.delete(id),
    onSettled:  () => { void invalidate() },
    onSuccess:  () => {
      ui.closeDelete()
      toast.success('Routing rule deleted')
    },
    onError: () => {
      toast.error('Failed to delete routing rule')
    },
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
