import { createFileRoute } from '@tanstack/react-router'
import { Header } from '@/components/layout/Header'
import { Card } from '@/components/ui/card'

export const Route = createFileRoute('/revisions')({ component: RevisionsPage })

export function RevisionsPage() {
  return (
    <>
      <Header title="Revisions" subtitle="Config history & publish lifecycle" />
      <main style={{ padding: 'var(--space-6)' }}>
        <Card style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 200, color: 'var(--color-text-faint)' }}>
          Revisions — coming soon
        </Card>
      </main>
    </>
  )
}
