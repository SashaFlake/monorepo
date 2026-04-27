import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'
import type { RoutingRule } from '../model/types'

interface DeleteRuleDialogProps {
  rule: RoutingRule
  isPending: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function DeleteRuleDialog({ rule, isPending, onConfirm, onCancel }: DeleteRuleDialogProps) {
  return (
    <div
      style={backdropStyle}
      onClick={onCancel}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-desc"
        style={dialogStyle}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 40,
            height: 40,
            borderRadius: 'var(--radius-full)',
            background: 'var(--color-error-highlight)',
            flexShrink: 0,
          }}>
            <Trash2 size={18} color="var(--color-error)" />
          </div>
          <h2
            id="delete-dialog-title"
            style={{ fontSize: 'var(--text-base)', fontWeight: 600, color: 'var(--color-text)', margin: 0 }}
          >
            Удалить правило?
          </h2>
        </div>

        <p
          id="delete-dialog-desc"
          style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', marginBottom: 'var(--space-6)' }}
        >
          Вы собираетесь удалить правило{' '}
          <strong style={{ color: 'var(--color-text)' }}>"{rule.name}"</strong>.
          {' '}Это действие уберёт правило из маршрутизации трафика.
        </p>

        <div style={actionsStyle}>
          <Button variant="ghost" onClick={onCancel} disabled={isPending}>
            Отмена
          </Button>
          <Button
            variant="danger"
            onClick={onConfirm}
            disabled={isPending}
            aria-busy={isPending}
          >
            {isPending ? 'Удаление…' : 'Удалить'}
          </Button>
        </div>
      </div>
    </div>
  )
}

const backdropStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: 50,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'oklch(from var(--color-bg) l c h / 0.7)',
  backdropFilter: 'blur(4px)',
  padding: 'var(--space-4)',
}

const dialogStyle: React.CSSProperties = {
  width: '100%',
  maxWidth: 480,
  background: 'var(--color-surface)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-xl)',
  boxShadow: 'var(--shadow-lg)',
  padding: 'var(--space-6)',
}

const actionsStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
  gap: 'var(--space-2)',
  paddingTop: 'var(--space-4)',
  borderTop: '1px solid var(--color-divider)',
}
