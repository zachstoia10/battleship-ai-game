import { isInBounds, sameCoord } from './coords'
import {
  BOARD_SIZE,
  FLEET,
  type Board,
  type Coord,
  type Orientation,
  type Ship,
  type ShipDefinition,
} from './types'

export type PlacementError = 'out-of-bounds' | 'overlap'

export type PlacementResult =
  | { ok: true; board: Board }
  | { ok: false; reason: PlacementError }

export function createEmptyBoard(): Board {
  return {
    ships: [],
    shots: Array.from({ length: BOARD_SIZE }, () =>
      Array<null>(BOARD_SIZE).fill(null),
    ),
  }
}

export function getShipCells(
  start: Coord,
  length: number,
  orientation: Orientation,
): Coord[] {
  return Array.from({ length }, (_, i) =>
    orientation === 'horizontal'
      ? { row: start.row, col: start.col + i }
      : { row: start.row + i, col: start.col },
  )
}

export function shipAt(board: Board, coord: Coord): Ship | undefined {
  return board.ships.find((ship) => ship.cells.some((c) => sameCoord(c, coord)))
}

/**
 * Checks whether a ship could occupy `cells`. A ship with `ignoreShipId`
 * is ignored so an already-placed ship can be moved.
 */
export function validatePlacement(
  board: Board,
  cells: Coord[],
  ignoreShipId?: string,
): PlacementError | null {
  if (cells.some((c) => !isInBounds(c))) return 'out-of-bounds'
  const others = board.ships.filter((s) => s.id !== ignoreShipId)
  const overlaps = cells.some((c) =>
    others.some((s) => s.cells.some((sc) => sameCoord(sc, c))),
  )
  return overlaps ? 'overlap' : null
}

/** Places (or moves) a ship. Returns a new board; never mutates the input. */
export function placeShip(
  board: Board,
  definition: ShipDefinition,
  start: Coord,
  orientation: Orientation,
): PlacementResult {
  const cells = getShipCells(start, definition.length, orientation)
  const error = validatePlacement(board, cells, definition.id)
  if (error) return { ok: false, reason: error }
  const ship: Ship = { ...definition, cells }
  return {
    ok: true,
    board: {
      ...board,
      ships: [...board.ships.filter((s) => s.id !== definition.id), ship],
    },
  }
}

export function removeShip(board: Board, shipId: string): Board {
  return { ...board, ships: board.ships.filter((s) => s.id !== shipId) }
}

export function isFleetComplete(
  board: Board,
  fleet: readonly ShipDefinition[] = FLEET,
): boolean {
  return fleet.every((def) => board.ships.some((s) => s.id === def.id))
}

/** Returns a board with the full fleet placed at random, valid positions. */
export function createRandomFleetBoard(
  rng: () => number = Math.random,
  fleet: readonly ShipDefinition[] = FLEET,
): Board {
  // Placement always succeeds quickly on a 10x10 board, but restart from
  // scratch in the (theoretical) case where a ship cannot fit.
  for (;;) {
    let board = createEmptyBoard()
    let failed = false
    for (const def of fleet) {
      let placed = false
      for (let attempt = 0; attempt < 500 && !placed; attempt++) {
        const orientation: Orientation = rng() < 0.5 ? 'horizontal' : 'vertical'
        const start = {
          row: Math.floor(rng() * BOARD_SIZE),
          col: Math.floor(rng() * BOARD_SIZE),
        }
        const result = placeShip(board, def, start, orientation)
        if (result.ok) {
          board = result.board
          placed = true
        }
      }
      if (!placed) {
        failed = true
        break
      }
    }
    if (!failed) return board
  }
}
