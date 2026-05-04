import type {ButtonHTMLAttributes, ReactElement, ReactNode} from 'react'
import s from './Button.module.css'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
  children: ReactNode
}

export function Button({ variant = 'secondary', children, ...props }: ButtonProps): ReactElement {
  return (
    <button
      {...props}
      data-variant={variant}
      className={s.btn}
    >
      {children}
    </button>
  )
}
