import { useState } from 'react'
import { Trash2, Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { RoutingRule } from '../model/types'
import { DeleteRuleDialog } from './DeleteRuleDialog'
import styles from './RulesTable.module.css'

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
      <div role="status" className={styles.empty}>
        <p className={styles.emptyTitle}>Нет правил маршрутизации</p>
        <p className={styles.emptyHint}>Создайте первое правило</p>
      </div>
    )
  }

  return (
    <>
      <div className={styles.tableWrap}>
        <table className={styles.table} aria-label="Routing rules">
          <thead className={styles.thead}>
            <tr>
              <th className={styles.th} scope="col">Name</th>
              <th className={styles.th} scope="col">Priority</th>
              <th className={styles.th} scope="col">Match</th>
              <th className={styles.th} scope="col">Destinations</th>
              <th className={styles.th} scope="col"><span className="sr-only">Действия</span></th>
            </tr>
          </thead>
          <tbody>
            {rules.map(rule => (
              <tr key={rule.id} className={styles.tr}>
                <td className={`${styles.td} ${styles.tdName}`}>{rule.name}</td>
                <td className={`${styles.td} ${styles.tdPriority}`}>{rule.priority}</td>
                <td className={`${styles.td} ${styles.tdMatch}`}>{rule.match.pathPrefix ?? '—'}</td>
                <td className={styles.td}>
                  <div className={styles.badges}>
                    {rule.destinations.map((d, i) => (
                      <span key={i} className={styles.badge}>
                        {d.version ?? 'default'} {d.weightPct}%
                      </span>
                    ))}
                  </div>
                </td>
                <td className={`${styles.td} ${styles.tdActions}`}>
                  <div className={styles.actionBtns}>
                    <Button
                      variant="ghost"
                      aria-label={`Редактировать правило ${rule.name}`}
                      onClick={() => onEdit(rule)}
                    >
                      <Pencil size={16} />
                    </Button>
                    <Button
                      variant="ghost"
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
