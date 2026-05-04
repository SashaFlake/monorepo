import { createFileRoute } from '@tanstack/react-router'
import { Header } from '@/components/layout/Header'
import { Card } from '@/components/ui/card'
import s from './placeholder.module.css'
import {ReactElement} from "react";

export const Route = createFileRoute('/policies')({ component: PoliciesPage })

export function PoliciesPage(): ReactElement {
  return (
    <>
      <Header title="Policies" subtitle="Retry, timeout & access rules" />
      <main className={s.main}>
        <Card className={s.card}>Policies — coming soon</Card>
      </main>
    </>
  )
}
