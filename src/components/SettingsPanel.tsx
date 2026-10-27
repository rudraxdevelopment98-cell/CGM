import type { CgmState } from '../hooks/useCgm'
import type { GlucoseUnit } from '../types'
import { toDisplay, fromDisplay, unitLabel } from '../lib/units'

interface Props {
  cgm: CgmState
}

const SCAN_OPTIONS = [
  { label: 'Off', sec: 0 },
  { label: 'Every 15s', sec: 15 },
  { label: 'Every 1 min', sec: 60 },
  { label: 'Every 5 min', sec: 300 },
  { label: 'Every 15 min', sec: 900 },
]

export function SettingsPanel({ cgm }: Props) {
  const { settings, setSettings } = cgm

  function setUnit(unit: GlucoseUnit) {
    setSettings({ unit })
  }

  function setTarget(which: 'targetLow' | 'targetHigh', displayVal: number) {
    setSettings({ [which]: Math.round(fromDisplay(displayVal, settings.unit)) })
  }

  return (
    <div className="panel">
      <h3>Settings</h3>

      <div className="setting-row">
        <label>Units</label>
        <div className="seg-control">
          <button className={settings.unit === 'mgdl' ? 'active' : ''} onClick={() => setUnit('mgdl')}>
            mg/dL
          </button>
          <button className={settings.unit === 'mmol' ? 'active' : ''} onClick={() => setUnit('mmol')}>
            mmol/L
          </button>
        </div>
      </div>

      <div className="setting-row">
        <label>Target range ({unitLabel(settings.unit)})</label>
        <div className="range-inputs">
          <input
            type="number"
            step="any"
            value={toDisplay(settings.targetLow, settings.unit)}
            onChange={(e) => setTarget('targetLow', Number(e.target.value))}
          />
          <span>to</span>
          <input
            type="number"
            step="any"
            value={toDisplay(settings.targetHigh, settings.unit)}
            onChange={(e) => setTarget('targetHigh', Number(e.target.value))}
          />
        </div>
      </div>

      <div className="setting-row">
        <label>Auto-scan frequency</label>
        <select
          value={settings.scanIntervalSec}
          onChange={(e) => setSettings({ scanIntervalSec: Number(e.target.value) })}
        >
          {SCAN_OPTIONS.map((o) => (
            <option key={o.sec} value={o.sec}>{o.label}</option>
          ))}
        </select>
      </div>

      <div className="setting-row">
        <label>AI voice commands</label>
        <label className="switch">
          <input
            type="checkbox"
            checked={settings.voiceEnabled}
            onChange={(e) => setSettings({ voiceEnabled: e.target.checked })}
          />
          <span className="slider" />
        </label>
      </div>

      <div className="setting-row">
        <label>Data source</label>
        <select
          value={settings.dataSource}
          onChange={(e) => setSettings({ dataSource: e.target.value as never })}
        >
          <option value="demo">Demo simulator (live)</option>
          <option value="csv">CSV import only</option>
          <option value="manual">Manual entry only</option>
        </select>
      </div>

      <div className="setting-row">
        <label>Danger zone</label>
        <button
          className="btn-danger"
          onClick={() => {
            if (confirm('Delete all readings and unlink the sensor? This cannot be undone.')) {
              cgm.clearAll()
            }
          }}
        >
          Clear all data
        </button>
      </div>
    </div>
  )
}
