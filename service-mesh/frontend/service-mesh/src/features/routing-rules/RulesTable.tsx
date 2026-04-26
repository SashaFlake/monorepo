// ---------------------------------------------------------------------------
// RulesTable — список routing rules с WeightBar
// ---------------------------------------------------------------------------

import { Pencil, Trash2 } from 'lucide-react'
import type { RoutingRule } from './types'
import { WeightBar } from './WeightBar'

const thStyle: React.CSSProperties = {
  padding: 'var(--space-2) var(--space-4)',
  fontSize: 'var(--text-xs)',
  color: 'var(--color-text-muted)',
  fontWeight: 500,
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

interface RulesTableProps {
  rules: RoutingRule[]
  onEdit: (rule: RoutingRule) => void
  onDelete: (rule: RoutingRule) => void
}

export function RulesTable({ rules, onEdit, onDelete }: RulesTableProps) {
  if (rules.length === 0) {
    return (
      <div style={{
        textAlign: 'center',
        padding: 'var(--space-16) var(--space-8)',
        color: 'var(--color-text-faint)',
        fontSize: 'var(--text-sm)',
      }}>
        <div style={{ marginBottom: 'var(--space-2)', fontSize: 'var(--text-lg)' }}>🔀</div>
        <div style={{ fontWeight: 500, color: 'var(--color-text-muted)', marginBottom: 'var(--space-1)' }}>Нет правил маршрутизации</div>
        <div>Создайте первое правило, чтобы управлять трафиком</div>
      </div>
    )
  }

  return (
    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
      <thead>
        <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
          <th style={thStyle}>Название</th>
          <th style={thStyle}>Match</th>
          <th style={thStyle}>Upstreams</th>
          <th style={{ ...thStyle, width: 80 }}></th>
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
            {/* Название */}
            <td style={{ ...tdStyle, fontFamily: 'monospace', fontWeight: 500 }}>
              {rule.name}
            </td>

            {/* Match */}
            <td style={{ ...tdStyle, color: 'var(--color-text-muted)' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                {rule.match.host && (
                  <span style={{ fontSize: 'var(--text-xs)', fontFamily: 'monospace' }}>
                    <span style={{ color: 'var(--color-text-faint)' }}>host: </span>{rule.match.host}
                  </span>
                )}
                {rule.match.path && (
                  <span style={{ fontSize: 'var(--text-xs)', fontFamily: 'monospace' }}>
                    <span style={{ color: 'var(--color-text-faint)' }}>path: </span>{rule.match.path}
                  </span>
                )}
              </div>
            </td>

            {/* Upstreams + WeightBar */}
            <td style={{ ...tdStyle, minWidth: 200 }}>
              <WeightBar upstreams={rule.upstreams} />
            </td>

            {/* Actions */}
            <td style={tdStyle}>
              <div style={{ display: 'flex', gap: 'var(--space-1)', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => onEdit(rule)}
                  aria-label="Редактировать правило"
                  style={{ padding: 'var(--space-1)', color: 'var(--color-text-muted)', borderRadius: 'var(--radius-sm)', transition: 'color var(--transition-interactive), background var(--transition-interactive)' }}
                >
                  <Pencil size={14} />
                </button>
                <button
                  onClick={() => onDelete(rule)}
                  aria-label="Удалить правило"
                  style={{ padding: 'var(--space-1)', color: 'var(--color-text-muted)', borderRadius: 'var(--radius-sm)', transition: 'color var(--transition-interactive), background var(--transition-interactive)' }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
