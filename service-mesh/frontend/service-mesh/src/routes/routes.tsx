import { createFileRoute } from '@tanstack/react-router'
import { RoutingRulesPage } from '@/features/routing-rules/RoutingRulesPage'

export const Route = createFileRoute('/routes')({
  component: function RoutingRulesRoute() {
    const { serviceId } = Route.useParams()
    return <RoutingRulesPage serviceId={serviceId} />
  },
})
