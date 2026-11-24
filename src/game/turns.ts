import { opposite } from './grid'
import type { Direction, GameState } from './types'

export const MAX_QUEUED_TURNS = 2

/**
 * Queues a turn for the coming ticks. Each tick uses one queued turn.
 * Ignored when: the queue is full, the turn matches the current or last queued
 * direction, or it points straight back into the neck.
 */
export function queueTurn(state: GameState, dir: Direction): GameState {
  if (state.queuedTurns.length >= MAX_QUEUED_TURNS) return state
  const last = state.queuedTurns[state.queuedTurns.length - 1] ?? state.direction
  if (dir === last || dir === opposite(last)) return state
  return { ...state, queuedTurns: [...state.queuedTurns, dir] }
}
