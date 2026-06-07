import { createFileRoute } from '@tanstack/react-router'
import { Header } from '@/components/layout/Header'
import { Card } from '@/shared/ui'
import s from './placeholder.module.css'
import {ReactElement} from "react";

/**
 * Route definition for `/nodes`.
 *
 * Displays a placeholder for the upcoming data-plane nodes page.
 */
export const Route = createFileRoute('/nodes')({ component: NodesPage })

/**
 * Placeholder page for data-plane nodes.
 *
 * @returns The nodes page element
 * @sideEffects none
 */
export function NodesPage(): ReactElement {
  return (
    <>
      <Header title="Nodes" subtitle="Connected data plane nodes" />
      <main className={s.main}>
        <Card className={s.card}>Nodes — coming soon</Card>
      </main>
    </>
  )
}
