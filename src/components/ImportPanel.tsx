import { useRef, useState } from 'react'
import type { CgmState } from '../hooks/useCgm'
import { parseCsv } from '../lib/datasources/csv'

interface Props {
  cgm: CgmState
}

export function ImportPanel({ cgm }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [msg, setMsg] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    setMsg(null)
    setErr(null)
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const text = await file.text()
      const result = parseCsv(text)
      if (result.readings.length === 0) {
        setErr(`No readings found (${result.detected}). Check the file is a CGM glucose export.`)
        return
      }
      cgm.addReadings(result.readings)
      setMsg(
        `Imported ${result.readings.length} readings (${result.detected})` +
          (result.skipped ? `, skipped ${result.skipped} rows.` : '.'),
      )
    } catch {
      setErr('Could not read that file.')
    } finally {
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div className="panel">
      <h3>Import CGM data</h3>
      <p className="muted">
        Export a CSV from your CGM portal and import it here. Supports{' '}
        <strong>Abbott LibreView</strong> and <strong>Dexcom Clarity</strong> exports, plus most
        generic timestamp + glucose CSVs.
      </p>
      <input ref={inputRef} type="file" accept=".csv,text/csv" onChange={onFile} className="file-input" />
      {msg && <div className="note note-ok">{msg}</div>}
      {err && <div className="note note-err">{err}</div>}
      <details className="hint">
        <summary>How to export</summary>
        <ul>
          <li><strong>LibreView:</strong> Menu → Reports / Download glucose data → CSV.</li>
          <li><strong>Dexcom Clarity:</strong> Settings → Export → CSV.</li>
        </ul>
      </details>
    </div>
  )
}
