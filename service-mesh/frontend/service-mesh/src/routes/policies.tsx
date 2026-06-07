import { createFileRoute } from '@tanstack/react-router'
import { Header } from '@/components/layout/Header'
import { Card } from '@/shared/ui'
import s from './placeholder.module.css'
import {ReactElement} from "react";

/**
 * Route definition for `/policies`.
 *
 * Displays a placeholder for the upcoming policies page.
 */
export const Route = createFileRoute('/policies')({ component: PoliciesPage })

/**
 * Placeholder page for retry, timeout, and access policies.
 *
 * @returns The policies page element
 * @sideEffects none
 */
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
