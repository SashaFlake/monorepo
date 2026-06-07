import { createFileRoute } from '@tanstack/react-router'
import { Header } from '@/components/layout/Header'
import { Card } from '@/shared/ui'
import s from './placeholder.module.css'
import {ReactElement} from "react";

/**
 * Route definition for `/revisions`.
 *
 * Displays a placeholder for the upcoming config revision history page.
 */
export const Route = createFileRoute('/revisions')({ component: RevisionsPage })

/**
 * Placeholder page for configuration revision history.
 *
 * @returns The revisions page element
 * @sideEffects none
 */
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
