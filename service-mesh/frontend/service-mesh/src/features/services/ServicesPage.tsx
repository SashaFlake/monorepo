import { ReactElement } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Header } from '@/components/layout/Header'
import { Card, ErrorCard, Skeleton } from '@/shared/ui'
import { useServicesList } from './api/useServicesList'
import { ServicesTable } from '@/features/registry/ServicesTable'
import s from './ServicesPage.module.css'

// Column count matches ServicesTable columns: Name, Labels, Instances, Status
const SKELETON_COLS = 4
const SKELETON_ROWS = 5

export function ServicesPage(): ReactElement {
  const navigate = useNavigate()
  const { services, isLoading, isError } = useServicesList()

  return (
    <>
      <Header title="Services" subtitle="Registered services & instances" />
      <main className={s.main}>
        {isError && <ErrorCard message="Cannot reach registry backend" />}

        {isLoading && (
          <Card style={{ padding: 0, overflow: 'hidden' }}>
            <table className={s.table}>
              <thead className={s.thead}>
                <tr>
                  {Array.from({ length: SKELETON_COLS }).map((_, i) => (
                    <th key={i} className={s.th}><Skeleton width="60%" /></th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: SKELETON_ROWS }).map((_, i) => (
                  <tr key={i} className={s.row}>
                    {Array.from({ length: SKELETON_COLS }).map((_, j) => (
                      <td key={j} className={s.td}>
                        <Skeleton width={j === 2 ? '40px' : j === 3 ? '60px' : `${60 + j * 10}%`} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}

        {!isLoading && !isError && services.length === 0 && (
          <Card><div className={s.empty}>No services registered yet.</div></Card>
        )}

        {!isLoading && !isError && services.length > 0 && (
          <Card style={{ padding: 0, overflow: 'hidden' }}>
            <ServicesTable
              services={services}
              onRowClick={(svc) => {
                void navigate({ to: '/services/$serviceId', params: { serviceId: svc.id } })
              }}
            />
          </Card>
        )}
      </main>
    </>
  )
}
