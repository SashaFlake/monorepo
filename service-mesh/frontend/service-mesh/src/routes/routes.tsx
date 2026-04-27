import { createFileRoute } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Trash2, Plus, GitBranch } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { Card } from '@/components/ui/card'
import { registryApi, registryKeys, type RoutingRule } from '@/lib/api'

export const Route = createFileRoute('/routes')({ component: RoutesPage })

// ---------------------------------------------------------------------------
// Styles helpers
// ---------------------------------------------------------------------------

const thStyle: React.CSSProperties = {
  padding: 'var(--space-3) var(--space-4)',
  color: 'var(--color-text-muted)',
  fontWeight: 500,
  fontSize: 'var(--text-xs)',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  textAlign: 'left',
  whiteSpace: 'nowrap',
}

const tdStyle: React.CSSProperties = {
  padding: 'var(--space-3) var(--space-4)',
  fontSize: 'var(--text-sm)',
  verticalAlign: 'middle',
}

// ---------------------------------------------------------------------------
// Delete confirmation dialog
// ---------------------------------------------------------------------------

function DeleteDialog({
  rule,
  onConfirm,
  onCancel,
  isPending,
}: {
  rule: RoutingRule
  onConfirm: () => void
  onCancel: () => void
  isPending: boolean
}) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-dialog-title"
      aria-describedby="delete-dialog-desc"
      style={{
        position: 'fixed', inset: 0, zIndex: 50,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'oklch(0 0 0 / 0.45)',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onCancel() }}
    >
      <div style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        padding: 'var(--space-6)',
        width: 'min(400px, calc(100vw - var(--space-8)))',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-4)',
        boxShadow: 'var(--shadow-lg)',
      }}>
        <h2
          id="delete-dialog-title"
          style={{ fontSize: 'var(--text-lg)', fontWeight: 600, margin: 0 }}
        >
          Delete routing rule?
        </h2>
        <p
          id="delete-dialog-desc"
          style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', margin: 0 }}
        >
          Rule <strong style={{ color: 'var(--color-text)', fontFamily: 'monospace' }}>{rule.name}</strong> will be
          permanently deleted. Traffic currently routed by this rule will fall back to default behaviour.
        </p>
        <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end' }}>
          <button
            onClick={onCancel}
            disabled={isPending}
            style={{
              padding: 'var(--space-2) var(--space-4)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)',
              fontSize: 'var(--text-sm)',
              background: 'var(--color-surface-offset)',
              color: 'var(--color-text)',
              cursor: isPending ? 'not-allowed' : 'pointer',
              opacity: isPending ? 0.6 : 1,
            }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isPending}
            style={{
              padding: 'var(--space-2) var(--space-4)',
              borderRadius: 'var(--radius-md)',
              border: 'none',
              fontSize: 'var(--text-sm)',
              background: 'var(--color-error)',
              color: '#fff',
              cursor: isPending ? 'not-allowed' : 'pointer',
              opacity: isPending ? 0.7 : 1,
            }}
          >
            {isPending ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Destinations pill list
// ---------------------------------------------------------------------------

function Destinations({ destinations }: { destinations: RoutingRule['destinations'] }) {
  return (
    <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
      {destinations.map((d) => (
        <span
          key={d.serviceId}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 'var(--space-1)',
            fontSize: 'var(--text-xs)',
            fontFamily: 'monospace',
            background: 'var(--color-surface-offset)',
            padding: '2px 8px',
            borderRadius: 'var(--radius-full)',
            color: 'var(--color-text-muted)',
            whiteSpace: 'nowrap',
          }}
        >
          {d.serviceId}
          <span style={{
            background: 'var(--color-primary-highlight)',
            color: 'var(--color-primary)',
            borderRadius: 'var(--radius-full)',
            padding: '0 5px',
            fontWeight: 700,
          }}>
            {d.weightPct}%
          </span>
        </span>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      textAlign: 'center', padding: 'var(--space-16) var(--space-8)',
      color: 'var(--color-text-muted)',
    }}>
      <GitBranch size={40} style={{ color: 'var(--color-text-faint)', marginBottom: 'var(--space-4)' }} strokeWidth={1.5} />
      <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 600, color: 'var(--color-text)', marginBottom: 'var(--space-2)' }}>
        No routing rules yet
      </h3>
      <p style={{ maxWidth: '36ch', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-6)' }}>
        Create a rule to split traffic between service versions or destinations.
      </p>
      <button
        onClick={onCreate}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2)',
          padding: 'var(--space-2) var(--space-4)',
          background: 'var(--color-primary)', color: '#fff',
          border: 'none', borderRadius: 'var(--radius-md)',
          fontSize: 'var(--text-sm)', fontWeight: 500, cursor: 'pointer',
        }}
      >
        <Plus size={14} /> Create rule
      </button>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export function RoutesPage() {
  const qc = useQueryClient()
  const [pendingDelete, setPendingDelete] = useState<RoutingRule | null>(null)

  const { data, isLoading, isError } = useQuery({
    queryKey: registryKeys.routingRules(),
    queryFn:  registryApi.listRoutingRules,
    refetchInterval: 15_000,
    staleTime: 5_000,
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => registryApi.deleteRoutingRule(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: registryKeys.routingRules() })
      setPendingDelete(null)
    },
  })

  const rules = data ?? []

  return (
    <>
      <Header
        title="Routes"
        subtitle="Traffic routing rules"
        action={
          rules.length > 0 ? (
            <button
              disabled
              title="Coming soon"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2)',
                padding: 'var(--space-2) var(--space-4)',
                background: 'var(--color-primary)', color: '#fff',
                border: 'none', borderRadius: 'var(--radius-md)',
                fontSize: 'var(--text-sm)', fontWeight: 500,
                cursor: 'not-allowed', opacity: 0.6,
              }}
            >
              <Plus size={14} /> Add rule
            </button>
          ) : null
        }
      />

      <main style={{ padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>

        {isError && (
          <Card style={{ color: 'var(--color-error)', fontSize: 'var(--text-sm)' }}>
            ⚠️ Could not load routing rules
          </Card>
        )}

        {isLoading && (
          <Card style={{ color: 'var(--color-text-faint)', fontSize: 'var(--text-sm)' }}>Loading…</Card>
        )}

        {!isLoading && !isError && rules.length === 0 && (
          <Card style={{ padding: 0 }}>
            <EmptyState onCreate={() => {}} />
          </Card>
        )}

        {!isLoading && !isError && rules.length > 0 && (
          <Card style={{ padding: 0, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <th style={thStyle}>Name</th>
                  <th style={thStyle}>Source</th>
                  <th style={thStyle}>Destinations</th>
                  <th style={thStyle}>Updated</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}></th>
                </tr>
              </thead>
              <tbody>
                {rules.map((rule, i) => (
                  <tr
                    key={rule.id}
                    style={{
                      borderBottom: i < rules.length - 1 ? '1px solid var(--color-divider)' : 'none',
                    }}
                  >
                    <td style={{ ...tdStyle, fontFamily: 'monospace', fontWeight: 600 }}>
                      {rule.name}
                    </td>
                    <td style={{ ...tdStyle, fontFamily: 'monospace', color: 'var(--color-text-muted)' }}>
                      {rule.sourceService}
                    </td>
                    <td style={tdStyle}>
                      <Destinations destinations={rule.destinations} />
                    </td>
                    <td style={{ ...tdStyle, color: 'var(--color-text-faint)', whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>
                      {new Date(rule.updatedAt).toLocaleString()}
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'right' }}>
                      <button
                        onClick={() => setPendingDelete(rule)}
                        aria-label={`Delete rule ${rule.name}`}
                        style={{
                          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                          width: 32, height: 32,
                          borderRadius: 'var(--radius-md)',
                          border: 'none',
                          background: 'transparent',
                          color: 'var(--color-text-faint)',
                          cursor: 'pointer',
                          transition: 'color var(--transition-interactive), background var(--transition-interactive)',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = 'var(--color-error)'
                          e.currentTarget.style.background = 'var(--color-error-highlight)'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = 'var(--color-text-faint)'
                          e.currentTarget.style.background = 'transparent'
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}
      </main>

      {pendingDelete && (
        <DeleteDialog
          rule={pendingDelete}
          isPending={deleteMutation.isPending}
          onConfirm={() => deleteMutation.mutate(pendingDelete.id)}
          onCancel={() => setPendingDelete(null)}
        />
      )}
    </>
  )
}
