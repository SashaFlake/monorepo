import { createFileRoute, Outlet } from '@tanstack/react-router'

/**
 * Layout route for `/services`.
 *
 * Renders the matched child route (services index or service detail) inside
 * an outlet without adding any wrapper UI.
 */
export const Route = createFileRoute('/services')({
  component: () => <Outlet />,
})
