import type { GlucoseReading } from '../../types'

// Demo data source: a physiologically-plausible glucose simulator so the whole
// app is usable without any real hardware. It models a daily baseline with
// meal spikes, gentle noise, and a slow random walk.

const MEALS = [
  { hour: 7.5, rise: 55, spread: 1.6 }, // breakfast
  { hour: 12.5, rise: 70, spread: 1.8 }, // lunch
  { hour: 19, rise: 65, spread: 2.0 }, // dinner
]

function glucoseAt(timeMs: number, walk: number): number {
  const d = new Date(timeMs)
  const hour = d.getHours() + d.getMinutes() / 60
  let value = 105 + walk // fasting baseline + slow drift

  for (const meal of MEALS) {
    const dt = hour - meal.hour
    if (dt >= 0) {
      // Asymmetric spike: quick rise, slower decay.
      value += meal.rise * Math.exp(-((dt - 0.6) ** 2) / (2 * meal.spread ** 2))
    }
  }

  // Dawn phenomenon: mild early-morning rise.
  value += 12 * Math.exp(-((hour - 5) ** 2) / 4)

  // Short-period noise.
  value += Math.sin(timeMs / 600_000) * 4
  value += (hashNoise(Math.round(timeMs / 300_000)) - 0.5) * 10

  return clamp(Math.round(value), 42, 360)
}

/** Generate historical readings for the past `days`, one every `stepMin` minutes. */
export function generateHistory(days = 14, stepMin = 5): GlucoseReading[] {
  const now = Date.now()
  const stepMs = stepMin * 60_000
  const start = now - days * 86_400_000
  const out: GlucoseReading[] = []
  let walk = 0
  for (let t = start; t <= now; t += stepMs) {
    walk += (hashNoise(Math.round(t / stepMs)) - 0.5) * 3
    walk = clamp(walk, -25, 30)
    out.push({
      id: `demo-${t}`,
      time: t,
      mgdl: glucoseAt(t, walk),
      source: 'demo',
    })
  }
  return out
}

/** Produce the single "current" reading for the live auto-scan. */
export function currentReading(): GlucoseReading {
  const t = Date.now()
  const walk = (hashNoise(Math.round(t / 300_000)) - 0.5) * 20
  return { id: `demo-${t}`, time: t, mgdl: glucoseAt(t, walk), source: 'demo' }
}

// Deterministic pseudo-noise in [0,1) so history is stable across reloads.
function hashNoise(seed: number): number {
  let x = Math.sin(seed * 12.9898) * 43758.5453
  x = x - Math.floor(x)
  return x
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n))
}
