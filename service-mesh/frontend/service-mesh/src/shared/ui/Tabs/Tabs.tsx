import { type ReactElement, type ReactNode } from 'react'
import * as RadixTabs from '@radix-ui/react-tabs'
import clsx from 'clsx'
import s from './Tabs.module.css'

/**
 * Headless Tabs primitive built on Radix UI.
 *
 * Why Radix:
 * - Keyboard navigation (←/→/Home/End), roving tabindex, correct ARIA roles
 *   (tablist / tab / tabpanel) — all wired automatically.
 * - No styles — all styling via CSS Modules + design tokens.
 *
 * Usage (controlled):
 *
 *   <Tabs value={tab} onValueChange={setTab}>
 *     <TabsList>
 *       <TabsTrigger value="overview">Overview</TabsTrigger>
 *       <TabsTrigger value="settings">Settings</TabsTrigger>
 *     </TabsList>
 *     <TabsContent value="overview">…</TabsContent>
 *     <TabsContent value="settings">…</TabsContent>
 *   </Tabs>
 *
 * Usage (uncontrolled):
 *
 *   <Tabs defaultValue="overview">…</Tabs>
 *
 * The `variant` prop on <TabsList> controls visual style:
 * - "underline" (default) — page-level tab bar with bottom-border indicator.
 * - "card"                — compact version-level tabs, slightly smaller text.
 */

// ─── Root ──────────────────────────────────────────────────────────────────

export type TabsProps = {
  /** Controlled active tab key. */
  value?: string
  /** Default tab for uncontrolled usage. */
  defaultValue?: string
  onValueChange?: (value: string) => void
  children: ReactNode
}

export function Tabs({ value, defaultValue, onValueChange, children }: TabsProps): ReactElement {
  return (
    <RadixTabs.Root value={value} defaultValue={defaultValue} onValueChange={onValueChange}>
      {children}
    </RadixTabs.Root>
  )
}

// ─── List ───────────────────────────────────────────────────────────────────

export type TabsListProps = {
  variant?: 'underline' | 'card'
  className?: string
  children: ReactNode
}

export function TabsList({ variant = 'underline', className, children }: TabsListProps): ReactElement {
  return (
    <RadixTabs.List className={clsx(s.list, variant === 'card' && s.listCard, className)}>
      {children}
    </RadixTabs.List>
  )
}

// ─── Trigger ────────────────────────────────────────────────────────────────

export type TabsTriggerProps = {
  value: string
  className?: string
  children: ReactNode
}

export function TabsTrigger({ value, className, children }: TabsTriggerProps): ReactElement {
  return (
    <RadixTabs.Trigger value={value} className={clsx(s.trigger, className)}>
      {children}
    </RadixTabs.Trigger>
  )
}

// ─── Content ────────────────────────────────────────────────────────────────

export type TabsContentProps = {
  value: string
  /** Extra padding — default true for "underline" page tabs, pass false for "card" tabs that have their own body padding. */
  padded?: boolean
  className?: string
  children: ReactNode
}

export function TabsContent({ value, padded = false, className, children }: TabsContentProps): ReactElement {
  return (
    <RadixTabs.Content
      value={value}
      className={clsx(padded && s.contentPadded, className)}
    >
      {children}
    </RadixTabs.Content>
  )
}
