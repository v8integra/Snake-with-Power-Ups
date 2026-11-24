import { describe, expect, it } from 'vitest'
import { SWIPE_THRESHOLD_PX, swipeDirection } from './swipe'

describe('swipeDirection', () => {
  it.each([
    [40, 0, 'right'],
    [-40, 0, 'left'],
    [0, 40, 'down'],
    [0, -40, 'up'],
  ] as const)('dx %i, dy %i is %s', (dx, dy, dir) => {
    expect(swipeDirection(dx, dy)).toBe(dir)
  })

  it('ignores a drag shorter than the threshold (a tap or a wobble)', () => {
    expect(swipeDirection(0, 0)).toBeNull()
    expect(swipeDirection(SWIPE_THRESHOLD_PX - 1, 5)).toBeNull()
    expect(swipeDirection(-8, 12)).toBeNull()
  })

  it('counts a drag exactly at the threshold', () => {
    expect(swipeDirection(SWIPE_THRESHOLD_PX, 0)).toBe('right')
  })

  it('uses the longer axis for a diagonal drag', () => {
    expect(swipeDirection(30, 22)).toBe('right')
    expect(swipeDirection(-22, -30)).toBe('up')
    expect(swipeDirection(-35, 34)).toBe('left')
  })

  it('takes a custom threshold', () => {
    expect(swipeDirection(30, 0, 50)).toBeNull()
    expect(swipeDirection(60, 0, 50)).toBe('right')
  })
})
