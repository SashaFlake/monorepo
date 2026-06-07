import { ReactElement } from 'react'
import { Card } from '@/shared/ui'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/shared/ui'
import { ManifestPanel } from './ManifestPanel'
import { OpenApiPanel } from './OpenApiPanel'
import { InstancesPanel } from './InstancesPanel'
import type { ServiceVersion } from '../../domain/types'
import s from './ServiceDetailPage.module.css'

/**
 * Card displaying a single service version with tabs for manifest,
 * OpenAPI spec and instance list.
 *
 * @param version   – service version data
 * @param serviceId – owning service ID
 * @returns VersionCard React element
 * @sideEffects none
 */
export function VersionCard({ version, serviceId }: { version: ServiceVersion; serviceId: string }): ReactElement {
  return (
    <Card className={s.cardFlush}>
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
