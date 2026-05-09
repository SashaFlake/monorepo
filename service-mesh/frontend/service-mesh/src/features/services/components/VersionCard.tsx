import { ReactElement, useState } from 'react'
import { Card } from '@/components/ui/card'
import { ManifestPanel, OpenApiPanel, InstancesPanel } from './index'
import type { ServiceVersion } from '../api/types'
import s from '../ServiceDetailPage.module.css'

type VersionTab = 'manifest' | 'openapi' | 'instances'

export function VersionCard({ version, serviceId }: { version: ServiceVersion; serviceId: string }): ReactElement {
  const [tab, setTab] = useState<VersionTab>('manifest')
  const tabs: { id: VersionTab; label: string }[] = [
    { id: 'manifest',  label: 'Manifest' },
    { id: 'openapi',   label: 'OpenAPI' },
    { id: 'instances', label: `Instances (${version.instanceCount})` },
  ]
  return (
    <Card style={{ padding: 0, overflow: 'hidden' }}>
      <div className={s.versionHeader}>
        <span className={s.versionName}>v{version.version}</span>
        <span className={s.versionCount}>{version.instanceCount} instance{version.instanceCount !== 1 ? 's' : ''}</span>
      </div>
      <div className={s.versionTabBar}>
        {tabs.map(t => (
          <button key={t.id} className={s.versionTabBtn} data-active={tab === t.id} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>
      <div className={s.versionBody}>
        {tab === 'manifest'  && <ManifestPanel version={version} />}
        {tab === 'openapi'   && <OpenApiPanel serviceId={serviceId} version={version.version} />}
        {tab === 'instances' && <InstancesPanel version={version} />}
      </div>
    </Card>
  )
}
