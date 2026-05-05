import { ReactElement } from 'react'
import s from './Skeleton.module.css'

interface SkeletonProps {
  width?: string
  height?: string
  className?: string
}

export function Skeleton({ width, height, className }: SkeletonProps): ReactElement {
  return (
    <div
      className={`${s.skeleton} ${className ?? ''}`}
      style={{ width, height }}
    />
  )
}
