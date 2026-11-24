import { EFFECT_TICKS, type GameState } from './game'

const EFFECT_NAME = { boost: 'Boost', slowmo: 'Slow-mo' } as const

export type HudElements = {
  score: HTMLElement
  best: HTMLElement
  effect: HTMLElement
  effectName: HTMLElement
  effectBar: HTMLElement
  effectFill: HTMLElement
}

/** The strip above the board: score, best score, plus the active effect with a bar for its time left. */
export function createHud(el: HudElements) {
  let lastScore = -1
  let lastBest = -1
  let lastEffect = ''

  return function update(state: GameState, best: number): void {
    if (best !== lastBest) {
      lastBest = best
      el.best.textContent = String(best)
    }

    if (state.score !== lastScore) {
      lastScore = state.score
      el.score.textContent = String(state.score)
    }

    const effect = state.effect
    const key = effect ? `${effect.kind}:${effect.ticksLeft}` : ''
    if (key === lastEffect) return
    lastEffect = key

    if (!effect) {
      el.effect.hidden = true
      return
    }
    el.effect.hidden = false
    el.effect.dataset.kind = effect.kind
    el.effectName.textContent = EFFECT_NAME[effect.kind]
    const percent = Math.round((effect.ticksLeft / EFFECT_TICKS) * 100)
    el.effectFill.style.width = `${percent}%`
    el.effectBar.setAttribute('aria-valuenow', String(percent))
  }
}
