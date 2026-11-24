import type { HighScore } from './game'

export type ScoresPanelElements = {
  dialog: HTMLDialogElement
  body: HTMLElement
  empty: HTMLElement
  actions: HTMLElement
  clear: HTMLButtonElement
  close: HTMLButtonElement
  confirm: HTMLElement
  confirmYes: HTMLButtonElement
  confirmNo: HTMLButtonElement
}

/**
 * The high-scores panel: a modal dialog with the top 5 and a Clear button.
 * Clearing asks first. Escape or Close shuts it.
 */
export function createScoresPanel(el: ScoresPanelElements, onClear: () => HighScore[]) {
  function render(scores: readonly HighScore[]): void {
    el.body.replaceChildren(
      ...scores.map((h, i) => {
        const row = document.createElement('tr')
        for (const text of [String(i + 1), String(h.score), h.date]) {
          const td = document.createElement('td')
          td.textContent = text
          row.append(td)
        }
        return row
      }),
    )
    const none = scores.length === 0
    el.empty.hidden = !none
    el.body.closest('table')?.toggleAttribute('hidden', none)
    el.clear.disabled = none
  }

  function showConfirm(show: boolean): void {
    el.confirm.hidden = !show
    el.actions.hidden = show
    ;(show ? el.confirmNo : el.close).focus()
  }

  el.clear.addEventListener('click', () => showConfirm(true))
  el.confirmNo.addEventListener('click', () => showConfirm(false))
  el.confirmYes.addEventListener('click', () => {
    render(onClear())
    showConfirm(false)
  })
  el.close.addEventListener('click', () => el.dialog.close())
  // Closing with Escape mid-confirm shouldn't leave the confirm step showing next time.
  el.dialog.addEventListener('close', () => {
    el.confirm.hidden = true
    el.actions.hidden = false
  })

  return {
    open(scores: readonly HighScore[]): void {
      render(scores)
      el.confirm.hidden = true
      el.actions.hidden = false
      el.dialog.showModal()
      el.close.focus()
    },
    isOpen: () => el.dialog.open,
  }
}
