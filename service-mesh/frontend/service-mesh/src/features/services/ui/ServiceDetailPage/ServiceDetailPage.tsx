import { Link } from '@tanstack/react-router'
import {ReactElement} from 'react'
import { Header } from '@/components/layout/Header'
import { Card } from '@/shared/ui'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/shared/ui'
import { RoutingRulesPage } from '@/features/routing-rules'
import { useServiceDetail } from '../../application/useServiceDetail.application'
import type { InstanceStatus } from '../../domain/types'
import { VersionCard } from './VersionCard'
import s from './ServiceDetailPage.module.css'

const STATUS_VARIANT: Record<InstanceStatus, 'success' | 'warning' | 'error'> = {
  passing:  'success',
  warning:  'warning',
  critical: 'error',
}

export { STATUS_VARIANT }

export function ServiceDetailPage({ serviceId }: { serviceId: string }): ReactElement {
  const { data, isLoading, isError } = useServiceDetail(serviceId)

  const title = data?.serviceName ?? serviceId

  return (
    <>
      <Header
        title={title}
        subtitle={
          <span className={s.breadcrumb}>
            <Link to="/services" className={s.breadcrumbLink}>Services</Link>
            <span className={s.breadcrumbSep}>›</span>
            <span className={s.breadcrumbCurrent}>{title}</span>
          </span>
        }
      />

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="routing-rules">Routing Rules</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <main className={s.main}>
            {isError && <Card className={`${s.stateCard} ${s.errorCard}`}>⚠️ Could not load service</Card>}
            {isLoading && <Card className={`${s.stateCard} ${s.loadingCard}`}>Loading…</Card>}
            {!isLoading && !isError && (data?.versions.length ?? 0) === 0 && (
              <Card className={s.emptyCard}>No instances registered — no versions to show.</Card>
            )}
            {data?.versions.map(v => <VersionCard key={v.version} version={v} serviceId={serviceId} />)}
          </main>
        </TabsContent>

        <TabsContent value="routing-rules">
          <RoutingRulesPage serviceId={serviceId} />
        </TabsContent>
      </Tabs>
    </>
  )
}
