import { describe, expect, it } from 'vitest'
import { allShipsSunk, isShipSunk, receiveAttack, sunkShips } from './attack'
import { createEmptyBoard } from './board'
import type { Board, Coord } from './types'
import { buildFleetBoard } from '../test/helpers'

function fire(board: Board, coords: Coord[]): Board {
  return coords.reduce((b, c) => {
    const r = receiveAttack(b, c)
    if (!r.ok) throw new Error(`attack failed: ${r.reason}`)
    return r.board
  }, board)
}

describe('attack handling', () => {
  it('records a miss on open water', () => {
    const result = receiveAttack(buildFleetBoard(), { row: 1, col: 0 })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.result).toBe('miss')
    expect(result.sunkShip).toBeNull()
    expect(result.board.shots[1][0]).toBe('miss')
  })

  it('records a hit on a ship without mutating the input board', () => {
    const board = buildFleetBoard()
    const result = receiveAttack(board, { row: 0, col: 2 })
    expect(result.ok && result.result).toBe('hit')
    expect(board.shots[0][2]).toBeNull()
  })

  it('rejects repeated attacks on the same cell (hit or miss)', () => {
    const board = fire(buildFleetBoard(), [{ row: 0, col: 0 }, { row: 1, col: 1 }])
    expect(receiveAttack(board, { row: 0, col: 0 })).toEqual({ ok: false, reason: 'already-attacked' })
    expect(receiveAttack(board, { row: 1, col: 1 })).toEqual({ ok: false, reason: 'already-attacked' })
  })

  it('rejects attacks outside the board', () => {
    expect(receiveAttack(buildFleetBoard(), { row: 10, col: 0 })).toEqual({
      ok: false,
      reason: 'out-of-bounds',
    })
    expect(receiveAttack(buildFleetBoard(), { row: 0, col: -1 })).toEqual({
      ok: false,
      reason: 'out-of-bounds',
    })
  })
})

describe('sinking ships', () => {
  it('reports a ship as sunk only when every cell is hit', () => {
    let board = buildFleetBoard() // destroyer at row 8, cols 0-1
    const destroyer = board.ships.find((s) => s.id === 'destroyer')!
    const first = receiveAttack(board, { row: 8, col: 0 })
    if (!first.ok) throw new Error()
    expect(first.sunkShip).toBeNull()
    expect(isShipSunk(first.board, destroyer)).toBe(false)
    board = first.board

    const second = receiveAttack(board, { row: 8, col: 1 })
    if (!second.ok) throw new Error()
    expect(second.sunkShip?.id).toBe('destroyer')
    expect(isShipSunk(second.board, destroyer)).toBe(true)
    expect(sunkShips(second.board).map((s) => s.id)).toEqual(['destroyer'])
  })

  it('does not report a sink when hitting an already-damaged different ship', () => {
    const board = fire(buildFleetBoard(), [{ row: 8, col: 0 }])
    const r = receiveAttack(board, { row: 6, col: 0 })
    expect(r.ok && r.sunkShip).toBeNull()
  })
})

describe('win detection', () => {
  it('is false until every ship is sunk', () => {
    let board = buildFleetBoard()
    const cells = board.ships.flatMap((s) => s.cells)
    cells.slice(0, -1).forEach((c) => {
      board = fire(board, [c])
    })
    expect(allShipsSunk(board)).toBe(false)
    board = fire(board, [cells[cells.length - 1]])
    expect(allShipsSunk(board)).toBe(true)
  })

  it('an empty board is never considered defeated', () => {
    expect(allShipsSunk(createEmptyBoard())).toBe(false)
  })
})
