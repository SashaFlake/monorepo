import { createFileRoute } from '@tanstack/react-router'
import { Header } from '@/components/layout/Header'
import { Card } from '@/components/ui/card'

export const Route = createFileRoute('/nodes')({ component: NodesPage })

export function NodesPage() {
  return (
    <>
      <Header title="Nodes" subtitle="Connected data plane nodes" />
      <main style={{ padding: 'var(--space-6)' }}>
        <Card style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 200, color: 'var(--color-text-faint)' }}>
          Nodes — coming soon
        </Card>
      </main>
    </>
  )
}
