import { useState } from 'react'
import { Trash2, Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { RoutingRule } from '../model/types'
import { DeleteRuleDialog } from './DeleteRuleDialog'

type Props = {
  rules: RoutingRule[]
  onEdit: (rule: RoutingRule) => void
  onDelete: (id: string) => void
  isPending?: boolean
}

export function RulesTable({ rules, onEdit, onDelete, isPending = false }: Props) {
  const [ruleToDelete, setRuleToDelete] = useState<RoutingRule | null>(null)

  if (rules.length === 0) {
    return (
      <div
        role="status"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 'var(--space-16) var(--space-8)',
          border: '1px dashed var(--color-border)',
          borderRadius: 'var(--radius-xl)',
          textAlign: 'center',
        }}
      >
        <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>
          Нет правил маршрутизации
        </p>
        <p style={{ color: 'var(--color-text-faint)', fontSize: 'var(--text-xs)', marginTop: 'var(--space-1)' }}>
          Создайте первое правило
        </p>
      </div>
    )
  }

  return (
    <>
      <div style={{ overflowX: 'auto', borderRadius: 'var(--radius-xl)', border: '1px solid var(--color-border)' }}>
        <table
          aria-label="Routing rules"
          style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-sm)' }}
        >
          <thead>
            <tr style={{ borderBottom: '1px solid var(--color-divider)', background: 'var(--color-surface-offset)' }}>
              {(['Name', 'Priority', 'Match', 'Destinations', '']).map((col) => (
                <th
                  key={col}
                  scope="col"
                  style={{
                    padding: 'var(--space-3) var(--space-4)',
                    textAlign: 'left',
                    fontSize: 'var(--text-xs)',
                    fontWeight: 500,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: 'var(--color-text-muted)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {col || <span className="sr-only">Действия</span>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rules.map((rule) => (
              <tr
                key={rule.id}
                style={{
                  borderBottom: '1px solid var(--color-divider)',
                  background: 'var(--color-surface)',
                  transition: 'background var(--transition-interactive)',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-surface-offset)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--color-surface)')}
              >
                <td style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 500, color: 'var(--color-text)' }}>
                  {rule.name}
                </td>
                <td style={{ padding: 'var(--space-3) var(--space-4)', fontVariantNumeric: 'tabular-nums', color: 'var(--color-text-muted)' }}>
                  {rule.priority}
                </td>
                <td style={{ padding: 'var(--space-3) var(--space-4)', fontFamily: 'monospace', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                  {rule.match.pathPrefix ?? '—'}
                </td>
                <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                  <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                    {rule.destinations.map((d, i) => (
                      <span
                        key={i}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 'var(--space-1)',
                          padding: '2px var(--space-2)',
                          borderRadius: 'var(--radius-full)',
                          background: 'var(--color-primary-highlight)',
                          color: 'var(--color-primary)',
                          fontSize: 'var(--text-xs)',
                          fontWeight: 500,
                        }}
                      >
                        {d.version ?? 'default'} {d.weightPct}%
                      </span>
                    ))}
                  </div>
                </td>
                <td style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'right' }}>
                  <div style={{ display: 'flex', gap: 'var(--space-1)', justifyContent: 'flex-end' }}>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Редактировать правило ${rule.name}`}
                      onClick={() => onEdit(rule)}
                    >
                      <Pencil size={16} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Удалить правило ${rule.name}`}
                      onClick={() => setRuleToDelete(rule)}
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {ruleToDelete && (
        <DeleteRuleDialog
          rule={ruleToDelete}
          isPending={isPending}
          onConfirm={() => {
            onDelete(ruleToDelete.id)
            setRuleToDelete(null)
          }}
          onCancel={() => setRuleToDelete(null)}
        />
      )}
    </>
  )
}
