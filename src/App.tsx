import { useState } from 'react'
import { useCgm } from './hooks/useCgm'
import { CurrentGlucose } from './components/CurrentGlucose'
import { StatsGrid } from './components/StatsGrid'
import { TimeInRangeBar } from './components/TimeInRangeBar'
import { GlucoseChart } from './components/GlucoseChart'
import { VoiceButton } from './components/VoiceButton'
import { ImportPanel } from './components/ImportPanel'
import { ManualEntry } from './components/ManualEntry'
import { SensorPanel } from './components/SensorPanel'
import { SettingsPanel } from './components/SettingsPanel'

type Tab = 'dashboard' | 'trends' | 'data' | 'settings'
const RANGES = [
  { label: '24h', days: 1 },
  { label: '7d', days: 7 },
  { label: '14d', days: 14 },
  { label: '30d', days: 30 },
  { label: '90d', days: 90 },
]

export default function App() {
  const cgm = useCgm()
  const [tab, setTab] = useState<Tab>('dashboard')
  const [range, setRange] = useState(1)

  const windowStats = pickStats(cgm, range)

  return (
    <div className="app">
      <header className="app-header">
        <div className="brand">
          <span className="brand-mark">◉</span>
          <div>
            <div className="brand-name">CGM</div>
            <div className="brand-tag">Continuous Glucose — Data Management</div>
          </div>
        </div>
        <nav className="tabs">
          <button className={tab === 'dashboard' ? 'active' : ''} onClick={() => setTab('dashboard')}>Dashboard</button>
          <button className={tab === 'trends' ? 'active' : ''} onClick={() => setTab('trends')}>Trends</button>
          <button className={tab === 'data' ? 'active' : ''} onClick={() => setTab('data')}>Data &amp; Sensor</button>
          <button className={tab === 'settings' ? 'active' : ''} onClick={() => setTab('settings')}>Settings</button>
        </nav>
      </header>

      <main className="app-main">
        {tab === 'dashboard' && (
          <div className="grid-dashboard">
            <div className="col-main">
              <CurrentGlucose
                latest={cgm.latest}
                trend={cgm.trend}
                settings={cgm.settings}
                lastScan={cgm.lastScan}
                onScan={cgm.scanNow}
              />
              <section className="card">
                <div className="card-head">
                  <h2>Glucose</h2>
                  <RangeTabs range={range} onChange={setRange} />
                </div>
                <GlucoseChart readings={cgm.readings} settings={cgm.settings} days={range} />
              </section>
              <section className="card">
                <h2>Last {label(range)} at a glance</h2>
                <StatsGrid stats={windowStats} settings={cgm.settings} />
              </section>
            </div>
            <aside className="col-side">
              {cgm.settings.voiceEnabled && (
                <section className="card">
                  <h2>AI voice</h2>
                  <VoiceButton cgm={cgm} />
                </section>
              )}
              <section className="card">
                <h2>Time in range · {label(range)}</h2>
                <TimeInRangeBar tir={windowStats.tir} />
              </section>
            </aside>
          </div>
        )}

        {tab === 'trends' && (
          <div className="stack">
            <section className="card">
              <div className="card-head">
                <h2>Trend</h2>
                <RangeTabs range={range} onChange={setRange} />
              </div>
              <GlucoseChart readings={cgm.readings} settings={cgm.settings} days={range} />
            </section>
            <div className="grid-two">
              <section className="card">
                <h2>Statistics · {label(range)}</h2>
                <StatsGrid stats={windowStats} settings={cgm.settings} />
              </section>
              <section className="card">
                <h2>Time in range · {label(range)}</h2>
                <TimeInRangeBar tir={windowStats.tir} />
              </section>
            </div>
            <section className="card">
              <h2>Multi-window comparison</h2>
              <ComparisonTable cgm={cgm} />
            </section>
          </div>
        )}

        {tab === 'data' && (
          <div className="grid-two">
            <SensorPanel cgm={cgm} />
            <ImportPanel cgm={cgm} />
            <ManualEntry cgm={cgm} />
            <div className="panel">
              <h3>Storage</h3>
              <p className="muted">
                {cgm.readings.length.toLocaleString()} readings stored on this device. Data stays
                local to your browser (no account required in this build).
              </p>
            </div>
          </div>
        )}

        {tab === 'settings' && (
          <div className="grid-two">
            <SettingsPanel cgm={cgm} />
            <div className="panel">
              <h3>About CGM</h3>
              <p className="muted">
                A sensor-agnostic data-management layer for continuous glucose monitors. Bring data
                from any CGM, see clear averages and time-in-range, and control it hands-free with
                voice.
              </p>
              <p className="muted small">v0.1.0 · data stored locally</p>
            </div>
          </div>
        )}
      </main>

      <footer className="app-footer">
        <span>
          Informational tool — not a medical device. Do not use for treatment decisions; follow your
          clinician and your CGM’s approved app.
        </span>
      </footer>
    </div>
  )
}

function RangeTabs({ range, onChange }: { range: number; onChange: (d: number) => void }) {
  return (
    <div className="range-tabs">
      {RANGES.map((r) => (
        <button key={r.days} className={range === r.days ? 'active' : ''} onClick={() => onChange(r.days)}>
          {r.label}
        </button>
      ))}
    </div>
  )
}

function ComparisonTable({ cgm }: { cgm: ReturnType<typeof useCgm> }) {
  const rows = [cgm.stats.d7, cgm.stats.d14, cgm.stats.d30, cgm.stats.d90]
  return (
    <table className="compare">
      <thead>
        <tr>
          <th>Window</th>
          <th>Avg (mg/dL)</th>
          <th>Est. A1c</th>
          <th>In range</th>
          <th>CV</th>
          <th>Readings</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((s) => (
          <tr key={s.days}>
            <td>{s.days}d</td>
            <td>{s.average || '--'}</td>
            <td>{s.gmi ? `${s.gmi}%` : '--'}</td>
            <td>{s.tir.inRange}%</td>
            <td>{s.cv ? `${s.cv}%` : '--'}</td>
            <td>{s.count}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function pickStats(cgm: ReturnType<typeof useCgm>, days: number) {
  switch (days) {
    case 1: return cgm.stats.d1
    case 7: return cgm.stats.d7
    case 14: return cgm.stats.d14
    case 30: return cgm.stats.d30
    default: return cgm.stats.d90
  }
}

function label(days: number): string {
  return days === 1 ? '24h' : `${days}d`
}
