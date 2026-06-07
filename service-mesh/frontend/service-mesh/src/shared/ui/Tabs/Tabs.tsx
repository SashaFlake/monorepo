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

/**
 * Props for {@link Tabs}.
 */
export type TabsProps = {
  /** Controlled active tab key. */
  value?: string

  /** Default tab for uncontrolled usage. */
  defaultValue?: string

  /** Called when the active tab changes. */
  onValueChange?: (value: string) => void

  /** Tab list and panel children. */
  children: ReactNode
}

/**
 * Root tabs component. Supports both controlled and uncontrolled modes.
 *
 * @param value         - Controlled active tab key
 * @param defaultValue  - Default active tab key for uncontrolled usage
 * @param onValueChange - Active tab change handler
 * @param children      - Tab list and panels
 * @returns The tabs root element
 * @sideEffects none
 */
export function Tabs({ value, defaultValue, onValueChange, children }: TabsProps): ReactElement {
  return (
    <RadixTabs.Root value={value} defaultValue={defaultValue} onValueChange={onValueChange}>
      {children}
    </RadixTabs.Root>
  )
}

/**
 * Props for {@link TabsList}.
 */
export type TabsListProps = {
  /** Visual style variant. */
  variant?: 'underline' | 'card'

  /** Additional CSS class names. */
  className?: string

  /** Tab trigger children. */
  children: ReactNode
}

/**
 * Container for tab triggers. Renders the accessible `tablist` role.
 *
 * @param variant   - Visual style variant
 * @param className - Extra CSS classes
 * @param children  - Tab triggers
 * @returns The tab list element
 * @sideEffects none
 */
export function TabsList({ variant = 'underline', className, children }: TabsListProps): ReactElement {
  return (
    <RadixTabs.List className={clsx(s.list, variant === 'card' && s.listCard, className)}>
      {children}
    </RadixTabs.List>
  )
}

/**
 * Props for {@link TabsTrigger}.
 */
export type TabsTriggerProps = {
  /** Tab key associated with this trigger. */
  value: string

  /** Additional CSS class names. */
  className?: string

  /** Trigger label. */
  children: ReactNode
}

/**
 * Individual tab trigger. Renders an accessible `tab` role.
 *
 * @param value     - Tab key
 * @param className - Extra CSS classes
 * @param children  - Trigger label
 * @returns The tab trigger element
 * @sideEffects none
 */
export function TabsTrigger({ value, className, children }: TabsTriggerProps): ReactElement {
  return (
    <RadixTabs.Trigger value={value} className={clsx(s.trigger, className)}>
      {children}
    </RadixTabs.Trigger>
  )
}

/**
 * Props for {@link TabsContent}.
 */
export type TabsContentProps = {
  /** Tab key that activates this panel. */
  value: string

  /**
   * Whether to add extra padding. Default is `false`; page-level tabs often
   * add their own body padding, while card tabs rely on this flag.
   */
  padded?: boolean

  /** Additional CSS class names. */
  className?: string

  /** Panel content. */
  children: ReactNode
}

/**
 * Tab panel rendered when the associated {@link TabsTrigger} is active.
 *
 * @param value     - Tab key
 * @param padded    - Whether to add content padding
 * @param className - Extra CSS classes
 * @param children  - Panel content
 * @returns The tab content element
 * @sideEffects none
 */
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
