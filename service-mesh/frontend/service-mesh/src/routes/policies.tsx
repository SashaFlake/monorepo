import { createFileRoute } from '@tanstack/react-router'
import { Header } from '@/components/layout/Header'
import { Card } from '@/components/ui/card'

export const Route = createFileRoute('/policies')({ component: PoliciesPage })

export function PoliciesPage() {
  return (
    <>
      <Header title="Policies" subtitle="Retry, timeout & access rules" />
      <main style={{ padding: 'var(--space-6)' }}>
        <Card style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 200, color: 'var(--color-text-faint)' }}>
          Policies — coming soon
        </Card>
      </main>
    </>
  )
}
