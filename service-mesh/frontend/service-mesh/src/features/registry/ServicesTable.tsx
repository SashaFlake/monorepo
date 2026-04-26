import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { ServiceView, InstanceStatus } from '@/lib/api'

const STATUS_VARIANT: Record<InstanceStatus, 'success' | 'warning' | 'error'> = {
  passing:  'success',
  warning:  'warning',
  critical: 'error',
}

const thStyle: React.CSSProperties = {
  padding: 'var(--space-2) var(--space-4)',
  textAlign: 'left',
  fontSize: 'var(--text-xs)',
  color: 'var(--color-text-muted)',
  fontWeight: 500,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
}

const tdStyle: React.CSSProperties = {
  padding: 'var(--space-3) var(--space-4)',
}

interface ServicesTableProps {
  services: ServiceView[]
  isLoading: boolean
}

export function ServicesTable({ services, isLoading }: ServicesTableProps) {
  return (
    <Card style={{ padding: 0 }}>
      <div style={{
        padding: 'var(--space-4)',
        borderBottom: '1px solid var(--color-border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <h2 style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>Services</h2>
        {isLoading && (
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-faint)' }}>loading…</span>
        )}
      </div>

      {!isLoading && services.length === 0 ? (
        <div style={{
          padding: 'var(--space-12)',
          textAlign: 'center',
          color: 'var(--color-text-faint)',
          fontSize: 'var(--text-sm)',
        }}>
          No services registered yet.
        </div>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
              <th style={thStyle}>Name</th>
              <th style={thStyle}>Labels</th>
              <th style={thStyle}>Instances</th>
              <th style={thStyle}>Status</th>
            </tr>
          </thead>
          <tbody>
            {services.map((svc, i) => (
              <tr
                key={svc.id}
                style={{ borderBottom: i < services.length - 1 ? '1px solid var(--color-divider)' : 'none' }}
              >
                <td style={{ ...tdStyle, fontFamily: 'monospace', fontSize: 'var(--text-sm)' }}>
                  {svc.name}
                </td>
                <td style={tdStyle}>
                  <div style={{ display: 'flex', gap: 'var(--space-1)', flexWrap: 'wrap' }}>
                    {Object.entries(svc.labels).map(([k, v]) => (
                      <span key={k} style={{
                        fontSize: 'var(--text-xs)',
                        fontFamily: 'monospace',
                        background: 'var(--color-surface-offset)',
                        padding: '2px 6px',
                        borderRadius: 'var(--radius-sm)',
                        color: 'var(--color-text-muted)',
                      }}>{k}={v}</span>
                    ))}
                  </div>
                </td>
                <td style={{ ...tdStyle, color: 'var(--color-text-muted)', fontVariantNumeric: 'tabular-nums', fontSize: 'var(--text-sm)' }}>
                  {svc.instances.length}
                </td>
                <td style={tdStyle}>
                  <Badge variant={STATUS_VARIANT[svc.worstStatus]}>{svc.worstStatus}</Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Card>
  )
}
