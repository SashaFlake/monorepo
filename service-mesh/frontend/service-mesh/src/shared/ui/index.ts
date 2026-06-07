// Public barrel for shared UI primitives.
// Prefer importing from '@/shared/ui' over deep paths.

/**
 * Public surface of the shared UI design system.
 *
 * All primitives are headless or lightly-styled Radix wrappers plus a few
 * custom components (Skeleton, ErrorCard). Import from here to stay
 * decoupled from the internal file layout.
 */

export { Button } from './Button'
export { Card, CardHeader, CardTitle, CardValue } from './Card'
export { Badge } from './Badge'
export { Skeleton } from './Skeleton'
export { ErrorCard } from './ErrorCard'

export {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogActions,
  DialogCloseIconButton,
} from './Dialog'

export {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogActions,
  AlertDialogCancel,
  AlertDialogAction,
} from './AlertDialog'

export {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from './Tabs'

export {
  Tooltip,
  TooltipProvider,
} from './Tooltip'
