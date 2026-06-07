import { ReactElement } from 'react'
import type { ServiceVersion } from '../../domain/types'
import { SpecCard, KV } from './SharedComponents'
import s from './ServiceDetailPage.module.css'

export function ManifestPanel({ version }: { version: ServiceVersion }): ReactElement {
  const m = version.manifest
  return (
    <div>
      <div className={s.manifestMeta}>
        <span className={s.chip}>{m.apiVersion}</span>
        <span className={`${s.chip} ${s.chipPrimary}`}>{m.kind}</span>
        <span className={s.manifestTimestamp}>generated {new Date(m.metadata.generatedAt).toLocaleTimeString()}</span>
      </div>
      <div className={s.specsGrid}>
        <SpecCard title="Exposure"><KV k="exposure" v={m.spec.exposure} /><KV k="protocol" v={m.spec.protocol} /></SpecCard>
        <SpecCard title="Ports">{m.spec.ports.map(p => <KV key={p.name} k={p.name} v={`${p.port} → ${p.targetPort} (${p.protocol})`} />)}</SpecCard>
        <SpecCard title="Routing"><KV k="load balancing" v={m.spec.routing.loadBalancing} /><KV k="retries" v={String(m.spec.routing.retries)} /><KV k="timeout" v={`${m.spec.routing.timeoutMs}ms`} /></SpecCard>
        <SpecCard title="Health"><KV k="path" v={m.spec.health.path} /><KV k="interval" v={`${m.spec.health.intervalMs / 1000}s`} /><KV k="ttl" v={`${m.spec.health.ttlMs / 1000}s`} /></SpecCard>
      </div>
    </div>
  )
}
