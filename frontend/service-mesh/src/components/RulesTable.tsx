import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import type { RoutingRule } from '../types/routing'
import { DeleteRuleDialog } from './DeleteRuleDialog'

type Props = {
  rules: RoutingRule[]
  onDelete: (id: string) => void
  isPending?: boolean
}

const statusLabel: Record<RoutingRule['status'], string> = {
  active: 'Активно',
  inactive: 'Неактивно',
}

const statusClass: Record<RoutingRule['status'], string> = {
  active:
    'inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  inactive:
    'inline-flex items-center rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400',
}

export const RulesTable = ({ rules, onDelete, isPending = false }: Props) => {
  const [ruleToDelete, setRuleToDelete] = useState<RoutingRule | null>(null)

  if (rules.length === 0) {
    return (
      <div
        role="status"
        className="flex flex-col items-center justify-center rounded-xl border border-dashed border-neutral-200 py-16 text-center dark:border-neutral-700"
      >
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          Нет правил маршрутизации
        </p>
        <p className="mt-1 text-xs text-neutral-400 dark:text-neutral-600">
          Создайте первое правило
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="overflow-hidden rounded-xl border border-neutral-200 dark:border-neutral-700">
        <table
          aria-label="Routing rules"
          className="w-full text-sm"
        >
          <thead className="border-b border-neutral-200 bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800/50">
            <tr>
              <th
                scope="col"
                className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400"
              >
                Версия
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400"
              >
                Вес, %
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400"
              >
                Статус
              </th>
              <th scope="col" className="px-4 py-3">
                <span className="sr-only">Действия</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
            {rules.map((rule) => (
              <tr
                key={rule.id}
                className="bg-white transition hover:bg-neutral-50 dark:bg-neutral-900 dark:hover:bg-neutral-800/50"
              >
                <td className="px-4 py-3 font-mono font-medium text-neutral-900 dark:text-neutral-100">
                  {rule.version}
                </td>
                <td className="px-4 py-3 tabular-nums text-neutral-700 dark:text-neutral-300">
                  {rule.weightPct}
                </td>
                <td className="px-4 py-3">
                  <span className={statusClass[rule.status]}>
                    {statusLabel[rule.status]}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    aria-label={`Удалить правило ${rule.version}`}
                    onClick={() => setRuleToDelete(rule)}
                    className="inline-flex size-8 items-center justify-center rounded-lg text-neutral-400 transition hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                  >
                    <Trash2 className="size-4" />
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
