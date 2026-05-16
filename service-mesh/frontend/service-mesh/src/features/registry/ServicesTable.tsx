import {Badge} from '@/shared/ui'
import type {ServiceView, InstanceStatus} from '@/features/services/api/types'
import s from './ServicesTable.module.css'
import {ReactElement} from "react";
import {createColumnHelper} from "@tanstack/react-table";
import {DataTable} from "@/shared/table/DataTable.tsx";

const STATUS_VARIANT: Record<InstanceStatus, 'success' | 'warning' | 'error'> = {
    passing: 'success',
    warning: 'warning',
    critical: 'error',
}

const col = createColumnHelper<ServiceView>()
const columns = [
    col.display({
        id: 'name',
        header: 'Name',
        cell: ({row}) => <span className={s.nameCell}>{row.original.name}</span>,
    }),
    col.display({
        id: 'labels',
        header: 'Labels',
        cell: ({row}) => (
            <div className={s.labelsCell}>
                {Object.entries(row.original.labels).map(([k, v]) => (
                    <span key={k} className={s.label}>{k}={v}</span>
                ))}
            </div>
        ),
    }),
    col.display({
        id: 'instances',
        header: 'Instances',
        cell: ({row}) =>
            <span className={s.tdRight}>{row.original.instances.length}</span>,
    }),
    col.display({
        id: 'status',
        header: 'Status',
        cell: ({row}) => (
            <span className={s.tdRight}>
              <Badge variant={STATUS_VARIANT[row.original.worstStatus]}>{row.original.worstStatus}
              </Badge>
            </span>
        ),
    }),
]
type Props = {
  services: ServiceView[]
  onRowClick: (svc: ServiceView) => void
}
export function ServicesTable({services, onRowClick}: Props): ReactElement {
  return <DataTable data={services} columns={columns} onRowClick={onRowClick} />
}
