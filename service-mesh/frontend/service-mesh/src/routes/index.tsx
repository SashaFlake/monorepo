import { createFileRoute } from '@tanstack/react-router'
import { RegistryDashboard } from '@/features/registry'

/**
 * Root route `/` that renders the registry dashboard.
 */
export const Route = createFileRoute('/')({ component: RegistryDashboard })
