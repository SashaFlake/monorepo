import { createFileRoute } from '@tanstack/react-router'
import { RegistryDashboard } from '@/features/registry'

export const Route = createFileRoute('/')({ component: RegistryDashboard })
