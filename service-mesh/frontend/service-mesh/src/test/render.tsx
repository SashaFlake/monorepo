import { render as rtlRender, type RenderOptions } from '@testing-library/react'
import type { ReactElement, ReactNode } from 'react'
import { TooltipProvider } from '@/shared/ui'

/**
 * Wraps the rendered tree in a {@link TooltipProvider} so that Radix UI
 * tooltips work correctly in jsdom without throwing
 * "`Tooltip` must be used within `TooltipProvider`".
 *
 * @param children – tree to wrap
 * @returns React element with TooltipProvider
 * @sideEffects none
 */
function Wrapper({ children }: { children: ReactNode }): ReactElement {
  return <TooltipProvider>{children}</TooltipProvider>
}

/**
 * Custom render that automatically wraps the UI in a {@link TooltipProvider}.
 *
 * Import this instead of `@testing-library/react`'s `render` when the
 * component under test uses tooltips.
 *
 * @param ui      – React element to render
 * @param options – standard RTL render options (wrapper is always injected)
 * @returns RTL render result
 * @sideEffects Renders into jsdom.
 */
export function render(ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'>) {
  return rtlRender(ui, { wrapper: Wrapper, ...options })
}

// Re-export common RTL utilities so consumers don't need dual imports.
export { screen, fireEvent, within, waitFor } from '@testing-library/react'
