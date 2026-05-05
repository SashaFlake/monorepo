import { ReactElement, ReactNode } from 'react'
import { Card } from './card'
import { Button } from './button'
import s from './ErrorCard.module.css'

interface ErrorCardProps {
  title?: string
  message: string
  onRetry?: () => void
  children?: ReactNode
}

export function ErrorCard({ title = 'Error', message, onRetry, children }: ErrorCardProps): ReactElement {
  return (
    <Card className={s.errorCard}>
      <div className={s.errorIcon}>⚠️</div>
      <div className={s.errorContent}>
        <div className={s.errorTitle}>{title}</div>
        <div className={s.errorMessage}>{message}</div>
        {children}
        {onRetry && (
          <Button onClick={onRetry} className={s.retryButton}>
            Retry
          </Button>
        )}
      </div>
    </Card>
  )
}
