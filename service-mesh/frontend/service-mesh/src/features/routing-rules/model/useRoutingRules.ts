import { useQuery } from '@tanstack/react-query'
import { routingRulesApi, routingKeys } from '../api/api'
import { useRoutingRulesUI } from './useRoutingRulesUI'
import { useRoutingRulesMutations } from './useRoutingRulesMutations'
import type { RoutingRulesUIState } from './useRoutingRulesUI'
import type { RoutingRulesMutations } from './useRoutingRulesMutations'
import type { RoutingRule } from './types'

export type RoutingRulesState =
  & { rules: RoutingRule[]; isLoading: boolean; isError: boolean }
  & RoutingRulesUIState
  & RoutingRulesMutations

export function useRoutingRules(serviceId: string): RoutingRulesState {
  const ui   = useRoutingRulesUI()
  const crud = useRoutingRulesMutations(serviceId, ui)

  const { data: rules = [], isLoading, isError } = useQuery({
    queryKey: routingKeys.list(serviceId),
    queryFn:  () => routingRulesApi.list(serviceId),
    staleTime: 10_000,
  })

  return {
    rules,
    isLoading,
    isError,
    ...ui,
    ...crud,
  }
}
