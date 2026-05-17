import { ReactElement } from 'react'
import { Card } from '@/shared/ui'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/shared/ui'
import { ManifestPanel, OpenApiPanel, InstancesPanel } from './index'
import type { ServiceVersion } from '../api/types'
import s from '../ServiceDetailPage.module.css'

export function VersionCard({ version, serviceId }: { version: ServiceVersion; serviceId: string }): ReactElement {
  return (
    <Card style={{ padding: 0, overflow: 'hidden' }}>
      <div className={s.versionHeader}>
        <span className={s.versionName}>v{version.version}</span>
        <span className={s.versionCount}>{version.instanceCount} instance{version.instanceCount !== 1 ? 's' : ''}</span>
      </div>

      <Tabs defaultValue="manifest">
        <TabsList variant="card">
          <TabsTrigger value="manifest">Manifest</TabsTrigger>
          <TabsTrigger value="openapi">OpenAPI</TabsTrigger>
          <TabsTrigger value="instances">Instances ({version.instanceCount})</TabsTrigger>
        </TabsList>

        <TabsContent value="manifest">
          <div className={s.versionBody}>
            <ManifestPanel version={version} />
          </div>
        </TabsContent>
        <TabsContent value="openapi">
          <div className={s.versionBody}>
            <OpenApiPanel serviceId={serviceId} version={version.version} />
          </div>
        </TabsContent>
        <TabsContent value="instances">
          <InstancesPanel version={version} />
        </TabsContent>
      </Tabs>
    </Card>
  )
}
