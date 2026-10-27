import type { TimeInRange } from '../lib/stats'

interface Props {
  tir: TimeInRange
}

const SEGMENTS: { key: keyof TimeInRange; label: string; cls: string }[] = [
  { key: 'veryHigh', label: 'Very High (>250)', cls: 'seg-veryhigh' },
  { key: 'high', label: 'High', cls: 'seg-high' },
  { key: 'inRange', label: 'In Range', cls: 'seg-inrange' },
  { key: 'low', label: 'Low', cls: 'seg-low' },
  { key: 'veryLow', label: 'Very Low (<54)', cls: 'seg-verylow' },
]

export function TimeInRangeBar({ tir }: Props) {
  if (tir.count === 0) {
    return <p className="muted">No readings in this window.</p>
  }
  return (
    <div className="tir">
      <div className="tir-bar" role="img" aria-label="Time in range breakdown">
        {SEGMENTS.map((s) => {
          const v = tir[s.key] as number
          if (v <= 0) return null
          return (
            <div
              key={s.key}
              className={`tir-seg ${s.cls}`}
              style={{ height: `${v}%` }}
              title={`${s.label}: ${v}%`}
            >
              {v >= 8 ? `${Math.round(v)}%` : ''}
            </div>
          )
        })}
      </div>
      <ul className="tir-legend">
        {SEGMENTS.map((s) => (
          <li key={s.key}>
            <span className={`dot ${s.cls}`} /> {s.label}
            <strong>{(tir[s.key] as number).toFixed(1)}%</strong>
          </li>
        ))}
      </ul>
    </div>
  )
}
