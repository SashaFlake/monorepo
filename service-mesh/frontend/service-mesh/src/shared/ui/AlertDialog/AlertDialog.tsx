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

export type AlertDialogProps = {
  open:           boolean
  onOpenChange:   (open: boolean) => void
  children:       ReactNode
}

export function AlertDialog({ open, onOpenChange, children }: AlertDialogProps): ReactElement {
  return (
    <RadixAlertDialog.Root open={open} onOpenChange={onOpenChange}>
      {children}
    </RadixAlertDialog.Root>
  )
}

export function AlertDialogContent({ children }: { children: ReactNode }): ReactElement {
  // aria-labelledby and aria-describedby are wired automatically by Radix
  // when <AlertDialogTitle>/<AlertDialogDescription> are rendered inside.
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

type IconVariant = 'danger'

export function AlertDialogHeader({
  children,
  icon,
  iconVariant,
}: {
  children:      ReactNode
  icon?:         ReactNode
  iconVariant?:  IconVariant
}): ReactElement {
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

export function AlertDialogTitle({ children }: { children: ReactNode }): ReactElement {
  // Radix' Title renders an <h2> with an auto-generated id and wires it up
  // as aria-labelledby on Content.
  return <RadixAlertDialog.Title className={s.title}>{children}</RadixAlertDialog.Title>
}

export function AlertDialogDescription({ children }: { children: ReactNode }): ReactElement {
  // Radix' Description renders a <p> with an auto-generated id and wires it
  // up as aria-describedby on Content.
  return <RadixAlertDialog.Description className={s.description}>{children}</RadixAlertDialog.Description>
}

export function AlertDialogActions({ children }: { children: ReactNode }): ReactElement {
  return <div className={s.actions}>{children}</div>
}

/**
 * Wrap your existing <Button> with `asChild` to inherit visuals while letting
 * Radix manage focus and keyboard. Cancel closes the dialog automatically.
 */
export const AlertDialogCancel = RadixAlertDialog.Cancel

/**
 * Confirm action. By default it closes the dialog after onClick fires; if you
 * want to keep it open while a mutation is pending, pass `disabled` to the
 * underlying button — Radix won't auto-close on a disabled trigger.
 */
export const AlertDialogAction = RadixAlertDialog.Action
