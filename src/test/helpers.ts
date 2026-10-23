import { createEmptyBoard, placeShip } from '../game/board'
import { FLEET, type Board, type Coord, type Orientation } from '../game/types'

/** Deterministic seeded RNG (mulberry32) for reproducible tests. */
export function seededRng(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * Fleet laid out on rows 0, 2, 4, 6, 8 starting at column 0, horizontally:
 * carrier row 0 (A1-E1), battleship row 2, cruiser row 4, submarine row 6,
 * destroyer row 8.
 */
export function buildFleetBoard(
  layout: Record<string, { start: Coord; orientation: Orientation }> = {},
): Board {
  let board = createEmptyBoard()
  FLEET.forEach((def, i) => {
    const spec = layout[def.id] ?? { start: { row: i * 2, col: 0 }, orientation: 'horizontal' }
    const result = placeShip(board, def, spec.start, spec.orientation)
    if (!result.ok) throw new Error(`Invalid test layout for ${def.id}: ${result.reason}`)
    board = result.board
  })
  return board
}

export function allCells(): Coord[] {
  return Array.from({ length: 100 }, (_, i) => ({ row: Math.floor(i / 10), col: i % 10 }))
}
