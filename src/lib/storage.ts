import type { GlucoseReading, Sensor, Settings } from '../types'
import { DEFAULT_SETTINGS } from '../types'

// Local persistence layer. Kept behind a small API so it can be swapped for
// IndexedDB or a remote backend later without touching the UI.

const KEYS = {
  readings: 'cgm.readings',
  settings: 'cgm.settings',
  sensor: 'cgm.sensor',
}

export function loadReadings(): GlucoseReading[] {
  const raw = safeGet(KEYS.readings)
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw) as GlucoseReading[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function saveReadings(readings: GlucoseReading[]): void {
  // Keep a generous but bounded history to stay within localStorage limits.
  const trimmed = readings
    .slice()
    .sort((a, b) => a.time - b.time)
    .slice(-20_000)
  safeSet(KEYS.readings, JSON.stringify(trimmed))
}

export function loadSettings(): Settings {
  const raw = safeGet(KEYS.settings)
  if (!raw) return { ...DEFAULT_SETTINGS }
  try {
    return { ...DEFAULT_SETTINGS, ...(JSON.parse(raw) as Partial<Settings>) }
  } catch {
    return { ...DEFAULT_SETTINGS }
  }
}

export function saveSettings(settings: Settings): void {
  safeSet(KEYS.settings, JSON.stringify(settings))
}

export function loadSensor(): Sensor | null {
  const raw = safeGet(KEYS.sensor)
  if (!raw) return null
  try {
    return JSON.parse(raw) as Sensor
  } catch {
    return null
  }
}

export function saveSensor(sensor: Sensor | null): void {
  if (sensor === null) {
    safeRemove(KEYS.sensor)
    return
  }
  safeSet(KEYS.sensor, JSON.stringify(sensor))
}

/** Merge new readings into existing ones, de-duplicating by time (1-minute bucket). */
export function mergeReadings(
  existing: GlucoseReading[],
  incoming: GlucoseReading[],
): GlucoseReading[] {
  const byBucket = new Map<number, GlucoseReading>()
  for (const r of existing) byBucket.set(Math.round(r.time / 60_000), r)
  for (const r of incoming) byBucket.set(Math.round(r.time / 60_000), r)
  return Array.from(byBucket.values()).sort((a, b) => a.time - b.time)
}

function safeGet(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function safeSet(key: string, value: string): void {
  try {
    localStorage.setItem(key, value)
  } catch {
    // Storage full or unavailable (private mode) — fail quietly.
  }
}

function safeRemove(key: string): void {
  try {
    localStorage.removeItem(key)
  } catch {
    /* no-op */
  }
}
