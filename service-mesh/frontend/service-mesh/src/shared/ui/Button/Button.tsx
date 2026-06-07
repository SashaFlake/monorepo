import type {ButtonHTMLAttributes, ReactElement, ReactNode} from 'react'
import s from './Button.module.css'

/**
 * Visual variant of the {@link Button} primitive.
 */
type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'

/**
 * Props for {@link Button}.
 */
type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  /** Visual style variant. */
  variant?: ButtonVariant

  /** Button content. */
  children: ReactNode
}

/**
 * Button primitive styled with CSS Modules and driven by a `data-variant`
 * attribute for easy theming.
 *
 * @param variant  - Visual variant (defaults to `secondary`)
 * @param children - Button label or icon
 * @param props    - Standard `<button>` attributes forwarded as-is
 * @returns The button element
 * @sideEffects none
 */
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
