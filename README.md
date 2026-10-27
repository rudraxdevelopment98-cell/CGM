# CGM — Continuous Glucose Monitor Data Management

A **sensor-agnostic** data-management layer for continuous glucose monitors.
Most CGMs (Abbott FreeStyle Libre, Dexcom, Medtronic…) ship closed apps that
make it hard to actually *manage* your data — comparing averages, time-in-range,
and trends across devices, or controlling things hands-free. CGM is the open
brain that sits on top of any sensor's data.

> ⚠️ **Not a medical device.** This is an informational/data-management tool.
> Never use it for treatment decisions — follow your clinician and your CGM's
> officially approved app.

## What it does (v0.1.0)

- **Live dashboard** — current glucose, trend arrow, colour-coded status, auto-refresh.
- **Clinical stats** — averages (24h / 7 / 14 / 30 / 90 day), **estimated A1c (GMI)**,
  glucose variability (CV), highs/lows, reading counts.
- **Time-in-Range** — the gold-standard breakdown across very-low → very-high bands.
- **Interactive trend chart** with your personal target-range band.
- **Data sources (pluggable):**
  - **Demo simulator** — physiologically-plausible live data so the app works with no hardware.
  - **CSV import** — Abbott LibreView & Dexcom Clarity exports (and most generic CGM CSVs).
  - **Manual entry** — log fingersticks / spot readings.
- **AI voice commands** (browser Speech API) — *"what's my glucose"*, *"average this week"*,
  *"time in range"*, *"estimated A1c"*, *"log 120"*, *"scan now"*.
- **Settings** — units (mg/dL ↔ mmol/L), target range, auto-scan frequency, voice toggle, data source.
- **Sensor tracking** — register a sensor and track wear time / session.
- All data stored **locally** in the browser (no account required in this build).

## Why not read the sensor directly?

Physical CGM sensors communicate over **NFC / Bluetooth**, which only a **native
mobile app** can access — or via the vendor cloud (e.g. the unofficial
LibreLinkUp API). A web app can't touch the radio. So CGM is built with a
**data-source abstraction** (`src/lib/datasources/`): today you feed it CSV
exports, manual entries, or the live demo; tomorrow a mobile wrapper or cloud
connector plugs into the same interface without changing the UI or the stats
engine.

## Tech

- Vite + React + TypeScript
- Recharts for charts
- Web Speech API for voice
- `localStorage` persistence (swappable storage layer for IndexedDB / backend later)

## Run it

```bash
pnpm install   # or: npm install
pnpm dev       # http://localhost:5173
pnpm build     # production build into dist/
```

## Project structure

```
src/
  types.ts                 domain types (readings, settings, sensor)
  lib/
    units.ts               mg/dL ↔ mmol/L conversion & formatting
    stats.ts               averages, GMI/eA1c, CV, time-in-range, trend
    storage.ts             local persistence (swappable)
    voice.ts               Web Speech API intents + TTS
    datasources/
      simulator.ts         live demo data generator
      csv.ts               LibreView / Dexcom / generic CSV parser
  hooks/useCgm.ts          central state, auto-scan loop, derived stats
  components/              dashboard, chart, stats, time-in-range, voice, import, settings, sensor
  App.tsx                  tabbed shell
```

## Roadmap

- Mobile wrapper (Capacitor/React Native) for real NFC/BLE sensor linking
- LibreLinkUp / Dexcom Share cloud connectors
- Accounts + backend sync (multi-device)
- Alerts & notifications (low/high, rate-of-change)
- Meal / insulin / activity logging and correlation
- Exportable clinician reports (AGP)
