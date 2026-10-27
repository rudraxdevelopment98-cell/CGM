import { useState } from 'react'
import type { CgmState } from '../hooks/useCgm'
import { formatGlucose, fromDisplay } from '../lib/units'
import { isVoiceSupported, listenOnce, type VoiceIntentContext } from '../lib/voice'

interface Props {
  cgm: CgmState
}

export function VoiceButton({ cgm }: Props) {
  const [listening, setListening] = useState(false)
  const [log, setLog] = useState<{ heard: string; reply: string } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const supported = isVoiceSupported()

  const ctx: VoiceIntentContext = {
    latestGlucose: () =>
      cgm.latest ? formatGlucose(cgm.latest.mgdl, cgm.settings.unit) : 'not available',
    average: (days) => {
      const s = pickWindow(cgm, days)
      return s.count
        ? `${formatGlucose(s.average, cgm.settings.unit)} over the last ${s.days} days`
        : 'not available for that period'
    },
    timeInRange: () => {
      const s = cgm.stats.d14
      return `You were in range ${s.tir.inRange}% of the time over the last 14 days.`
    },
    estimatedA1c: () => {
      const s = cgm.stats.d90
      return s.gmi
        ? `Your estimated A1c is ${s.gmi}% based on the last 90 days.`
        : 'not enough data to estimate A1c yet.'
    },
    logReading: (displayValue) => {
      const mgdl = fromDisplay(displayValue, cgm.settings.unit)
      cgm.logManual(mgdl)
      return `Logged ${formatGlucose(mgdl, cgm.settings.unit)}.`
    },
    scanNow: () => {
      cgm.scanNow()
      return cgm.latest
        ? `Scanned. Latest is ${formatGlucose(cgm.latest.mgdl, cgm.settings.unit)}.`
        : 'Scanning now.'
    },
  }

  async function onClick() {
    setError(null)
    setListening(true)
    try {
      const result = await listenOnce(ctx)
      setLog(result)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Voice error')
    } finally {
      setListening(false)
    }
  }

  if (!supported) {
    return (
      <div className="voice">
        <button className="btn-voice" disabled title="Not supported in this browser">
          🎙 Voice unavailable
        </button>
        <p className="muted small">
          Voice commands use the browser Speech API (works in Chrome/Edge/Safari).
        </p>
      </div>
    )
  }

  return (
    <div className="voice">
      <button className={`btn-voice ${listening ? 'listening' : ''}`} onClick={onClick} disabled={listening}>
        {listening ? '● Listening…' : '🎙 Voice command'}
      </button>
      {log && (
        <div className="voice-log">
          <div className="voice-heard">“{log.heard}”</div>
          <div className="voice-reply">{log.reply}</div>
        </div>
      )}
      {error && <div className="voice-error">{error}</div>}
      <p className="muted small">
        Try: “what’s my glucose”, “average this week”, “time in range”, “estimated A1c”, “log 120”, “scan now”.
      </p>
    </div>
  )
}

function pickWindow(cgm: CgmState, days: number) {
  if (days <= 1) return cgm.stats.d1
  if (days <= 7) return cgm.stats.d7
  if (days <= 14) return cgm.stats.d14
  if (days <= 30) return cgm.stats.d30
  return cgm.stats.d90
}
