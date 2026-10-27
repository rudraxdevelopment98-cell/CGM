import { useMemo } from 'react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceArea,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { GlucoseReading, Settings } from '../types'
import { readingsInWindow } from '../lib/stats'
import { toDisplay, unitLabel } from '../lib/units'

interface Props {
  readings: GlucoseReading[]
  settings: Settings
  days: number
}

export function GlucoseChart({ readings, settings, days }: Props) {
  const data = useMemo(() => {
    const window = readingsInWindow(readings, days)
    return window.map((r) => ({
      time: r.time,
      value: toDisplay(r.mgdl, settings.unit),
    }))
  }, [readings, settings.unit, days])

  if (data.length === 0) {
    return <p className="muted">No readings to plot. Import data or start the demo scan.</p>
  }

  const low = toDisplay(settings.targetLow, settings.unit)
  const high = toDisplay(settings.targetHigh, settings.unit)
  const maxY = settings.unit === 'mmol' ? 22 : 350

  return (
    <div className="chart-wrap">
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data} margin={{ top: 8, right: 12, left: -8, bottom: 0 }}>
          <defs>
            <linearGradient id="gGlucose" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.35} />
              <stop offset="100%" stopColor="var(--accent)" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--grid)" vertical={false} />
          <ReferenceArea y1={low} y2={high} fill="var(--inrange)" fillOpacity={0.12} />
          <XAxis
            dataKey="time"
            type="number"
            domain={['dataMin', 'dataMax']}
            scale="time"
            tickFormatter={fmtTick(days)}
            stroke="var(--muted)"
            fontSize={11}
            minTickGap={40}
          />
          <YAxis domain={[0, maxY]} stroke="var(--muted)" fontSize={11} width={38} />
          <Tooltip
            contentStyle={{
              background: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              fontSize: 12,
            }}
            labelFormatter={(t) => new Date(t as number).toLocaleString()}
            formatter={(v) => [`${v} ${unitLabel(settings.unit)}`, 'Glucose']}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke="var(--accent)"
            strokeWidth={2}
            fill="url(#gGlucose)"
            isAnimationActive={false}
            dot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

function fmtTick(days: number) {
  return (t: number) => {
    const d = new Date(t)
    if (days <= 1) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' })
  }
}
