import { createFileRoute } from '@tanstack/react-router'
import { Header } from '@/components/layout/Header'
import { Card } from '@/components/ui/card'
import s from './placeholder.module.css'
import {ReactElement} from "react";

export const Route = createFileRoute('/revisions')({ component: RevisionsPage })

export function RevisionsPage(): ReactElement {
  return (
    <>
      <Header title="Revisions" subtitle="Config revision history" />
      <main className={s.main}>
        <Card className={s.card}>Revisions — coming soon</Card>
      </main>
    </>
  )
}
