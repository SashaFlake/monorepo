// TODO: визуализация распределения весов
// Props: destinations: Destination[]
import type {Destination} from '../types'

type Props = {
    destinations: Destination[]
}


export const WeightBar = ({destinations}: Props) => {
    return (
        <div style={{display: 'flex', height: 8, borderRadius: 4, overflow: 'hidden'}}>
            {destinations.map((d, i) => (
                    <div
                        key={i}
                        style={{width: `${d.weightPct}%`, background: i === 0 ? '#01696f' : '#4f98a3'}}
                        title={`${d.version ?? 'default'}: ${d.weightPct}%`}
                    />
                )
            )}
        </div>
    )
}
