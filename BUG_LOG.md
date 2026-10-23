# Bug log

Real bugs found while building and testing this project. Each entry was reproduced before it was fixed.

## 1. Board overflowed its container on narrow phone screens

- **Symptom:** On phone-width viewports the game board was slightly wider than its column and spilled past the page padding. The edge cells sat closer to the screen edge than the rest of the layout, and the board was off-centre.
- **How it was found:** A Playwright script measured `getBoundingClientRect()` of `.board` against its `.theater` container on the production build (`vite preview`). At a 360 px viewport the board was 327 px wide inside a 321 px container (left edge 9 px vs. container 12 px). At 320 px it overflowed by more than 10 px.
- **Cause:** The mobile cell size was `clamp(22px, 7.4vw, 36px)`, which scales only with viewport width. It ignored the fixed space around the cells (page padding, board padding and border, the 2 px gaps between cells, the row-label column at 0.7× cell width, and the scrollbar). On small screens that fixed space took up a larger share of the width, so 10.7 cells plus chrome came out wider than the column.
- **Fix:** In `src/index.css` the mobile cell size now subtracts the fixed space before dividing: `clamp(20px, calc((100vw - 82px) / 10.7), 36px)`, where 82 px = 24 app padding + 42 board padding/border/gaps + 16 scrollbar allowance.
- **Verification:** Rebuilt and re-ran the same measurement script. The board now fits inside its container at 390 px (12.5–362.5 vs. 12–363), 360 px (12.5–332.5 vs. 12–333) and 320 px (15.9–295.8 vs. 12–299.7). Desktop layout is unchanged (the rule only applies under 820 px). Re-ran `npm test`, `npm run lint` and `npm run build` afterwards and all passed.
