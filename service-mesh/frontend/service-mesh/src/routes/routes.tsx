import { createFileRoute } from '@tanstack/react-router'
import { RoutingRulesPage } from '@/features/routing-rules/RoutingRulesPage'

export const Route = createFileRoute('/routes')({
  component: RoutingRulesPage,
})
