import { MAX_HIGH_SCORES, type HighScore } from './game'

export const STORAGE_KEY = 'snake:v1'
export const BACKUP_KEY = 'snake:v1:backup'

export type SavedData = { version: 1; highScores: HighScore[] }

/** The parts of localStorage this file uses, so tests can pass in a fake. */
export type KeyValueStore = Pick<Storage, 'getItem' | 'setItem'>

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

function isHighScore(v: unknown): v is HighScore {
  if (typeof v !== 'object' || v === null) return false
  const { score, date } = v as Record<string, unknown>
  return (
    typeof score === 'number' &&
    Number.isInteger(score) &&
    score > 0 &&
    typeof date === 'string' &&
    DATE_RE.test(date)
  )
}

function parseSaved(raw: string): HighScore[] | null {
  let data: unknown
  try {
    data = JSON.parse(raw)
  } catch {
    return null
  }
  if (typeof data !== 'object' || data === null) return null
  const { version, highScores } = data as Record<string, unknown>
  if (version !== 1 || !Array.isArray(highScores) || !highScores.every(isHighScore)) return null
  // Keep the table in order and at most 5 long, even if it was edited by hand.
  return [...highScores].sort((a, b) => b.score - a.score).slice(0, MAX_HIGH_SCORES)
}

/**
 * Reads the high scores. Missing data gives an empty table.
 * Broken data also gives an empty table, after copying the broken text to the backup key.
 * If storage can't be used at all (blocked, private mode), the game still runs with an empty table.
 */
export function loadHighScores(store: KeyValueStore): HighScore[] {
  let raw: string | null
  try {
    raw = store.getItem(STORAGE_KEY)
  } catch {
    return []
  }
  if (raw === null) return []

  const parsed = parseSaved(raw)
  if (parsed) return parsed

  try {
    store.setItem(BACKUP_KEY, raw)
  } catch {
    // Nothing more we can do; the table still starts empty.
  }
  return []
}

/** Saves the high scores. Returns false if storage refused (full or blocked). */
export function saveHighScores(store: KeyValueStore, highScores: readonly HighScore[]): boolean {
  const data: SavedData = { version: 1, highScores: highScores.slice(0, MAX_HIGH_SCORES) }
  try {
    store.setItem(STORAGE_KEY, JSON.stringify(data))
    return true
  } catch {
    return false
  }
}

/** The browser's localStorage, or null if even touching it throws. */
export function browserStore(): KeyValueStore | null {
  try {
    return window.localStorage
  } catch {
    return null
  }
}
