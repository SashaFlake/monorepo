// ---------------------------------------------------------------------------
// DeleteConfirmDialog — подтверждение удаления правила
// ---------------------------------------------------------------------------

import type { RoutingRule } from './types'
import { Button } from '@/components/ui/button'

interface DeleteConfirmDialogProps {
  rule: RoutingRule
  isPending: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function DeleteConfirmDialog({ rule, isPending, onConfirm, onCancel }: DeleteConfirmDialogProps) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 50,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'oklch(from var(--color-bg) l c h / 0.7)',
      backdropFilter: 'blur(4px)',
    }}>
      <div style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-xl)',
        padding: 'var(--space-6)',
        width: '100%',
        maxWidth: 400,
        boxShadow: 'var(--shadow-lg)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-4)',
      }}>
        <div>
          <div style={{ fontWeight: 600, fontSize: 'var(--text-base)', marginBottom: 'var(--space-1)' }}>
            Удалить правило?
          </div>
          <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>
            Правило{' '}
            <span style={{ fontFamily: 'monospace', color: 'var(--color-text)' }}>{rule.name}</span>
            {' '}будет удалено без возможности восстановления.
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)' }}>
          <Button variant="ghost" onClick={onCancel} disabled={isPending}>Отмена</Button>
          <Button variant="danger" onClick={onConfirm} disabled={isPending}>
            {isPending ? 'Удаление…' : 'Удалить'}
          </Button>
        </div>
      </div>
    </div>
  )
}
