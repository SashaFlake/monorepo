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

/**
 * Props for {@link Dialog}.
 */
export type DialogProps = {
  /** Whether the dialog is currently open. */
  open:                 boolean

  /** Called when the dialog requests to open or close. */
  onOpenChange:         (open: boolean) => void

  /** Dialog content, usually {@link DialogContent}. */
  children:             ReactNode
}

/**
 * Root component that controls dialog visibility.
 *
 * @param open         - Current open state
 * @param onOpenChange - Open state change handler
 * @param children     - Dialog content
 * @returns The dialog root element
 * @sideEffects none
 */
export function Dialog({ open, onOpenChange, children }: DialogProps): ReactElement {
  return (
    <RadixDialog.Root open={open} onOpenChange={onOpenChange}>
      {children}
    </RadixDialog.Root>
  )
}

/**
 * Props for {@link DialogContent}.
 */
export type DialogContentProps = {
  /** Modal width preset. */
  size?:        'md' | 'sm'

  /**
   * Called when the user attempts to close the dialog via overlay click or
   * Escape. Calling `event.preventDefault()` keeps it open. Use this when you
   * need a dirty-check confirmation.
   */
  onInteractOutside?:   RadixDialog.DialogContentProps['onInteractOutside']

  /**
   * Called when the user presses Escape.
   */
  onEscapeKeyDown?:     RadixDialog.DialogContentProps['onEscapeKeyDown']

  /** Dialog body content. */
  children:             ReactNode

  /** Additional CSS class names. */
  className?:           string
}

/**
 * Modal container with overlay, focus trap, and optional size.
 *
 * @param size              - Width preset
 * @param onInteractOutside - Overlay-click / outside-interact handler
 * @param onEscapeKeyDown   - Escape key handler
 * @param children          - Dialog body content
 * @param className         - Extra CSS classes
 * @returns The dialog content element
 * @sideEffects Mounts a Radix portal and focus trap.
 */
export const DialogContent = forwardRef<HTMLDivElement, DialogContentProps>(
  function DialogContent(
    { size = 'md', onInteractOutside, onEscapeKeyDown, children, className },
    ref,
  ) {
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

/**
 * Props for {@link DialogHeader}.
 */
type DialogHeaderProps = {
  /** Header content, typically {@link DialogTitle}. */
  children: ReactNode

  /** When true, adds extra spacing for an icon placed beside the title. */
  withIcon?: boolean
}

/**
 * Header section of a dialog, usually containing the title and close button.
 *
 * @param children - Header content
 * @param withIcon - Whether an icon is present
 * @returns The dialog header element
 * @sideEffects none
 */
export function DialogHeader({ children, withIcon = false }: DialogHeaderProps): ReactElement {
  return <div className={withIcon ? s.headerWithIcon : s.header}>{children}</div>
}

/**
 * Props for {@link DialogTitle}.
 */
export type DialogTitleProps = {
  /** Title text. */
  children:   ReactNode
}

/**
 * Accessible title rendered as an `<h2>`.
 *
 * Radix auto-generates an id and wires it as `aria-labelledby` on the dialog
 * content.
 *
 * @param children - Title text
 * @returns The dialog title element
 * @sideEffects none
 */
export function DialogTitle({ children }: DialogTitleProps): ReactElement {
  return <RadixDialog.Title className={s.title}>{children}</RadixDialog.Title>
}

/**
 * Props for {@link DialogDescription}.
 */
export type DialogDescriptionProps = {
  /** Description text. */
  children:   ReactNode
}

/**
 * Accessible description rendered as a `<p>`.
 *
 * Radix auto-generates an id and wires it as `aria-describedby` on the dialog
 * content.
 *
 * @param children - Description text
 * @returns The dialog description element
 * @sideEffects none
 */
export function DialogDescription({ children }: DialogDescriptionProps): ReactElement {
  return <RadixDialog.Description className={s.description}>{children}</RadixDialog.Description>
}

/**
 * Props for {@link DialogActions}.
 */
type DialogActionsProps = {
  /** Action buttons. */
  children: ReactNode

  /** Use a compact layout with reduced spacing. */
  compact?: boolean
}

/**
 * Footer action row, typically containing cancel and confirm buttons.
 *
 * @param children - Action buttons
 * @param compact  - Whether to use compact spacing
 * @returns The dialog actions element
 * @sideEffects none
 */
export function DialogActions({ children, compact = false }: DialogActionsProps): ReactElement {
  return <div className={compact ? s.actionsCompact : s.actions}>{children}</div>
}

/**
 * The icon-only "X" close button for the corner of a dialog header.
 * Wraps Radix' `<Close />` so a click correctly fires `onOpenChange(false)`
 * and the dialog can also veto via `onInteractOutside` semantics if needed.
 *
 * For a textual cancel button inside `<DialogActions>`, just call
 * `onOpenChange(false)` (or your dirty-checked closer) from the `Button`.
 *
 * @param label - Accessible label for the close button (defaults to "Close")
 * @returns The close icon button element
 * @sideEffects Triggers Radix dialog close on click.
 */
export function DialogCloseIconButton({ label = 'Close' }: { label?: string }): ReactElement {
  return (
    <RadixDialog.Close className={s.closeBtn} aria-label={label}>
      <X size={16} />
    </RadixDialog.Close>
  )
}
