# Security model: Beat the Competitors (battleship-ai-game)

_Written by Devin from the code; items marked (assumed) have not been confirmed by the owner. A Devin security scan of `main` on 2026-10-26 reported no findings. Edit this file to correct anything below; future scans start from it._

## System overview
A fully static, single-player Battleship game (React 18 + TypeScript, built with Vite 5) deployed to Netlify from GitHub `main`. There is no backend, no accounts, no API calls, no cookies/localStorage, and no user-supplied data beyond clicks and the `R` key. All game state lives in memory in one reducer (`src/game/gameReducer.ts`).

## Components
| Component | Code | Notes |
| --- | --- | --- |
| **game-engine** | `src/game/`, `src/hooks/useBattleship.ts` | Pure TS rules, AI opponent, state machine with `gameId` stale-move guard |
| **web-ui** | `src/App.tsx`, `src/main.tsx`, `src/components/`, `src/branding/`, `src/assets/`, `src/index.css`, `index.html`, `public/` | React rendering; no `dangerouslySetInnerHTML`; all text is static or derived from fixed fleet data |
| **build-and-deploy** | `package.json`, `package-lock.json`, `vite.config.ts`, `tsconfig*.json`, `eslint.config.js`, `netlify.toml`, `.nvmrc` | npm dependencies, Vite build, Netlify build (`npm run build`, publish `dist`, Node 20, SPA `/* -> /index.html` rewrite) |
| **tests** | `src/**/*.test.ts(x)`, `src/test/` | Vitest + jsdom; not shipped |

## Trust boundaries and entry points
- **Browser ↔ visitor**: anyone on the internet can load the site. Inputs are only clicks on grid cells/buttons and the `R` key; the visitor fully controls their own browser.
- **GitHub → Netlify build**: code on `main` (and PR deploy previews) is built by Netlify with `npm install` / `npm run build`; npm packages run at install/build time.
- **npm registry → bundle**: runtime deps (`react`, `react-dom`, `@fontsource-variable/*`) ship to visitors; dev deps run on the build machine.
- No server-side entry points. `netlify.toml` sets no security headers (CSP, `X-Frame-Options`, etc.).

## Assets
- Integrity of the live, Cognition-branded page: no defacement, injected scripts or malicious redirects (assumed most important).
- Integrity of the build/deploy pipeline and Netlify site (assumed).
- No user data, secrets or credentials are handled by the app.
- Hidden enemy fleet positions: game fairness only; held in client memory.

## Attacker profiles (assumed)
1. **Anonymous visitor**: can only affect their own copy of the game; there is no shared state.
2. **Supply-chain attacker**: a malicious or compromised npm package (runtime or build-time).
3. **Third party framing the site** (clickjacking): low value, since there are no sensitive actions.
4. **Repo/Netlify account compromise**: outside the code's control.

## Existing controls
- React escapes all rendered text; no raw HTML sinks, `eval`, URL/query-param parsing, `postMessage` or storage.
- The reducer validates every action (bounds, duplicate shots, turn order, phase); `gameId` rejects stale AI moves.
- `package-lock.json` pins dependency versions.

## Out of scope / accepted risk (assumed)
- A player cheating in their own browser (e.g. reading the AI fleet from React state via dev tools): single-player, client-side, no stakes.
- Game-logic bugs that only affect the local player's own session.

## Open questions
- Which matters most: live-site integrity, the build/deploy pipeline, or both?
- Is there infrastructure (Netlify site settings, DNS, headers) beyond `netlify.toml`?
