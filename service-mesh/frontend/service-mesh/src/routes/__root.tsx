import { createRootRouteWithContext, Outlet } from '@tanstack/react-router'
import { QueryClient } from '@tanstack/react-query'
import { Sidebar } from '@/components/layout/Sidebar'
import s from './__root.module.css'
import {ReactElement} from "react";

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
    </div>
  )
}
