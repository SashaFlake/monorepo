import { createFileRoute } from '@tanstack/react-router'
import { ServiceDetailPage } from '@/features/services'

/**
 * Route definition for `/services/$serviceId`.
 *
 * Renders the detail page for the selected service.
 */
export const Route = createFileRoute('/services/$serviceId')({
  component: function ServiceDetailRoute() {
    const { serviceId } = Route.useParams()
    return <ServiceDetailPage serviceId={serviceId} />
  },
})
