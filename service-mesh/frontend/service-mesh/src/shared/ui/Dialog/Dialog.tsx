import { type ReactElement, type ReactNode, forwardRef } from 'react'
import * as RadixDialog from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import clsx from 'clsx'
import s from './Dialog.module.css'

/**
 * Headless Dialog primitive built on top of Radix UI.
 *
 * Why Radix:
 * - Correct focus trap, focus restoration, ESC handling, scroll lock, ARIA roles.
 * - We keep our own design tokens via CSS Modules — Radix ships no styles.
 *
 * Composition pattern:
 *
 *   <Dialog open={open} onOpenChange={setOpen}>
 *     <DialogContent>
 *       <DialogHeader>
 *         <DialogTitle>...</DialogTitle>
 *         <DialogCloseIconButton />
 *       </DialogHeader>
 *       ...body...
 *       <DialogActions>
 *         <Button ...>Cancel</Button>
 *         <Button ...>Save</Button>
 *       </DialogActions>
 *     </DialogContent>
 *   </Dialog>
 *
 * `onOpenChange(false)` is also called when the user clicks the overlay or
 * presses Escape. Use it to wire dirty-checks at the call site.
 */

export type DialogProps = {
  open:                 boolean
  onOpenChange:         (open: boolean) => void
  children:             ReactNode
}

export function Dialog({ open, onOpenChange, children }: DialogProps): ReactElement {
  return (
    <RadixDialog.Root open={open} onOpenChange={onOpenChange}>
      {children}
    </RadixDialog.Root>
  )
}

export type DialogContentProps = {
  size?:        'md' | 'sm'
  /**
   * Called when the user attempts to close the dialog via overlay click or
   * Escape. Calling `event.preventDefault()` keeps it open. Use this when you
   * need a dirty-check confirmation.
   */
  onInteractOutside?:   RadixDialog.DialogContentProps['onInteractOutside']
  onEscapeKeyDown?:     RadixDialog.DialogContentProps['onEscapeKeyDown']
  children:             ReactNode
  className?:           string
}

export const DialogContent = forwardRef<HTMLDivElement, DialogContentProps>(
  function DialogContent(
    { size = 'md', onInteractOutside, onEscapeKeyDown, children, className },
    ref,
  ) {
    // aria-labelledby and aria-describedby are wired automatically by Radix
    // when <DialogTitle>/<DialogDescription> are rendered inside.
    return (
      <RadixDialog.Portal>
        <RadixDialog.Overlay className={s.overlay}>
          <RadixDialog.Content
            ref={ref}
            className={clsx(s.content, size === 'sm' && s.contentSm, className)}
            onInteractOutside={onInteractOutside}
            onEscapeKeyDown={onEscapeKeyDown}
          >
            {children}
          </RadixDialog.Content>
        </RadixDialog.Overlay>
      </RadixDialog.Portal>
    )
  },
)

export function DialogHeader({ children, withIcon = false }: { children: ReactNode; withIcon?: boolean }): ReactElement {
  return <div className={withIcon ? s.headerWithIcon : s.header}>{children}</div>
}

export type DialogTitleProps = {
  children:   ReactNode
}

export function DialogTitle({ children }: DialogTitleProps): ReactElement {
  // Radix' Title renders an <h2> with an auto-generated id and wires it up
  // as aria-labelledby on Content. We just style it.
  return <RadixDialog.Title className={s.title}>{children}</RadixDialog.Title>
}

export type DialogDescriptionProps = {
  children:   ReactNode
}

export function DialogDescription({ children }: DialogDescriptionProps): ReactElement {
  // Radix' Description renders a <p> with an auto-generated id and wires it
  // up as aria-describedby on Content.
  return <RadixDialog.Description className={s.description}>{children}</RadixDialog.Description>
}

export function DialogActions({ children, compact = false }: { children: ReactNode; compact?: boolean }): ReactElement {
  return <div className={compact ? s.actionsCompact : s.actions}>{children}</div>
}

/**
 * The icon-only "X" close button for the corner of a dialog header.
 * Wraps Radix' `<Close />` so a click correctly fires `onOpenChange(false)`
 * and the dialog can also veto via `onInteractOutside` semantics if needed.
 *
 * For a textual cancel button inside `<DialogActions>`, just call
 * `onOpenChange(false)` (or your dirty-checked closer) from the `Button`.
 */
export function DialogCloseIconButton({ label = 'Close' }: { label?: string }): ReactElement {
  return (
    <RadixDialog.Close className={s.closeBtn} aria-label={label}>
      <X size={16} />
    </RadixDialog.Close>
  )
}
