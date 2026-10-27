import type { GlucoseReading, Settings, Trend } from '../types'

/** Readings within the last `days` days, sorted ascending by time. */
export function readingsInWindow(readings: GlucoseReading[], days: number): GlucoseReading[] {
  const cutoff = Date.now() - days * 86_400_000
  return readings.filter((r) => r.time >= cutoff).sort((a, b) => a.time - b.time)
}

export function mean(values: number[]): number {
  if (values.length === 0) return 0
  return values.reduce((s, v) => s + v, 0) / values.length
}

export function stdDev(values: number[]): number {
  if (values.length < 2) return 0
  const m = mean(values)
  const variance = values.reduce((s, v) => s + (v - m) ** 2, 0) / (values.length - 1)
  return Math.sqrt(variance)
}

/**
 * Glucose Management Indicator (estimated A1c) from mean glucose in mg/dL.
 * Formula from Bergenstal et al. 2018 (the standard GMI equation).
 */
export function gmi(meanMgdl: number): number {
  if (meanMgdl <= 0) return 0
  return round(3.31 + 0.02392 * meanMgdl, 1)
}

/** Coefficient of variation (%) — a key glucose-variability metric (<36% is stable). */
export function coefficientOfVariation(values: number[]): number {
  const m = mean(values)
  if (m === 0) return 0
  return round((stdDev(values) / m) * 100, 1)
}

export interface TimeInRange {
  veryLow: number // < 54
  low: number // 54–target low
  inRange: number // target low–target high
  high: number // target high–250
  veryHigh: number // > 250
  count: number
}

/** Percentage breakdown of readings across clinical glucose bands. */
export function timeInRange(readings: GlucoseReading[], s: Settings): TimeInRange {
  const t: TimeInRange = { veryLow: 0, low: 0, inRange: 0, high: 0, veryHigh: 0, count: readings.length }
  if (readings.length === 0) return t
  for (const r of readings) {
    const v = r.mgdl
    if (v < 54) t.veryLow++
    else if (v < s.targetLow) t.low++
    else if (v <= s.targetHigh) t.inRange++
    else if (v <= 250) t.high++
    else t.veryHigh++
  }
  const n = readings.length
  t.veryLow = pct(t.veryLow, n)
  t.low = pct(t.low, n)
  t.inRange = pct(t.inRange, n)
  t.high = pct(t.high, n)
  t.veryHigh = pct(t.veryHigh, n)
  return t
}

/** Derive a trend from the slope of recent readings (mg/dL per minute). */
export function computeTrend(readings: GlucoseReading[]): Trend {
  const sorted = [...readings].sort((a, b) => a.time - b.time)
  const recent = sorted.slice(-4)
  if (recent.length < 2) return 'unknown'
  const first = recent[0]
  const last = recent[recent.length - 1]
  const minutes = (last.time - first.time) / 60_000
  if (minutes <= 0) return 'unknown'
  const ratePerMin = (last.mgdl - first.mgdl) / minutes
  if (ratePerMin >= 3) return 'rising-fast'
  if (ratePerMin >= 1) return 'rising'
  if (ratePerMin <= -3) return 'falling-fast'
  if (ratePerMin <= -1) return 'falling'
  return 'steady'
}

export function trendArrow(trend: Trend): string {
  switch (trend) {
    case 'rising-fast': return '⇈'
    case 'rising': return '↗'
    case 'steady': return '→'
    case 'falling': return '↘'
    case 'falling-fast': return '⇊'
    default: return '–'
  }
}

export interface WindowStats {
  days: number
  count: number
  average: number // mg/dL
  gmi: number // %
  cv: number // %
  low: number // mg/dL
  high: number // mg/dL
  tir: TimeInRange
}

export function windowStats(readings: GlucoseReading[], days: number, s: Settings): WindowStats {
  const window = readingsInWindow(readings, days)
  const values = window.map((r) => r.mgdl)
  const avg = mean(values)
  return {
    days,
    count: window.length,
    average: Math.round(avg),
    gmi: gmi(avg),
    cv: coefficientOfVariation(values),
    low: values.length ? Math.round(Math.min(...values)) : 0,
    high: values.length ? Math.round(Math.max(...values)) : 0,
    tir: timeInRange(window, s),
  }
}

function pct(part: number, whole: number): number {
  return round((part / whole) * 100, 1)
}

function round(n: number, decimals: number): number {
  const f = 10 ** decimals
  return Math.round(n * f) / f
}
