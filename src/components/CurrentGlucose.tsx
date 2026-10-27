import type { GlucoseReading, Settings, Trend } from '../types'
import { toDisplay, unitLabel } from '../lib/units'
import { trendArrow } from '../lib/stats'

interface Props {
  latest: GlucoseReading | null
  trend: Trend
  settings: Settings
  lastScan: number | null
  onScan: () => void
}

export function CurrentGlucose({ latest, trend, settings, lastScan, onScan }: Props) {
  const status = latest ? bandFor(latest.mgdl, settings) : 'none'
  const value = latest ? toDisplay(latest.mgdl, settings.unit) : '--'

  return (
    <section className={`current-card band-${status}`}>
      <div className="current-top">
        <span className="current-label">Current glucose</span>
        <button className="btn-ghost" onClick={onScan} title="Scan now">
          ⟳ Scan
        </button>
      </div>
      <div className="current-value">
        <span className="current-number">{value}</span>
        <span className="current-trend" title={trend}>{trendArrow(trend)}</span>
      </div>
      <div className="current-unit">{unitLabel(settings.unit)}</div>
      <div className="current-meta">
        <span className={`pill pill-${status}`}>{statusLabel(status)}</span>
        <span className="current-time">
          {latest ? `Reading: ${timeAgo(latest.time)}` : 'No data yet'}
          {lastScan ? ` · Scanned ${timeAgo(lastScan)}` : ''}
        </span>
      </div>
    </section>
  )
}

function bandFor(mgdl: number, s: Settings): 'low' | 'in' | 'high' | 'crit' {
  if (mgdl < 54 || mgdl > 250) return 'crit'
  if (mgdl < s.targetLow) return 'low'
  if (mgdl > s.targetHigh) return 'high'
  return 'in'
}

function statusLabel(status: string): string {
  switch (status) {
    case 'in': return 'In range'
    case 'low': return 'Low'
    case 'high': return 'High'
    case 'crit': return 'Urgent'
    default: return 'No data'
  }
}

function timeAgo(t: number): string {
  const s = Math.round((Date.now() - t) / 1000)
  if (s < 60) return `${s}s ago`
  const m = Math.round(s / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.round(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.round(h / 24)}d ago`
}
