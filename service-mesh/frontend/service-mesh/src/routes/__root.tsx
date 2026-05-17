import { createRootRouteWithContext, Outlet } from '@tanstack/react-router'
import { QueryClient } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { Sidebar } from '@/components/layout/Sidebar'
import s from './__root.module.css'
import { ReactElement } from 'react'

type RouterContext = {
  queryClient: QueryClient
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootLayout,
})

function RootLayout(): ReactElement {
  return (
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
  )
}
