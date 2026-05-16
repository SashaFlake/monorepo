import { ReactElement } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Header } from '@/components/layout/Header'
import { Card } from '@/shared/ui'
import { useRegistryStats } from './useRegistryStats'
import { StatsGrid } from './StatsGrid'
import { ServicesTable } from './ServicesTable'
import s from './RegistryDashboard.module.css'

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
