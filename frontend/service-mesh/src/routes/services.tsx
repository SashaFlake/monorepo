import { createFileRoute } from '@tanstack/react-router'
import { Header } from '@/components/layout/Header'
import { Card } from '@/components/ui/card'

export const Route = createFileRoute('/services')({ component: ServicesPage })

export function ServicesPage() {
  return (
    <>
      <Header title="Services" subtitle="Registered services & instances" />
      <main style={{ padding: 'var(--space-6)' }}>
        <Card style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 200, color: 'var(--color-text-faint)' }}>
          Services — coming soon
        </Card>
      </main>
    </>
  )
}
