import { Header } from '@/components/layout/Header'
import { Card } from '@/components/ui/card'
import { useRegistryStats } from './useRegistryStats'
import { StatsGrid } from './StatsGrid'
import { ServicesTable } from './ServicesTable'

export function RegistryDashboard() {
  const { stats, services, isLoading, isError, updatedAt } = useRegistryStats()

  return (
    <>
      <Header
        title="Dashboard"
        subtitle={updatedAt ? `Updated ${updatedAt}` : 'Control Plane Overview'}
      />
      <main style={{ padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>

        <StatsGrid stats={stats} isLoading={isLoading} />

        {isError && (
          <Card style={{ borderColor: 'var(--color-error)', color: 'var(--color-error)', fontSize: 'var(--text-sm)' }}>
            ⚠️ Cannot reach registry — is the backend running?
          </Card>
        )}

        <ServicesTable services={services} isLoading={isLoading} />

      </main>
    </>
  )
}
