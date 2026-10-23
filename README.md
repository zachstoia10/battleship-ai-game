# Battleship

A single-player Battleship game against a computer opponent, built with React, TypeScript and Vite. It is a fully static site (no backend, accounts or APIs) and is ready to deploy on Netlify.

## How to play

1. **Deploy your fleet.** Choose a ship from the panel and click a cell on *Your fleet* to place it (the clicked cell is the bow; ships extend right or down). A green preview means the spot is valid, red means it overlaps or runs off the board.
   - **Rotate** button or the <kbd>R</kbd> key switches horizontal/vertical.
   - **Randomize** places the whole fleet for you; **Clear** removes every ship.
   - Click a placed ship (on the board or in the list) to pick it up and move it.
2. **Start battle** unlocks once all five ships are placed (Carrier 5, Battleship 4, Cruiser 3, Submarine 3, Destroyer 2). The enemy fleet is placed at random and stays hidden.
3. **Fire** by clicking a cell on *Enemy waters*. Turns strictly alternate: you, then the computer, whether or not a shot hits.
4. The status banner shows whose turn it is. Red bursts are hits, dots are misses, dark-red cells are sunk ships, and the gold outline marks the most recent shot on each board. The fleet panels show how many ships remain, and the Captain's log records every shot.
5. The first side to sink all five enemy ships wins. Remaining enemy ships are revealed at the end.
6. **New game** resets everything at any point, even mid-battle.

## How it works

```
src/
  game/                 Pure TypeScript game logic (no React)
    types.ts            Board, ship and fleet definitions
    coords.ts           Coordinate helpers (bounds, labels like "B7")
    board.ts            Placement validation, moving ships, random fleets
    attack.ts           Resolving shots, sink and win detection
    ai.ts               Hunt-and-target computer opponent
    gameReducer.ts      Game state machine (placement → playing → gameOver)
  hooks/useBattleship.ts  useReducer + timer effect that plays the AI's turn
  components/           Board, Cell, PlacementPanel, FleetStatus, StatusBanner, GameLog, ShipPips
  App.tsx               Page layout and wiring
```

- **State.** All game state lives in one reducer. Every action is validated there: invalid placements and repeated or off-board shots are rejected, attacks are ignored when it isn't that side's turn or the game is over, and placement actions are ignored once the battle starts. Boards are immutable; every move returns a new board.
- **Stale moves.** Each game gets a `gameId`. The AI's move carries the id of the game it was computed for, and the pending timer is cancelled when the game resets, so clicking **New game** while the AI is "thinking" can never leak a shot into the next game.
- **AI.** The computer only sees what a real player would: where it has fired, whether each shot hit, and which ships have been sunk.
  - *Hunt:* fires on a checkerboard pattern (every ship covers at least one of these cells) and skips cells where the smallest remaining ship couldn't fit.
  - *Target:* after a hit, it probes the four neighbours. Once two hits line up it keeps extending that line, then reverses direction when it hits a miss. When the ship sinks it goes back to hunting.
  - Across 60 simulated games the test suite checks that it averages under 70 shots to win; random firing needs about 96.

## Running locally

Requires Node.js 18+ (20 recommended; see `.nvmrc`).

```bash
npm install
npm run dev        # start the dev server at http://localhost:5173
npm test           # run the test suite once (Vitest + React Testing Library)
npm run lint       # ESLint
npm run build      # type-check and build the production bundle into dist/
npm run preview    # serve the production build locally
```

### Tests

- `board.test.ts`: placement, bounds, overlap, moving ships, random fleet validity (300 seeds)
- `attack.test.ts`: hits, misses, repeated and off-board attacks, sinking, win detection
- `ai.test.ts`: hunt parity, neighbour targeting, line extension, return to hunting, full simulated games with no repeated shots
- `gameReducer.test.ts`: placement rules, turn order, duplicate attacks, win/lose, no moves after game over, new game mid-game and after game over, stale AI moves
- `App.test.tsx`: UI integration tests covering manual and invalid placement, turn alternation, sinking, the victory screen, and resetting mid-game while the AI's move is pending

## Deploying to Netlify (from GitHub)

The repo includes `netlify.toml`, so Netlify picks up the settings automatically:

| Setting | Value |
| --- | --- |
| Build command | `npm run build` |
| Publish directory | `dist` |
| Node version | 20 |

1. Push this project to a GitHub repository:
   ```bash
   git remote add origin https://github.com/<you>/battleship.git
   git push -u origin main
   ```
2. In Netlify, choose **Add new site → Import an existing project → GitHub** and select the repository.
3. Netlify reads `netlify.toml`, so the defaults are already correct. Click **Deploy**.
4. Every push to `main` triggers a new deploy, and pull requests get preview deploys.

To deploy without GitHub, run `npm run build` and drag the `dist/` folder onto https://app.netlify.com/drop.
