import { type ReactElement, type ReactNode } from 'react'
import * as RadixAlertDialog from '@radix-ui/react-alert-dialog'
import clsx from 'clsx'
import s from './AlertDialog.module.css'

/**
 * Headless AlertDialog primitive built on top of Radix UI.
 *
 * Use this for destructive or interruptive confirmations (delete, discard,
 * sign out). It differs from <Dialog> in three important ways:
 *
 *   1. role="alertdialog" — assistive tech announces it more urgently.
 *   2. There is no overlay-click-to-dismiss; only an explicit Cancel/Confirm
 *      action can close it. Escape still closes by default.
 *   3. There is no close-X icon — the Cancel button is the only way out
 *      besides Confirm.
 *
 * Composition pattern:
 *
 *   <AlertDialog open={open} onOpenChange={setOpen}>
 *     <AlertDialogContent>
 *       <AlertDialogHeader icon={<Trash2 size={18} />} iconVariant="danger">
 *         <AlertDialogTitle>...</AlertDialogTitle>
 *       </AlertDialogHeader>
 *       <AlertDialogDescription>...</AlertDialogDescription>
 *       <AlertDialogActions>
 *         <AlertDialogCancel asChild><Button variant="ghost">Cancel</Button></AlertDialogCancel>
 *         <AlertDialogAction  asChild><Button variant="danger">Delete</Button></AlertDialogAction>
 *       </AlertDialogActions>
 *     </AlertDialogContent>
 *   </AlertDialog>
 */

/**
 * Props for {@link AlertDialog}.
 */
export type AlertDialogProps = {
  /** Whether the dialog is currently open. */
  open:           boolean

  /** Called when the dialog requests to open or close. */
  onOpenChange:   (open: boolean) => void

  /** Dialog content, usually {@link AlertDialogContent}. */
  children:       ReactNode
}

/**
 * Root component that controls alert dialog visibility.
 *
 * @param open         - Current open state
 * @param onOpenChange - Open state change handler
 * @param children     - Dialog content
 * @returns The alert dialog root element
 * @sideEffects none
 */
export function AlertDialog({ open, onOpenChange, children }: AlertDialogProps): ReactElement {
  return (
    <RadixAlertDialog.Root open={open} onOpenChange={onOpenChange}>
      {children}
    </RadixAlertDialog.Root>
  )
}

/**
 * Modal container with overlay and focus trap.
 *
 * `aria-labelledby` and `aria-describedby` are wired automatically by Radix
 * when {@link AlertDialogTitle} and {@link AlertDialogDescription} are rendered
 * inside.
 *
 * @param children - Dialog body content
 * @returns The alert dialog content element
 * @sideEffects Mounts a Radix portal and focus trap.
 */
export function AlertDialogContent({ children }: { children: ReactNode }): ReactElement {
  return (
    <RadixAlertDialog.Portal>
      <RadixAlertDialog.Overlay className={s.overlay}>
        <RadixAlertDialog.Content className={s.content}>
          {children}
        </RadixAlertDialog.Content>
      </RadixAlertDialog.Overlay>
    </RadixAlertDialog.Portal>
  )
}

/**
 * Visual variant for the optional header icon.
 */
type IconVariant = 'danger'

/**
 * Props for {@link AlertDialogHeader}.
 */
type AlertDialogHeaderProps = {
  /** Header content, typically {@link AlertDialogTitle}. */
  children:      ReactNode

  /** Optional icon rendered above the title. */
  icon?:         ReactNode

  /** Visual variant applied to the icon wrapper. */
  iconVariant?:  IconVariant
}

/**
 * Header section of an alert dialog, optionally decorated with an icon.
 *
 * @param children     - Header content
 * @param icon         - Optional icon element
 * @param iconVariant  - Optional icon variant
 * @returns The alert dialog header element
 * @sideEffects none
 */
export function AlertDialogHeader({
  children,
  icon,
  iconVariant,
}: AlertDialogHeaderProps): ReactElement {
  return (
    <div className={s.header}>
      {icon ? (
        <div className={clsx(s.iconWrap, iconVariant === 'danger' && s.iconWrapDanger)}>
          {icon}
        </div>
      ) : null}
      {children}
    </div>
  )
}

/**
 * Accessible title rendered as an `<h2>`.
 *
 * Radix auto-generates an id and wires it as `aria-labelledby` on the dialog
 * content.
 *
 * @param children - Title text
 * @returns The alert dialog title element
 * @sideEffects none
 */
export function AlertDialogTitle({ children }: { children: ReactNode }): ReactElement {
  return <RadixAlertDialog.Title className={s.title}>{children}</RadixAlertDialog.Title>
}

/**
 * Accessible description rendered as a `<p>`.
 *
 * Radix auto-generates an id and wires it as `aria-describedby` on the dialog
 * content.
 *
 * @param children - Description text
 * @returns The alert dialog description element
 * @sideEffects none
 */
export function AlertDialogDescription({ children }: { children: ReactNode }): ReactElement {
  return <RadixAlertDialog.Description className={s.description}>{children}</RadixAlertDialog.Description>
}

/**
 * Footer action row, typically containing {@link AlertDialogCancel} and
 * {@link AlertDialogAction}.
 *
 * @param children - Action buttons
 * @returns The alert dialog actions element
 * @sideEffects none
 */
export function AlertDialogActions({ children }: { children: ReactNode }): ReactElement {
  return <div className={s.actions}>{children}</div>
}

/**
 * Wrap your existing `<Button>` with `asChild` to inherit visuals while letting
 * Radix manage focus and keyboard. Cancel closes the dialog automatically.
 */
export const AlertDialogCancel = RadixAlertDialog.Cancel

/**
 * Confirm action. By default it closes the dialog after onClick fires; if you
 * want to keep it open while a mutation is pending, pass `disabled` to the
 * underlying button — Radix won't auto-close on a disabled trigger.
 */
export const AlertDialogAction = RadixAlertDialog.Action
