import { Trash2 } from 'lucide-react'
import type { RoutingRule } from '../types/routing'
import s from './DeleteRuleDialog.module.css'

type Props = {
  rule: RoutingRule
  isPending: boolean
  onConfirm: () => void
  onCancel: () => void
}

export const DeleteRuleDialog = ({ rule, isPending, onConfirm, onCancel }: Props) => {
  return (
    <div
      className={s.overlay}
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel()
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        aria-describedby="dialog-desc"
        className={s.dialog}
      >
        <div className={s.header}>
          <div className={s.iconWrap}>
            <Trash2 size={20} />
          </div>
          <h2 id="dialog-title" className={s.title}>
            Удалить правило?
          </h2>
        </div>

        <p id="dialog-desc" className={s.description}>
          Вы собираетесь удалить правило{' '}
          <span className={s.highlight}>{rule.version}</span>{' '}
          с весом{' '}
          <span className={s.highlight}>{rule.weightPct}%</span>.
          Это действие необратимо.
        </p>

        <div className={s.actions}>
          <button
            onClick={onCancel}
            disabled={isPending}
            className={s.btnCancel}
          >
            Отмена
          </button>
          <button
            onClick={onConfirm}
            disabled={isPending}
            aria-busy={isPending}
            className={s.btnConfirm}
          >
            {isPending ? 'Удаление…' : 'Удалить'}
          </button>
        </div>
      </div>
    </div>
  )
}
