import { ReactElement } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Header } from '@/components/layout/Header'
import { Card } from '@/shared/ui'
import { useRegistryStats } from '../../application/useRegistryStats.application'
import { StatsGrid } from '../StatsGrid/StatsGrid'
import { ServicesTable } from '../ServicesTable/ServicesTable'
import s from './RegistryDashboard.module.css'

/**
 * Dashboard page for the Control Plane registry overview.
 *
 * Displays aggregate statistics, an error banner when the backend is
 * unreachable, and a clickable table of services that navigates to the
 * service detail page.
 *
 * @returns The dashboard page element
 * @sideEffects Calls {@link useRegistryStats} (TanStack Query subscription)
 *              and {@link useNavigate} (router side effect on row click).
 */
export function RegistryDashboard(): ReactElement {
  const navigate = useNavigate()
  const { stats, services, isLoading, isError, updatedAt } = useRegistryStats()

  return (
    <>
      <Header
        title="Dashboard"
        subtitle={updatedAt ? `Updated ${updatedAt}` : 'Control Plane Overview'}
      />
      <main className={s.main}>
        <StatsGrid stats={stats} isLoading={isLoading} />

        {isError && (
          <Card className={s.errorCard}>
            ⚠️ Cannot reach registry — is the backend running?
          </Card>
        )}

        <ServicesTable
          services={services}
          onRowClick={(svc) => {
            void navigate({ to: '/services/$serviceId', params: { serviceId: svc.id } })
          }}
        />
      </main>
    </>
  )
}
