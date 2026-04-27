import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import type { RoutingRule } from '../types/routing'
import { DeleteRuleDialog } from './DeleteRuleDialog'
import s from './RulesTable.module.css'

type Props = {
  rules: RoutingRule[]
  onDelete: (id: string) => void
  isPending?: boolean
}

const statusLabel: Record<RoutingRule['status'], string> = {
  active: 'Активно',
  inactive: 'Неактивно',
}

export const RulesTable = ({ rules, onDelete, isPending = false }: Props) => {
  const [ruleToDelete, setRuleToDelete] = useState<RoutingRule | null>(null)

  if (rules.length === 0) {
    return (
      <div role="status" className={s.emptyState}>
        <p className={s.emptyTitle}>Нет правил маршрутизации</p>
        <p className={s.emptyHint}>Создайте первое правило</p>
      </div>
    )
  }

  return (
    <>
      <div className={s.wrapper}>
        <table aria-label="Routing rules" className={s.table}>
          <thead className={s.thead}>
            <tr>
              <th scope="col" className={s.th}>Версия</th>
              <th scope="col" className={s.th}>Вес, %</th>
              <th scope="col" className={s.th}>Статус</th>
              <th scope="col" className={s.thSrOnly}>
                <span className="sr-only">Действия</span>
              </th>
            </tr>
          </thead>
          <tbody className={s.tbody}>
            {rules.map((rule) => (
              <tr key={rule.id}>
                <td className={s.tdVersion}>{rule.version}</td>
                <td className={s.tdWeight}>{rule.weightPct}</td>
                <td className={s.td}>
                  <span className={s.badge} data-status={rule.status}>
                    {statusLabel[rule.status]}
                  </span>
                </td>
                <td className={s.tdActions}>
                  <button
                    aria-label={`Удалить правило ${rule.version}`}
                    onClick={() => setRuleToDelete(rule)}
                    className={s.deleteBtn}
                  >
                    <Trash2 size={16} />
                  </button>
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
