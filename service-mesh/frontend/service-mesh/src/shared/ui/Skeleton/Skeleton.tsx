import { ReactElement } from 'react'
import s from './Skeleton.module.css'

/**
 * Props for {@link Skeleton}.
 */
interface SkeletonProps {
  /** CSS width value (e.g. "100px", "50%"). */
  width?: string
  /** CSS height value (e.g. "20px"). */
  height?: string
  /** Additional CSS class name. */
  className?: string
}

/**
 * Placeholder loading skeleton using CSS variables for dynamic sizing.
 *
 * @param props – see {@link SkeletonProps}
 * @returns Skeleton React element
 * @sideEffects none
 */
export function Skeleton({ width, height, className }: SkeletonProps): ReactElement {
  return (
    <div
      className={`${s.skeleton} ${className ?? ''}`}
      style={{ '--skeleton-width': width, '--skeleton-height': height } as React.CSSProperties}
    />
  )
}
