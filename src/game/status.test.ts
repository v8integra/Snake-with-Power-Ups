import { describe, expect, it } from 'vitest'
import { startGame, togglePause } from './status'
import { step } from './step'
import { makeState, rng } from './testUtils'
import type { GameStatus } from './types'

describe('startGame', () => {
  it('moves ready to playing', () => {
    expect(startGame(makeState({ status: 'ready' })).status).toBe('playing')
  })

  it.each<GameStatus>(['playing', 'paused', 'over', 'won'])('leaves %s alone', (status) => {
    const s = makeState({ status })
    expect(startGame(s)).toBe(s)
  })
})

describe('togglePause', () => {
  it('pauses and resumes', () => {
    const paused = togglePause(makeState({ status: 'playing' }))
    expect(paused.status).toBe('paused')
    expect(togglePause(paused).status).toBe('playing')
  })

  it.each<GameStatus>(['ready', 'over', 'won'])('leaves %s alone', (status) => {
    const s = makeState({ status })
    expect(togglePause(s)).toBe(s)
  })

  it('freezes the game while paused: steps change nothing, then play resumes where it was', () => {
    const playing = makeState({ tick: 12 })
    let s = togglePause(playing)
    for (let i = 0; i < 50; i++) s = step(s, rng())
    s = togglePause(s)
    expect(s).toEqual(playing)
  })
})
