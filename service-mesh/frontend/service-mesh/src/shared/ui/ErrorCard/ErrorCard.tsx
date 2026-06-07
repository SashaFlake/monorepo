import { ReactElement, ReactNode } from 'react'
import { Card } from '../Card'
import { Button } from '../Button'
import s from './ErrorCard.module.css'

/**
 * Props for {@link ErrorCard}.
 */
interface ErrorCardProps {
  /** Optional card heading. Defaults to "Error". */
  title?: string

  /** Primary error message. */
  message: string

  /** Called when the user presses the Retry button. */
  onRetry?: () => void

  /** Optional extra content rendered below the message. */
  children?: ReactNode
}

/**
 * Styled error card with an icon, message, and optional retry action.
 *
 * @param title   - Card heading
 * @param message - Primary error message
 * @param onRetry - Optional retry callback
 * @param children - Optional additional content
 * @returns The error card element
 * @sideEffects Calls `onRetry` when the retry button is clicked.
 */
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
