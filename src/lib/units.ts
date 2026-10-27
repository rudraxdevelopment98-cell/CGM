import type { GlucoseUnit } from '../types'

/** Conversion factor between mg/dL and mmol/L. */
export const MMOL_PER_MGDL = 1 / 18.0182

/** Convert a mg/dL value into the given display unit. */
export function toDisplay(mgdl: number, unit: GlucoseUnit): number {
  if (unit === 'mmol') return round(mgdl * MMOL_PER_MGDL, 1)
  return Math.round(mgdl)
}

/** Convert a value entered in the display unit back to mg/dL for storage. */
export function fromDisplay(value: number, unit: GlucoseUnit): number {
  if (unit === 'mmol') return value / MMOL_PER_MGDL
  return value
}

export function unitLabel(unit: GlucoseUnit): string {
  return unit === 'mmol' ? 'mmol/L' : 'mg/dL'
}

/** Format a reading for display, including the unit label. */
export function formatGlucose(mgdl: number, unit: GlucoseUnit): string {
  return `${toDisplay(mgdl, unit)} ${unitLabel(unit)}`
}

function round(n: number, decimals: number): number {
  const f = 10 ** decimals
  return Math.round(n * f) / f
}
