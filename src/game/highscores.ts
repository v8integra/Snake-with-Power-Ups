export type HighScore = { score: number; date: string } // date: local "YYYY-MM-DD"

export const MAX_HIGH_SCORES = 5

export type RecordResult = {
  highScores: HighScore[]
  /** Where the new score landed (0 = best), or null if it didn't make the table. */
  rank: number | null
}

/**
 * Adds a finished game's score to the table.
 * Keeps the top 5. A score that ties an existing one goes below it. A score of 0 is never saved.
 */
export function recordScore(highScores: readonly HighScore[], entry: HighScore): RecordResult {
  const table = highScores.slice(0, MAX_HIGH_SCORES)
  if (entry.score <= 0) return { highScores: table, rank: null }

  // Insert after every entry with an equal or higher score, so earlier ties stay above.
  let rank = table.findIndex((h) => h.score < entry.score)
  if (rank === -1) rank = table.length
  if (rank >= MAX_HIGH_SCORES) return { highScores: table, rank: null }

  const next = [...table.slice(0, rank), entry, ...table.slice(rank)].slice(0, MAX_HIGH_SCORES)
  return { highScores: next, rank }
}

/** The best score in the table, or 0 when it's empty. */
export function bestScore(highScores: readonly HighScore[]): number {
  return highScores[0]?.score ?? 0
}

/** A date as local "YYYY-MM-DD". */
export function localDate(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}
