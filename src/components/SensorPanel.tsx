import { useState } from 'react'
import type { CgmState } from '../hooks/useCgm'
import type { Sensor } from '../types'

interface Props {
  cgm: CgmState
}

const BRANDS = [
  { brand: 'Abbott', model: 'FreeStyle Libre 3', wearDays: 14 },
  { brand: 'Abbott', model: 'FreeStyle Libre 2', wearDays: 14 },
  { brand: 'Dexcom', model: 'G7', wearDays: 10 },
  { brand: 'Dexcom', model: 'G6', wearDays: 10 },
  { brand: 'Medtronic', model: 'Guardian 4', wearDays: 7 },
]

export function SensorPanel({ cgm }: Props) {
  const { sensor } = cgm
  const [sel, setSel] = useState(0)

  function link() {
    const b = BRANDS[sel]
    const s: Sensor = {
      id: `sensor-${Date.now()}`,
      brand: b.brand,
      model: b.model,
      activatedAt: Date.now(),
      wearDays: b.wearDays,
      status: 'active',
    }
    cgm.linkSensor(s)
  }

  if (sensor) {
    const expiresAt = sensor.activatedAt + sensor.wearDays * 86_400_000
    const remainingMs = expiresAt - Date.now()
    const remainingDays = Math.max(0, remainingMs / 86_400_000)
    const pctWorn = Math.min(100, 100 - (remainingDays / sensor.wearDays) * 100)
    return (
      <div className="panel">
        <h3>Linked sensor</h3>
        <div className="sensor-card">
          <div className="sensor-name">
            {sensor.brand} {sensor.model}
          </div>
          <div className="sensor-sub">
            Activated {new Date(sensor.activatedAt).toLocaleDateString()} · {sensor.wearDays}-day wear
          </div>
          <div className="wear-bar">
            <div className="wear-fill" style={{ width: `${pctWorn}%` }} />
          </div>
          <div className="sensor-sub">
            {remainingDays >= 1
              ? `${Math.floor(remainingDays)} day(s) remaining`
              : remainingMs > 0
                ? `${Math.floor(remainingMs / 3_600_000)} hour(s) remaining`
                : 'Sensor expired — replace it'}
          </div>
          <button className="btn-ghost" onClick={cgm.unlinkSensor}>Unlink sensor</button>
        </div>
        <p className="muted small">
          Note: live readings from physical sensors require NFC/Bluetooth via a mobile app (planned).
          This panel tracks your sensor session and wear time; data today comes from CSV import,
          manual entry, or the demo source.
        </p>
      </div>
    )
  }

  return (
    <div className="panel">
      <h3>Link a sensor</h3>
      <p className="muted">Register your CGM sensor to track wear time and session.</p>
      <div className="manual-form">
        <select value={sel} onChange={(e) => setSel(Number(e.target.value))}>
          {BRANDS.map((b, i) => (
            <option key={i} value={i}>
              {b.brand} {b.model} ({b.wearDays}d)
            </option>
          ))}
        </select>
        <button className="btn" onClick={link}>Link</button>
      </div>
    </div>
  )
}
