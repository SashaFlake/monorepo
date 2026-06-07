import { createRootRouteWithContext, Outlet } from '@tanstack/react-router'
import { QueryClient } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { Sidebar } from '@/components/layout/Sidebar'
import { TooltipProvider } from '@/shared/ui'
import s from './__root.module.css'
import { ReactElement } from 'react'

/**
 * Router context provided to every route in the application.
 *
 * Carries the shared TanStack Query client so loaders and components can
 * access cached server state consistently.
 */
type RouterContext = {
  queryClient: QueryClient
}

/**
 * Root route that wraps every page with the application shell.
 *
 * Provides the tooltip provider, sidebar layout, toast container, and the
 * outlet where matched routes render.
 */
export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootLayout,
})

/**
 * Root layout component.
 *
 * @returns The root application layout element
 * @sideEffects Mounts the Sonner toast container and Radix Tooltip provider.
 */
function RootLayout(): ReactElement {
  return (
    <TooltipProvider>
      <div className={s.layout}>
        <Sidebar />
        <div className={s.content}>
          <Outlet />
        </div>

        {/*
          Sonner toast container.
          Styled via CSS variables — maps to our design tokens.
          Position bottom-right is the standard for dashboards.
          richColors pulls success/error/warning colours from --color-* tokens
          when overridden in index.css via [data-sonner-toaster] selectors.
        */}
        <Toaster
          position="bottom-right"
          richColors
          toastOptions={{
            style: {
              fontFamily: 'inherit',
              fontSize: 'var(--text-sm)',
            },
          }}
        />
      </div>
    </TooltipProvider>
  )
}
