# Build log: Snake With Power-Ups

One entry per slice, added by `/checkpoint` after each slice is approved. Changes between slices get their own entry (5b, 5c). The notes are what make the episode: what surprised me, what the AI got wrong, what I changed.

## Slice 1 · Project setup
- Date: 2026-11-24
- My note: Everything looks good
- What changed:
  - Vite + TypeScript (strict, no framework) with Vitest; scripts for dev, test, typecheck, build and preview
  - One `tsconfig.json` instead of three, so `vite.config.ts` needs no `@types/node`
  - Blank page with a square `<canvas>` board, and a placeholder smoke test
  - `.gitignore` for `node_modules` and `dist`
- Problems and fixes: None
- Lesson: Keep setup to just what the plan names (three dev dependencies) and prove every script runs before writing any game code.
- Plan changes: None
- Tests: 1 passed, 0 failed
- Size: 9 files changed, +144 / −0 lines (package-lock.json left out: +1585)
- Hand-coding estimate: 15–30 minutes; mostly scaffolding Vite and getting the TypeScript and Vitest config right
