// Core domain types for CGM — Continuous Glucose Monitor data management.

/** Glucose values are always stored internally in mg/dL (the clinical base unit). */
export type GlucoseUnit = 'mgdl' | 'mmol'

/** A single glucose measurement. */
export interface GlucoseReading {
  /** Unique id (timestamp-based is fine for a local store). */
  id: string
  /** Epoch milliseconds when the reading was taken. */
  time: number
  /** Glucose value in mg/dL (always — convert for display only). */
  mgdl: number
  /** Where the value came from. */
  source: ReadingSource
}

export type ReadingSource = 'demo' | 'manual' | 'csv' | 'sensor' | 'cloud'

/** Trend direction derived from recent readings. */
export type Trend =
  | 'rising-fast'
  | 'rising'
  | 'steady'
  | 'falling'
  | 'falling-fast'
  | 'unknown'

/** A linked sensor (real integration is mobile/cloud; this models the record). */
export interface Sensor {
  id: string
  brand: string
  model: string
  /** Epoch ms the sensor was activated. */
  activatedAt: number
  /** Typical wear duration in days (e.g. 14 for Libre). */
  wearDays: number
  status: 'active' | 'expired' | 'disconnected'
}

/** User-configurable settings. */
export interface Settings {
  unit: GlucoseUnit
  /** Target range low/high in mg/dL. */
  targetLow: number
  targetHigh: number
  /** How often the app auto-scans the data source, in seconds. 0 = off. */
  scanIntervalSec: number
  /** Active data source id. */
  dataSource: ReadingSource
  /** Enable AI voice commands. */
  voiceEnabled: boolean
  /** Alert thresholds in mg/dL. */
  alertLow: number
  alertHigh: number
}

export const DEFAULT_SETTINGS: Settings = {
  unit: 'mgdl',
  targetLow: 70,
  targetHigh: 180,
  scanIntervalSec: 60,
  dataSource: 'demo',
  voiceEnabled: true,
  alertLow: 70,
  alertHigh: 250,
}
