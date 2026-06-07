import { createFileRoute } from '@tanstack/react-router'
import { ServicesPage } from '@/features/services'

/**
 * Index route for `/services/` that renders the services list page.
 */
export const Route = createFileRoute('/services/')({ component: ServicesPage })
