// AI voice access layer built on the browser Web Speech API. It recognizes
// spoken commands, routes them to intents, and speaks responses back. This is
// the real, on-device "voice command" feature — no cloud key required.

export interface VoiceIntentContext {
  /** Latest glucose in the user's display unit, pre-formatted. */
  latestGlucose: () => string
  /** Average over N days, pre-formatted. */
  average: (days: number) => string
  /** Time-in-range summary string. */
  timeInRange: () => string
  /** Estimated A1c / GMI string. */
  estimatedA1c: () => string
  /** Log a manual reading in the display unit; returns a spoken confirmation. */
  logReading: (displayValue: number) => string
  /** Trigger an immediate scan; returns a spoken confirmation. */
  scanNow: () => string
}

export interface VoiceResult {
  heard: string
  reply: string
}

type SpeechRecognitionLike = {
  lang: string
  continuous: boolean
  interimResults: boolean
  onresult: ((e: SpeechRecognitionEvent) => void) | null
  onerror: ((e: Event) => void) | null
  onend: (() => void) | null
  start: () => void
  stop: () => void
}

type SpeechRecognitionEvent = {
  results: ArrayLike<ArrayLike<{ transcript: string }>>
}

export function isVoiceSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    (('webkitSpeechRecognition' in window) || ('SpeechRecognition' in window)) &&
    'speechSynthesis' in window
  )
}

/** Match a spoken phrase to an intent and produce a spoken reply. */
export function handleCommand(transcriptRaw: string, ctx: VoiceIntentContext): string {
  const t = transcriptRaw.toLowerCase().trim()

  // "log 120" / "log one twenty" (digits only for reliability) / "add reading 120"
  const logMatch = t.match(/\b(?:log|add|record|enter)\b.*?(\d{2,3}(?:\.\d)?)/)
  if (logMatch) {
    return ctx.logReading(Number(logMatch[1]))
  }

  if (/(scan|refresh|check)\s*(now|again|my sensor)?/.test(t) && !/average|range/.test(t)) {
    return ctx.scanNow()
  }

  if (/time in range|in range|range/.test(t)) {
    return ctx.timeInRange()
  }

  if (/a1c|a one c|estimated/.test(t)) {
    return ctx.estimatedA1c()
  }

  if (/average|mean/.test(t)) {
    const days = parseDays(t)
    return ctx.average(days)
  }

  if (/glucose|sugar|reading|level|how am i|what('| i)?s my/.test(t)) {
    return `Your latest glucose is ${ctx.latestGlucose()}.`
  }

  if (/help|what can you/.test(t)) {
    return 'Try: what is my glucose, average this week, time in range, estimated A1c, log 120, or scan now.'
  }

  return `Sorry, I didn't catch a command in "${transcriptRaw}". Say "help" for options.`
}

function parseDays(t: string): number {
  if (/today|day/.test(t)) return 1
  if (/week/.test(t)) return 7
  if (/(two weeks|fortnight|14)/.test(t)) return 14
  if (/month|30/.test(t)) return 30
  if (/90|quarter|three months/.test(t)) return 90
  const num = t.match(/(\d{1,3})\s*days?/)
  if (num) return Number(num[1])
  return 7
}

export function speak(text: string): void {
  try {
    const synth = window.speechSynthesis
    synth.cancel()
    const u = new SpeechSynthesisUtterance(text)
    u.rate = 1.0
    u.pitch = 1.0
    synth.speak(u)
  } catch {
    /* speech unavailable */
  }
}

/** Create a one-shot recognizer that resolves with what was heard + the reply. */
export function listenOnce(ctx: VoiceIntentContext): Promise<VoiceResult> {
  return new Promise((resolve, reject) => {
    const Ctor =
      (window as unknown as { SpeechRecognition?: new () => SpeechRecognitionLike })
        .SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: new () => SpeechRecognitionLike })
        .webkitSpeechRecognition
    if (!Ctor) {
      reject(new Error('Speech recognition not supported in this browser.'))
      return
    }
    const rec = new Ctor()
    rec.lang = 'en-US'
    rec.continuous = false
    rec.interimResults = false
    let done = false
    rec.onresult = (e) => {
      done = true
      const heard = e.results[0][0].transcript
      const reply = handleCommand(heard, ctx)
      speak(reply)
      resolve({ heard, reply })
    }
    rec.onerror = () => {
      if (!done) reject(new Error('Could not hear anything. Please try again.'))
    }
    rec.onend = () => {
      if (!done) reject(new Error('No speech detected.'))
    }
    rec.start()
  })
}
