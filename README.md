# Snake With Power-Ups

A classic snake game for the browser, with three power-ups, inner walls that show up once you're doing well, and a local high-score table. Keyboard on desktop, swipes or an on-screen pad on a phone. No accounts, no server.

**Play it:** https://v8integra.github.io/Snake-with-Power-Ups/ (live once GitHub Pages is set up; see [Deploy](#deploy-to-github-pages))

Built as build-along #2 with Claude Code, one slice at a time. [`build-log.md`](build-log.md) has the notes from each slice, and [`snake-with-power-ups-plan.md`](snake-with-power-ups-plan.md) is the plan it was built from.

## How to play

Steer the snake to the food. Each food makes it one longer. Don't hit the edge, a wall, or yourself.

### Controls

| | Keyboard | Phone |
| --- | --- | --- |
| Turn | Arrow keys or W A S D | Swipe on the board, or the direction pad |
| Start | Enter | Tap the board |
| Pause / resume | Space or P | The Pause button in the middle of the pad |
| Play again | Enter | Tap **Play again** |

You can press two turns quickly (say Up then Left) and the snake takes them on its next two moves, so tight U-turns work.

### Rules

- Food is worth **10 points**.
- The snake starts at 7 moves a second and speeds up a little every 5 food, up to 14.
- At **100 points**, four L-shaped walls appear near the corners.
- Fill the whole board and you win.

### Power-ups

After every 4th food, a power-up appears. It disappears after 40 moves if you don't take it.

| Tile | Power-up | What it does |
| --- | --- | --- |
| **B** (amber) | Boost | 1.5× speed and **20 points** per food, for 50 moves |
| **S** (blue) | Slow-mo | 0.6× speed, for 50 moves |
| **−** (purple) | Shrink | Removes up to 3 tail segments (never shorter than 3) |

Only one timed effect runs at a time; taking Boost or Slow-mo replaces the current one. The bar above the board shows how long it has left.

### High scores

Your top 5 scores are saved in this browser with the date. Open **High scores** to see them or clear them. They aren't shared between browsers or devices.

## Run it yourself

You need [Node.js](https://nodejs.org/) 24 or newer.

```powershell
npm install
npm run dev
```

Then open the address it prints (usually http://localhost:5173).

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server with live reload |
| `npm test` | Runs the tests (Vitest) in watch mode; `npm test -- --run` runs them once |
| `npm run typecheck` | TypeScript check, no output files |
| `npm run build` | Type check, then a production build into `dist/` |
| `npm run preview` | Serves the `dist/` build locally |

To try it on your phone, run `npm run dev -- --host` and open the "Network" address on a phone on the same Wi-Fi.

## Deploy to GitHub Pages

The workflow in [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) tests, builds and publishes the game on every push to `main`.

One-time setup:

1. Push this repo to GitHub.
2. In the repo, open **Settings → Pages**, and under **Build and deployment → Source**, choose **GitHub Actions**.
3. Push to `main` (or run the workflow from the **Actions** tab). When it finishes, the game is at `https://<your-username>.github.io/<repo-name>/`.

The build uses relative paths (`base: './'` in `vite.config.ts`), so it works under any repo name without changes.

## How it's built

- Vite + TypeScript (strict), no UI framework. The board is a `<canvas>`; menus and scores are plain HTML.
- **`src/game/`** holds every game rule as a pure function, with tests. `step(state, rng)` advances one move. Time is counted in moves (ticks), never seconds, so pausing can't eat a power-up's time, and randomness comes from a seeded generator, so tests are repeatable.
- A fixed-timestep loop (`src/loop.ts`) turns frame time into whole moves, so the snake runs at the same speed on a 60 Hz or a 144 Hz screen.
- High scores are stored under one localStorage key (`snake:v1`). Broken saved data is copied to `snake:v1:backup` and the game starts with an empty table.
- Dark mode follows the system setting, a hidden tab pauses the game, score changes and game over are announced to screen readers, and the pickup flash is skipped when "reduce motion" is on.

## License

No license has been chosen yet.
