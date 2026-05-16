import {ReactElement} from "react";
import styles from "@/features/routing-rules/ui/RulesTable/RulesTable.module.css";

type ColumnDef = {
    styles: CSSModuleClasses,
    name: string,
}
type DataType = {
    id: string,
    name: string,
}

export function DataTable(columns: ColumnDef[], data: DataType[]): ReactElement {
    return (
        <>
            <table style={{width: '100%', borderCollapse: 'collapse'}}>
                <thead>
                <tr style={{borderBottom: '1px solid var(--color-border)'}}>
                    {columns
                        .map(column =>
                            <th key={column.name} className={column.styles.th}>{column.name}</th>)}
                </tr>
                </thead>
                <tbody>
                {data.map(item =>
                        <tr key={item.id} className={styles.row}>
                            <td className={`${styles.td} ${styles.tdMono}`}>{item.name}</td>
                            {}
                        </tr>
                    )
                }
                </tbody>
            </table>
        </>
    )
}
