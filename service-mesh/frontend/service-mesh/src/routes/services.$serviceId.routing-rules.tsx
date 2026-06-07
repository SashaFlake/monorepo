import { createFileRoute } from '@tanstack/react-router'
import { RoutingRulesPage } from '@/features/routing-rules'

/**
 * Route definition for `/services/$serviceId/routing-rules`.
 *
 * Renders the routing rules management page for the selected service.
 */
export const Route = createFileRoute('/services/$serviceId/routing-rules')({
  component: function RoutingRulesRoute() {
    const { serviceId } = Route.useParams()
    return <RoutingRulesPage serviceId={serviceId} />
  },
})
