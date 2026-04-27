import { Trash2 } from 'lucide-react'
import type { RoutingRule } from '../types/routing'

type Props = {
  rule: RoutingRule
  isPending: boolean
  onConfirm: () => void
  onCancel: () => void
}

export const DeleteRuleDialog = ({ rule, isPending, onConfirm, onCancel }: Props) => {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel()
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        aria-describedby="dialog-desc"
        className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl dark:bg-neutral-900"
      >
        <div className="mb-4 flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
            <Trash2 className="size-5 text-red-600 dark:text-red-400" />
          </div>
          <h2
            id="dialog-title"
            className="text-base font-semibold text-neutral-900 dark:text-neutral-100"
          >
            Удалить правило?
          </h2>
        </div>

        <p
          id="dialog-desc"
          className="mb-6 text-sm text-neutral-600 dark:text-neutral-400"
        >
          Вы собираетесь удалить правило{' '}
          <span className="font-medium text-neutral-900 dark:text-neutral-100">
            {rule.version}
          </span>{' '}
          с весом{' '}
          <span className="font-medium text-neutral-900 dark:text-neutral-100">
            {rule.weightPct}%
          </span>
          . Это действие необратимо.
        </p>

        <div className="flex justify-end gap-2">
          <button
            onClick={onCancel}
            disabled={isPending}
            className="rounded-lg border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50 disabled:opacity-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
          >
            Отмена
          </button>
          <button
            onClick={onConfirm}
            disabled={isPending}
            aria-busy={isPending}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:opacity-50"
          >
            {isPending ? 'Удаление…' : 'Удалить'}
          </button>
        </div>
      </div>
    </div>
  )
}
