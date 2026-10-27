import { useState } from 'react'
import type { CgmState } from '../hooks/useCgm'
import { fromDisplay, unitLabel } from '../lib/units'

interface Props {
  cgm: CgmState
}

export function ManualEntry({ cgm }: Props) {
  const [value, setValue] = useState('')
  const [ok, setOk] = useState(false)

  function submit(e: React.FormEvent) {
    e.preventDefault()
    const num = Number(value)
    if (!Number.isFinite(num) || num <= 0) return
    cgm.logManual(fromDisplay(num, cgm.settings.unit))
    setValue('')
    setOk(true)
    window.setTimeout(() => setOk(false), 1500)
  }

  return (
    <div className="panel">
      <h3>Log a reading</h3>
      <p className="muted">Add a manual fingerstick or scan value.</p>
      <form className="manual-form" onSubmit={submit}>
        <input
          type="number"
          inputMode="decimal"
          step="any"
          placeholder={`Glucose (${unitLabel(cgm.settings.unit)})`}
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
        <button className="btn" type="submit">Add</button>
      </form>
      {ok && <div className="note note-ok">Reading logged.</div>}
    </div>
  )
}
