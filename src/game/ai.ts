import { coordKey, isInBounds, neighbors } from './coords'
import { isShipSunk } from './attack'
import { BOARD_SIZE, type Board, type Coord, type ShotResult } from './types'

/**
 * Everything the AI is allowed to know about the opponent's board:
 * where it has fired, what each shot returned, and which cells belong to
 * ships that have been announced as sunk. It never sees unsunk ships.
 */
export interface AIView {
  shots: (ShotResult | null)[][]
  sunkCells: Coord[]
  remainingShipLengths: number[]
}

export function createAIView(board: Board): AIView {
  const sunk = board.ships.filter((s) => isShipSunk(board, s))
  return {
    shots: board.shots,
    sunkCells: sunk.flatMap((s) => s.cells),
    remainingShipLengths: board.ships
      .filter((s) => !sunk.includes(s))
      .map((s) => s.length),
  }
}

const AXES: Coord[] = [
  { row: 0, col: 1 },
  { row: 1, col: 0 },
]

function pick<T>(items: T[], rng: () => number): T {
  return items[Math.floor(rng() * items.length)]
}

function isUnshot(view: AIView, c: Coord): boolean {
  return isInBounds(c) && view.shots[c.row][c.col] === null
}

/** Hits that are not part of a ship already sunk: the AI should chase these. */
export function findActiveHits(view: AIView): Coord[] {
  const sunk = new Set(view.sunkCells.map(coordKey))
  const hits: Coord[] = []
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      if (view.shots[row][col] === 'hit' && !sunk.has(coordKey({ row, col }))) {
        hits.push({ row, col })
      }
    }
  }
  return hits
}

/**
 * Target mode: when two or more active hits line up, extend that line at
 * either end. Otherwise probe the orthogonal neighbours of any active hit.
 */
export function targetCandidates(view: AIView): Coord[] {
  const active = findActiveHits(view)
  const activeKeys = new Set(active.map(coordKey))
  const isActive = (c: Coord) => isInBounds(c) && activeKeys.has(coordKey(c))

  const lineCandidates = new Map<string, Coord>()
  for (const hit of active) {
    for (const axis of AXES) {
      const before = { row: hit.row - axis.row, col: hit.col - axis.col }
      const after = { row: hit.row + axis.row, col: hit.col + axis.col }
      if (!isActive(before) && !isActive(after)) continue
      // Walk to both ends of the contiguous run of hits along this axis.
      let start = hit
      while (isActive({ row: start.row - axis.row, col: start.col - axis.col })) {
        start = { row: start.row - axis.row, col: start.col - axis.col }
      }
      let end = hit
      while (isActive({ row: end.row + axis.row, col: end.col + axis.col })) {
        end = { row: end.row + axis.row, col: end.col + axis.col }
      }
      for (const c of [
        { row: start.row - axis.row, col: start.col - axis.col },
        { row: end.row + axis.row, col: end.col + axis.col },
      ]) {
        if (isUnshot(view, c)) lineCandidates.set(coordKey(c), c)
      }
    }
  }
  if (lineCandidates.size > 0) return [...lineCandidates.values()]

  const adjacent = new Map<string, Coord>()
  for (const hit of active) {
    for (const n of neighbors(hit)) {
      if (isUnshot(view, n)) adjacent.set(coordKey(n), n)
    }
  }
  return [...adjacent.values()]
}

/** Can a ship of `length` fit through `c` given cells already shot? */
function fitsShip(view: AIView, c: Coord, length: number): boolean {
  for (const axis of AXES) {
    let run = 1
    for (const dir of [-1, 1]) {
      let step = 1
      while (
        isUnshot(view, { row: c.row + axis.row * step * dir, col: c.col + axis.col * step * dir })
      ) {
        run++
        step++
      }
    }
    if (run >= length) return true
  }
  return false
}

/**
 * Hunt mode: fire on a checkerboard pattern (every ship covers at least one
 * such cell), skipping cells where even the smallest remaining ship can't fit.
 */
export function huntCandidates(view: AIView): Coord[] {
  const minLength = view.remainingShipLengths.length
    ? Math.min(...view.remainingShipLengths)
    : 1
  const unshot: Coord[] = []
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      if (view.shots[row][col] === null) unshot.push({ row, col })
    }
  }
  const viable = unshot.filter((c) => fitsShip(view, c, minLength))
  const parity = viable.filter((c) => (c.row + c.col) % 2 === 0)
  if (parity.length) return parity
  if (viable.length) return viable
  return unshot
}

/** Chooses the AI's next shot using a hunt-and-target strategy. */
export function chooseAIMove(view: AIView, rng: () => number = Math.random): Coord {
  const targets = targetCandidates(view)
  const candidates = targets.length ? targets : huntCandidates(view)
  if (!candidates.length) throw new Error('No cells left to attack')
  return pick(candidates, rng)
}
