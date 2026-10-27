import type { GlucoseReading } from '../../types'

// CSV importer for the exports people can download today from vendor portals:
//   • Abbott LibreView ("Glucose Reading", date "MM-DD-YYYY HH:MM")
//   • Dexcom Clarity ("Glucose Value (mg/dL)" / "(mmol/L)", ISO timestamp)
// It is tolerant: it sniffs the header row and falls back to generic
// timestamp + value columns so most CGM exports just work.

export interface ParseResult {
  readings: GlucoseReading[]
  skipped: number
  detected: string
}

export function parseCsv(text: string): ParseResult {
  const rows = splitRows(text)
  if (rows.length === 0) return { readings: [], skipped: 0, detected: 'empty file' }

  // LibreView prefixes a patient/name line before the real header; find the
  // first row that looks like a header (contains "glucose" or a date word).
  let headerIdx = rows.findIndex((r) =>
    r.some((c) => /glucose|timestamp|device timestamp|time/i.test(c)),
  )
  if (headerIdx === -1) headerIdx = 0
  const header = rows[headerIdx].map((c) => c.trim().toLowerCase())

  const timeCol = pickColumn(header, ['device timestamp', 'timestamp', 'time', 'date'])
  const mmolCol = pickColumn(header, ['glucose value (mmol/l)', 'glucose (mmol/l)', 'mmol/l'])
  const mgdlCol = pickColumn(header, [
    'glucose value (mg/dl)',
    'historic glucose mg/dl',
    'scan glucose mg/dl',
    'glucose reading',
    'glucose (mg/dl)',
    'glucose',
    'mg/dl',
  ])

  const valueCol = mgdlCol !== -1 ? mgdlCol : mmolCol
  const isMmol = mgdlCol === -1 && mmolCol !== -1
  const detected =
    timeCol === -1 || valueCol === -1
      ? 'unrecognized format'
      : isMmol
        ? 'CGM export (mmol/L)'
        : 'CGM export (mg/dL)'

  const readings: GlucoseReading[] = []
  let skipped = 0

  for (let i = headerIdx + 1; i < rows.length; i++) {
    const cells = rows[i]
    const rawTime = cells[timeCol]
    const rawValue = cells[valueCol]
    if (!rawTime || rawValue === undefined || rawValue === '') {
      skipped++
      continue
    }
    const time = parseTime(rawTime)
    const value = Number(String(rawValue).replace(',', '.'))
    if (time === null || !Number.isFinite(value)) {
      skipped++
      continue
    }
    const mgdl = isMmol ? Math.round(value * 18.0182) : Math.round(value)
    if (mgdl < 20 || mgdl > 600) {
      skipped++
      continue
    }
    readings.push({ id: `csv-${time}-${i}`, time, mgdl, source: 'csv' })
  }

  return { readings, skipped, detected }
}

function pickColumn(header: string[], candidates: string[]): number {
  for (const c of candidates) {
    const idx = header.indexOf(c)
    if (idx !== -1) return idx
  }
  // Loose contains-match fallback.
  for (const c of candidates) {
    const idx = header.findIndex((h) => h.includes(c))
    if (idx !== -1) return idx
  }
  return -1
}

function parseTime(raw: string): number | null {
  const s = raw.trim()
  // Native parse handles ISO 8601 and many locale formats.
  const native = Date.parse(s)
  if (Number.isFinite(native)) return native
  // LibreView style: MM-DD-YYYY HH:MM
  const m = s.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})\s+(\d{1,2}):(\d{2})/)
  if (m) {
    const [, mm, dd, yyyy, hh, min] = m
    return new Date(+yyyy, +mm - 1, +dd, +hh, +min).getTime()
  }
  return null
}

// Minimal CSV splitter with quoted-field support.
function splitRows(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let inQuotes = false
  const pushField = () => {
    row.push(field)
    field = ''
  }
  const pushRow = () => {
    pushField()
    if (row.some((c) => c.trim() !== '')) rows.push(row)
    row = []
  }
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"'
          i++
        } else inQuotes = false
      } else field += ch
    } else if (ch === '"') inQuotes = true
    else if (ch === ',') pushField()
    else if (ch === '\n') pushRow()
    else if (ch === '\r') {
      /* ignore */
    } else field += ch
  }
  if (field !== '' || row.length > 0) pushRow()
  return rows
}
