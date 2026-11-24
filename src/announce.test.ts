import { describe, expect, it } from 'vitest'
import { endMessage, scoreMessage } from './announce'

describe('screen reader messages', () => {
  it('reads the score', () => {
    expect(scoreMessage(40)).toBe('Score 40')
  })

  it('reads game over with the score and what to do next', () => {
    expect(endMessage({ status: 'over', score: 30 }, false)).toBe(
      'Game over. Score 30. Press Enter or Play again to start a new game.',
    )
  })

  it('adds "New high score!" when it is one', () => {
    expect(endMessage({ status: 'over', score: 90 }, true)).toBe(
      'Game over. Score 90. New high score! Press Enter or Play again to start a new game.',
    )
  })

  it('reads a win differently from game over', () => {
    expect(endMessage({ status: 'won', score: 3970 }, true)).toMatch(/^You win! Score 3970\. New high score!/)
  })
})
