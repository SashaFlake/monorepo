import { type ReactElement, type ReactNode } from 'react'
import * as RadixTooltip from '@radix-ui/react-tooltip'
import s from './Tooltip.module.css'

/**
 * Headless Tooltip primitive built on Radix UI.
 *
 * Why Radix:
 * - Correct hover/focus delay, pointer-leave grace area, ARIA wiring
 *   (role="tooltip" + aria-describedby) — all automatic.
 * - Collision-aware positioning via Floating UI under the hood.
 * - No styles — design tokens via CSS Modules.
 *
 * Usage:
 *
 *   <Tooltip content="Edit rule">
 *     <Button variant="ghost" aria-label="Edit rule"><Pencil size={14} /></Button>
 *   </Tooltip>
 *
 * `content` can be a string or any ReactNode (for rich tooltips).
 *
 * `side` defaults to "top". Pass "bottom" | "left" | "right" when needed.
 * `delayDuration` defaults to 400 ms (Radix default). Pass 0 for instant.
 *
 * NOTE: The child must be able to receive a ref (forwardRef or a DOM element).
 * Radix wraps it automatically — no need to add asChild unless you want to
 * avoid an extra <span> in the DOM.
 */

// ─── Provider ───────────────────────────────────────────────────────────────
// Mount once at root — wraps the whole app so all tooltips share the same
// delay. Already included in this file for convenience if you want to add it
// to RootLayout, otherwise each <Tooltip> creates its own provider which is
// also fine.

export type TooltipProviderProps = {
  /** Delay before tooltip shows on hover (ms). Default 400. */
  delayDuration?: number
  children: ReactNode
}

export function TooltipProvider({ delayDuration = 400, children }: TooltipProviderProps): ReactElement {
  return (
    <RadixTooltip.Provider delayDuration={delayDuration}>
      {children}
    </RadixTooltip.Provider>
  )
}

// ─── Tooltip ────────────────────────────────────────────────────────────────

export type TooltipProps = {
  /** Tooltip text or rich content. */
  content: ReactNode
  /** The element that triggers the tooltip. */
  children: ReactNode
  side?: 'top' | 'bottom' | 'left' | 'right'
  /** Offset from the trigger in px. Default 6. */
  sideOffset?: number
  /** Override delay for this specific tooltip. */
  delayDuration?: number
  /** Disable the tooltip without removing it from the tree. */
  disabled?: boolean
}

export function Tooltip({
  content,
  children,
  side = 'top',
  sideOffset = 6,
  delayDuration,
  disabled = false,
}: TooltipProps): ReactElement {
  if (disabled) {
    // Render children as-is when tooltip is disabled
    return <>{children}</>
  }

  return (
    <RadixTooltip.Root delayDuration={delayDuration}>
      <RadixTooltip.Trigger asChild>
        {/* asChild passes the ref + event handlers to the child DOM element
            without wrapping it in an extra element */}
        <span style={{ display: 'contents' }}>{children}</span>
      </RadixTooltip.Trigger>

      <RadixTooltip.Portal>
        <RadixTooltip.Content
          side={side}
          sideOffset={sideOffset}
          className={s.content}
        >
          {content}
          <RadixTooltip.Arrow className={s.arrow} />
        </RadixTooltip.Content>
      </RadixTooltip.Portal>
    </RadixTooltip.Root>
  )
}
