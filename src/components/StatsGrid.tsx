import type { Settings } from '../types'
import type { WindowStats } from '../lib/stats'
import { toDisplay, unitLabel } from '../lib/units'

interface Props {
  stats: WindowStats
  settings: Settings
}

/** Key metrics for one time window (average, GMI/eA1c, variability, extremes). */
export function StatsGrid({ stats, settings }: Props) {
  const u = unitLabel(settings.unit)
  return (
    <div className="stat-grid">
      <Stat label="Average" value={`${toDisplay(stats.average, settings.unit)}`} sub={u} />
      <Stat label="Est. A1c (GMI)" value={stats.gmi ? `${stats.gmi}%` : '--'} sub="estimated" />
      <Stat label="In range" value={`${stats.tir.inRange}%`} sub="time in range" accent="good" />
      <Stat label="Variability" value={stats.cv ? `${stats.cv}%` : '--'} sub="CV · aim <36%" accent={stats.cv > 36 ? 'warn' : 'good'} />
      <Stat label="Lowest" value={`${toDisplay(stats.low, settings.unit)}`} sub={u} />
      <Stat label="Highest" value={`${toDisplay(stats.high, settings.unit)}`} sub={u} />
      <Stat label="Readings" value={`${stats.count}`} sub={`last ${stats.days}d`} />
    </div>
  )
}

function Stat({
  label,
  value,
  sub,
  accent,
}: {
  label: string
  value: string
  sub?: string
  accent?: 'good' | 'warn'
}) {
  return (
    <div className={`stat ${accent ? `stat-${accent}` : ''}`}>
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
      {sub && <div className="stat-sub">{sub}</div>}
    </div>
  )
}
