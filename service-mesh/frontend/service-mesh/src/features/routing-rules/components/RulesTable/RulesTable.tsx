import type { ReactElement } from 'react'
import { useState } from 'react'
import { Trash2, Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { RoutingRule } from '../../model/types'
import { DeleteRuleDialog } from '../DeleteRuleDialog/DeleteRuleDialog'
import styles from './RulesTable.module.css'

type Props = {
  rules: RoutingRule[]
  onEdit: (rule: RoutingRule) => void
  onDelete: (id: string) => void
  isPending?: boolean
}

export function RulesTable({ rules, onEdit, onDelete, isPending = false }: Props): ReactElement {
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const confirmRule = rules.find(r => r.id === confirmId)

  return (
    <>
      {rules.length === 0 ? (
        <div role="status" style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
          No routing rules yet. Click “New rule” to create one.
        </div>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
              {['Name', 'Priority', 'Match', 'Destinations', ''].map(h => (
                <th key={h} className={styles.th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rules.map(rule => (
              <tr key={rule.id} className={styles.row}>
                <td className={styles.td}>{rule.name}</td>
                <td className={`${styles.td} ${styles.tdMono}`}>{rule.priority}</td>
                <td className={`${styles.td} ${styles.tdMono}`}>{rule.match.pathPrefix ?? '—'}</td>
                <td className={styles.td}>
                  <div className={styles.destinations}>
                    {rule.destinations.map((d, i) => (
                      <span key={i} className={styles.destChip}>
                        {d.version || 'default'} {d.weightPct}%
                      </span>
                    ))}
                  </div>
                </td>
                <td className={`${styles.td} ${styles.tdActions}`}>
                  <Button variant="ghost" onClick={() => onEdit(rule)} aria-label={`Edit rule ${rule.name}`}>
                    <Pencil size={14} />
                  </Button>
                  <Button variant="ghost" onClick={() => setConfirmId(rule.id)} aria-label={`Delete rule ${rule.name}`}>
                    <Trash2 size={14} />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {confirmRule && (
        <DeleteRuleDialog
          rule={confirmRule}
          isPending={isPending}
          onConfirm={() => { onDelete(confirmRule.id); setConfirmId(null) }}
          onCancel={() => setConfirmId(null)}
        />
      )}
    </>
  )
}
