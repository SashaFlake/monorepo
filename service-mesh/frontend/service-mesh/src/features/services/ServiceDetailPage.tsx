import { Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { ReactElement, useState } from 'react'
import { Header } from '@/components/layout/Header'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/Skeleton'
import { ErrorCard } from '@/components/ui/ErrorCard'
import { RoutingRulesPage } from '@/features/routing-rules/RoutingRulesPage'
import { VersionCard } from './components'
import { registryApi, registryKeys } from './api/api'
import s from './ServiceDetailPage.module.css'

type PageTab = 'overview' | 'routing-rules'

const PAGE_TABS: { id: PageTab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'routing-rules', label: 'Routing Rules' },
]

export function ServiceDetailPage({ serviceId }: { serviceId: string }): ReactElement {
  const [pageTab, setPageTab] = useState<PageTab>('overview')

  const { data, isLoading, isError } = useQuery({
    queryKey: registryKeys.versions(serviceId),
    queryFn: () => registryApi.getServiceVersions(serviceId),
    refetchInterval: 10_000,
    staleTime: 5_000,
  })

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

      <div className={s.tabBar}>
        {PAGE_TABS.map(t => (
          <button key={t.id} className={s.tabBtn} data-active={pageTab === t.id} onClick={() => setPageTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      {pageTab === 'overview' && (
        <main className={s.main}>
          {isError && <ErrorCard message="Could not load service" />}
          {isLoading && (
            <Card style={{ padding: 16 }}>
              <Skeleton width="200px" height="24px" />
              <Skeleton width="150px" height="20px" className="mt-2" />
              <Skeleton width="100%" height="100px" className="mt-4" />
            </Card>
          )}
          {!isLoading && !isError && (data?.versions.length ?? 0) === 0 && (
            <Card className={s.emptyCard}>No instances registered — no versions to show.</Card>
          )}
          {data?.versions.map(v => <VersionCard key={v.version} version={v} serviceId={serviceId} />)}
        </main>
      )}

      {pageTab === 'routing-rules' && <RoutingRulesPage serviceId={serviceId} />}
    </>
  )
}
