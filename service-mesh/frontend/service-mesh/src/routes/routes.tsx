import { createFileRoute } from '@tanstack/react-router'
import { Header } from '@/components/layout/Header'
import { Card } from '@/components/ui/card'

export const Route = createFileRoute('/routes')({ component: RoutesPage })

export function RoutesPage() {
  return (
    <>
      <Header title="Routes" subtitle="Traffic routing rules" />
      <main style={{ padding: 'var(--space-6)' }}>
        <Card style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 200, color: 'var(--color-text-faint)' }}>
          Routes — coming soon
        </Card>
      </main>
    </>
  )
}
