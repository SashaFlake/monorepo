import { Header } from '@/components/layout/Header'
import { Card } from '@/components/ui/card'
import { useRegistryStats } from './useRegistryStats'
import { StatsGrid } from './StatsGrid'
import { ServicesTable } from './ServicesTable'
import s from './RegistryDashboard.module.css'

export function RegistryDashboard() {
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

        <ServicesTable services={services} isLoading={isLoading} />
      </main>
    </>
  )
}
