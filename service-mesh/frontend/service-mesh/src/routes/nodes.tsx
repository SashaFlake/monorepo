import { createFileRoute } from '@tanstack/react-router'
import { Header } from '@/components/layout/Header'
import { Card } from '@/components/ui/card'
import s from './placeholder.module.css'
import {ReactElement} from "react";

export const Route = createFileRoute('/nodes')({ component: NodesPage })

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
