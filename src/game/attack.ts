import { isInBounds } from './coords'
import { shipAt } from './board'
import type { Board, Coord, Ship, ShotResult } from './types'

export type AttackError = 'out-of-bounds' | 'already-attacked'

export type AttackResult =
  | { ok: true; board: Board; result: ShotResult; sunkShip: Ship | null }
  | { ok: false; reason: AttackError }

export function isShipSunk(board: Board, ship: Ship): boolean {
  return ship.cells.every((c) => board.shots[c.row][c.col] === 'hit')
}

export function allShipsSunk(board: Board): boolean {
  return board.ships.length > 0 && board.ships.every((s) => isShipSunk(board, s))
}

export function sunkShips(board: Board): Ship[] {
  return board.ships.filter((s) => isShipSunk(board, s))
}

export function hasBeenAttacked(board: Board, coord: Coord): boolean {
  return board.shots[coord.row][coord.col] !== null
}

/** Fires at `coord` on `board`. Returns a new board; never mutates the input. */
export function receiveAttack(board: Board, coord: Coord): AttackResult {
  if (!isInBounds(coord)) return { ok: false, reason: 'out-of-bounds' }
  if (hasBeenAttacked(board, coord)) return { ok: false, reason: 'already-attacked' }

  const ship = shipAt(board, coord)
  const result: ShotResult = ship ? 'hit' : 'miss'
  const shots = board.shots.map((row, r) =>
    r === coord.row ? row.map((cell, c) => (c === coord.col ? result : cell)) : row,
  )
  const next: Board = { ...board, shots }
  const sunkShip = ship && isShipSunk(next, ship) ? ship : null
  return { ok: true, board: next, result, sunkShip }
}
