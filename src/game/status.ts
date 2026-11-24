import type { GameState } from './types'

/** Ready → playing. Any other status is left alone. */
export function startGame(state: GameState): GameState {
  return state.status === 'ready' ? { ...state, status: 'playing' } : state
}

/** Playing ↔ paused. Any other status is left alone. Nothing else changes, so no timer moves. */
export function togglePause(state: GameState): GameState {
  if (state.status === 'playing') return { ...state, status: 'paused' }
  if (state.status === 'paused') return { ...state, status: 'playing' }
  return state
}
