import { describe, expect, it } from 'vitest'
import { bestScore, localDate, recordScore, type HighScore } from './highscores'

const hs = (score: number, date = '2026-11-01'): HighScore => ({ score, date })

describe('recordScore', () => {
  it('adds the first score to an empty table', () => {
    expect(recordScore([], hs(40))).toEqual({ highScores: [hs(40)], rank: 0 })
  })

  it('keeps the table sorted, highest first', () => {
    const { highScores, rank } = recordScore([hs(90), hs(50), hs(10)], hs(60))
    expect(highScores.map((h) => h.score)).toEqual([90, 60, 50, 10])
    expect(rank).toBe(1)
  })

  it('keeps only the top 5', () => {
    const table = [hs(90), hs(80), hs(70), hs(60), hs(50)]
    const { highScores, rank } = recordScore(table, hs(75))
    expect(highScores.map((h) => h.score)).toEqual([90, 80, 75, 70, 60])
    expect(rank).toBe(2)
  })

  it('does not add a score below a full table', () => {
    const table = [hs(90), hs(80), hs(70), hs(60), hs(50)]
    expect(recordScore(table, hs(40))).toEqual({ highScores: table, rank: null })
  })

  it('puts a tying score below the existing one', () => {
    const table = [hs(90, '2026-11-01'), hs(50, '2026-11-02'), hs(10, '2026-11-03')]
    const { highScores, rank } = recordScore(table, hs(50, '2026-11-24'))
    expect(highScores).toEqual([hs(90, '2026-11-01'), hs(50, '2026-11-02'), hs(50, '2026-11-24'), hs(10, '2026-11-03')])
    expect(rank).toBe(2)
  })

  it('does not add a score that ties the 5th place of a full table', () => {
    const table = [hs(90), hs(80), hs(70), hs(60), hs(50)]
    expect(recordScore(table, hs(50, '2026-11-24')).rank).toBeNull()
  })

  it('never saves a score of 0', () => {
    expect(recordScore([], hs(0))).toEqual({ highScores: [], rank: null })
    expect(recordScore([hs(30)], hs(0))).toEqual({ highScores: [hs(30)], rank: null })
  })

  it('does not change the table it was given', () => {
    const table = [hs(90), hs(50)]
    recordScore(table, hs(70))
    expect(table).toEqual([hs(90), hs(50)])
  })
})

describe('bestScore', () => {
  it('is 0 for an empty table and the top score otherwise', () => {
    expect(bestScore([])).toBe(0)
    expect(bestScore([hs(120), hs(30)])).toBe(120)
  })
})

describe('localDate', () => {
  it('formats a local date as YYYY-MM-DD with zero padding', () => {
    expect(localDate(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05')
    expect(localDate(new Date(2026, 10, 24, 0, 1))).toBe('2026-11-24')
  })
})
