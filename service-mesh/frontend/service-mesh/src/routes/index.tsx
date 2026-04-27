import { createFileRoute } from '@tanstack/react-router'
import { RegistryDashboard } from '@/features/registry/RegistryDashboard'

export const Route = createFileRoute('/')({ component: RegistryDashboard })
