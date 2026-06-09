import {Badge} from '@/shared/ui'
import type {ServiceView, InstanceStatus} from '@/features/services'
import s from './ServicesTable.module.css'
import {ReactElement} from "react";
import {createColumnHelper} from "@tanstack/react-table";
import {DataTable} from "@/shared/table/DataTable";

/**
 * Maps an instance status to the Badge variant used by the design system.
 *
 * @sideEffects none
 */
const STATUS_VARIANT: Record<InstanceStatus, 'success' | 'warning' | 'error'> = {
    passing: 'success',
    warning: 'warning',
    critical: 'error',
}

const col = createColumnHelper<ServiceView>()

/**
 * Column definitions for the services table.
 *
 * Renders the service name, labels, instance count, and worst-case status.
 *
 * @sideEffects none
 */
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
  /** Services to render in the table. */
  services: ServiceView[]

  /** Called when the user clicks a table row. */
  onRowClick: (svc: ServiceView) => void
}

/**
 * Table of registered services with name, labels, instance count, and status.
 *
 * Row clicks are forwarded to `onRowClick` so the parent can handle navigation
 * or selection without the table knowing about the router.
 *
 * @param services   - Array of services to display
 * @param onRowClick - Row click handler
 * @returns The rendered table element
 * @sideEffects none
 */
export function ServicesTable({services, onRowClick}: Props): ReactElement {
  return <DataTable data={services} columns={columns} onRowClick={onRowClick} />
}
