import { describe, expect, it } from 'vitest'
import { MAX_FRAME_MS, consumeTime } from './loop'

/** Runs frames of `frameMs` for `totalMs` and counts the ticks. */
function ticksOver(totalMs: number, frameMs: number, tickMs: number): number {
  let acc = 0
  let ticks = 0
  for (let t = 0; t + frameMs <= totalMs + 1e-9; t += frameMs) {
    const r = consumeTime(acc, frameMs, tickMs)
    acc = r.accMs
    ticks += r.ticks
  }
  return ticks
}

describe('consumeTime', () => {
  const tickMs = 1000 / 7 // 7 moves per second

  // 1.1 s instead of exactly 1 s, so float rounding can't land right on a tick boundary.
  it('gives 7 ticks in a bit over a second at 30, 60 and 144 Hz', () => {
    expect(ticksOver(1100, 1000 / 30, tickMs)).toBe(7)
    expect(ticksOver(1100, 1000 / 60, tickMs)).toBe(7)
    expect(ticksOver(1100, 1000 / 144, tickMs)).toBe(7)
  })

  it('carries leftover time into the next frame', () => {
    const a = consumeTime(0, 100, tickMs)
    expect(a.ticks).toBe(0)
    const b = consumeTime(a.accMs, 100, tickMs)
    expect(b.ticks).toBe(1)
    expect(b.accMs).toBeCloseTo(200 - tickMs)
  })

  it('caps a long gap so the snake never jumps many cells', () => {
    const r = consumeTime(0, 10_000, tickMs)
    expect(r.ticks).toBe(Math.floor(MAX_FRAME_MS / tickMs))
  })

  it('ignores negative elapsed time', () => {
    expect(consumeTime(50, -20, tickMs)).toEqual({ ticks: 0, accMs: 50 })
  })
})
