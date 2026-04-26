import { createFileRoute } from '@tanstack/react-router'
import { ServiceDetailPage } from '@/features/services/ServiceDetailPage'

export const Route = createFileRoute('/services/$serviceId')({
  component: function ServiceDetailRoute() {
    const { serviceId } = Route.useParams()
    return <ServiceDetailPage serviceId={serviceId} />
  },
})
