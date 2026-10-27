import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { GlucoseReading, Sensor, Settings } from '../types'
import {
  loadReadings,
  loadSensor,
  loadSettings,
  mergeReadings,
  saveReadings,
  saveSensor,
  saveSettings,
} from '../lib/storage'
import { currentReading, generateHistory } from '../lib/datasources/simulator'
import { computeTrend, windowStats } from '../lib/stats'

/** Central app state: readings, settings, sensor, plus actions and derived stats. */
export function useCgm() {
  const [readings, setReadings] = useState<GlucoseReading[]>(() => loadReadings())
  const [settings, setSettingsState] = useState<Settings>(() => loadSettings())
  const [sensor, setSensorState] = useState<Sensor | null>(() => loadSensor())
  const [lastScan, setLastScan] = useState<number | null>(null)
  const scanRef = useRef<number | null>(null)

  // Persist whenever core data changes.
  useEffect(() => saveReadings(readings), [readings])
  useEffect(() => saveSettings(settings), [settings])
  useEffect(() => saveSensor(sensor), [sensor])

  // Seed demo history on first run so the app is never empty.
  useEffect(() => {
    if (readings.length === 0 && settings.dataSource === 'demo') {
      setReadings(generateHistory(14, 5))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const addReadings = useCallback((incoming: GlucoseReading[]) => {
    setReadings((prev) => mergeReadings(prev, incoming))
  }, [])

  const scanNow = useCallback(() => {
    if (settings.dataSource === 'demo') {
      addReadings([currentReading()])
    }
    setLastScan(Date.now())
  }, [settings.dataSource, addReadings])

  // Auto-scan loop driven by the configured interval.
  useEffect(() => {
    if (scanRef.current) window.clearInterval(scanRef.current)
    if (settings.scanIntervalSec > 0 && settings.dataSource === 'demo') {
      scanRef.current = window.setInterval(scanNow, settings.scanIntervalSec * 1000)
    }
    return () => {
      if (scanRef.current) window.clearInterval(scanRef.current)
    }
  }, [settings.scanIntervalSec, settings.dataSource, scanNow])

  const setSettings = useCallback((patch: Partial<Settings>) => {
    setSettingsState((prev) => ({ ...prev, ...patch }))
  }, [])

  const logManual = useCallback((mgdl: number, time = Date.now()) => {
    const r: GlucoseReading = { id: `manual-${time}`, time, mgdl: Math.round(mgdl), source: 'manual' }
    setReadings((prev) => mergeReadings(prev, [r]))
  }, [])

  const linkSensor = useCallback((s: Sensor) => setSensorState(s), [])
  const unlinkSensor = useCallback(() => setSensorState(null), [])

  const clearAll = useCallback(() => {
    setReadings([])
    setSensorState(null)
  }, [])

  const sorted = useMemo(() => [...readings].sort((a, b) => a.time - b.time), [readings])
  const latest = sorted.length ? sorted[sorted.length - 1] : null
  const trend = useMemo(() => computeTrend(sorted), [sorted])

  const stats = useMemo(
    () => ({
      d1: windowStats(readings, 1, settings),
      d7: windowStats(readings, 7, settings),
      d14: windowStats(readings, 14, settings),
      d30: windowStats(readings, 30, settings),
      d90: windowStats(readings, 90, settings),
    }),
    [readings, settings],
  )

  return {
    readings: sorted,
    settings,
    sensor,
    latest,
    trend,
    stats,
    lastScan,
    setSettings,
    addReadings,
    logManual,
    scanNow,
    linkSensor,
    unlinkSensor,
    clearAll,
  }
}

export type CgmState = ReturnType<typeof useCgm>
