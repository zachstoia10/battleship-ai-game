import { describe, expect, it } from 'vitest'
import {
  createEmptyBoard,
  createRandomFleetBoard,
  getShipCells,
  isFleetComplete,
  placeShip,
  removeShip,
  shipAt,
  validatePlacement,
} from './board'
import { coordKey } from './coords'
import { BOARD_SIZE, FLEET } from './types'
import { buildFleetBoard, seededRng } from '../test/helpers'

const carrier = FLEET[0]
const destroyer = FLEET[4]

describe('ship placement', () => {
  it('creates a 10x10 board with no ships or shots', () => {
    const board = createEmptyBoard()
    expect(board.ships).toHaveLength(0)
    expect(board.shots).toHaveLength(BOARD_SIZE)
    board.shots.forEach((row) => expect(row).toEqual(Array(BOARD_SIZE).fill(null)))
  })

  it('computes horizontal and vertical ship cells', () => {
    expect(getShipCells({ row: 2, col: 3 }, 3, 'horizontal')).toEqual([
      { row: 2, col: 3 },
      { row: 2, col: 4 },
      { row: 2, col: 5 },
    ])
    expect(getShipCells({ row: 2, col: 3 }, 2, 'vertical')).toEqual([
      { row: 2, col: 3 },
      { row: 3, col: 3 },
    ])
  })

  it('places a ship in a valid position without mutating the original board', () => {
    const board = createEmptyBoard()
    const result = placeShip(board, carrier, { row: 0, col: 0 }, 'horizontal')
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.board.ships).toHaveLength(1)
    expect(shipAt(result.board, { row: 0, col: 4 })?.id).toBe('carrier')
    expect(shipAt(result.board, { row: 0, col: 5 })).toBeUndefined()
    expect(board.ships).toHaveLength(0)
  })

  it('allows a ship to touch the far edge exactly', () => {
    expect(placeShip(createEmptyBoard(), carrier, { row: 9, col: 5 }, 'horizontal').ok).toBe(true)
    expect(placeShip(createEmptyBoard(), carrier, { row: 5, col: 9 }, 'vertical').ok).toBe(true)
  })

  it.each([
    [{ row: 0, col: 6 }, 'horizontal'],
    [{ row: 6, col: 0 }, 'vertical'],
    [{ row: -1, col: 0 }, 'horizontal'],
    [{ row: 0, col: -1 }, 'vertical'],
    [{ row: 10, col: 0 }, 'horizontal'],
  ] as const)('rejects a ship extending beyond the board from %o (%s)', (start, orientation) => {
    const result = placeShip(createEmptyBoard(), carrier, start, orientation)
    expect(result).toEqual({ ok: false, reason: 'out-of-bounds' })
  })

  it('rejects overlapping ships', () => {
    const first = placeShip(createEmptyBoard(), carrier, { row: 3, col: 2 }, 'horizontal')
    if (!first.ok) throw new Error('setup failed')
    const result = placeShip(first.board, destroyer, { row: 2, col: 4 }, 'vertical')
    expect(result).toEqual({ ok: false, reason: 'overlap' })
  })

  it('allows ships to sit directly adjacent without overlapping', () => {
    const first = placeShip(createEmptyBoard(), carrier, { row: 3, col: 2 }, 'horizontal')
    if (!first.ok) throw new Error('setup failed')
    expect(placeShip(first.board, destroyer, { row: 4, col: 2 }, 'horizontal').ok).toBe(true)
  })

  it('moves an already placed ship instead of duplicating it, ignoring its own cells', () => {
    const first = placeShip(createEmptyBoard(), carrier, { row: 0, col: 0 }, 'horizontal')
    if (!first.ok) throw new Error('setup failed')
    // Overlaps its own old position only — must be allowed.
    const moved = placeShip(first.board, carrier, { row: 0, col: 2 }, 'horizontal')
    expect(moved.ok).toBe(true)
    if (!moved.ok) return
    expect(moved.board.ships).toHaveLength(1)
    expect(shipAt(moved.board, { row: 0, col: 0 })).toBeUndefined()
    expect(shipAt(moved.board, { row: 0, col: 6 })?.id).toBe('carrier')
  })

  it('validatePlacement reports out-of-bounds before overlap', () => {
    const board = buildFleetBoard()
    expect(validatePlacement(board, getShipCells({ row: 0, col: 8 }, 3, 'horizontal'))).toBe(
      'out-of-bounds',
    )
  })

  it('removes a ship', () => {
    const board = removeShip(buildFleetBoard(), 'cruiser')
    expect(board.ships.map((s) => s.id)).not.toContain('cruiser')
    expect(isFleetComplete(board)).toBe(false)
  })

  it('detects a complete fleet', () => {
    expect(isFleetComplete(createEmptyBoard())).toBe(false)
    expect(isFleetComplete(buildFleetBoard())).toBe(true)
  })

  it('random placement always yields a complete, valid, non-overlapping fleet', () => {
    for (let seed = 1; seed <= 300; seed++) {
      const board = createRandomFleetBoard(seededRng(seed))
      expect(isFleetComplete(board)).toBe(true)
      expect(board.ships.map((s) => s.length).sort()).toEqual([2, 3, 3, 4, 5])
      const keys = board.ships.flatMap((s) => s.cells.map(coordKey))
      expect(new Set(keys).size).toBe(17)
      board.ships.forEach((ship) => {
        ship.cells.forEach((c) => {
          expect(c.row).toBeGreaterThanOrEqual(0)
          expect(c.row).toBeLessThan(BOARD_SIZE)
          expect(c.col).toBeGreaterThanOrEqual(0)
          expect(c.col).toBeLessThan(BOARD_SIZE)
        })
        // Cells must be contiguous in a straight line.
        const rows = new Set(ship.cells.map((c) => c.row))
        const cols = new Set(ship.cells.map((c) => c.col))
        expect(rows.size === 1 || cols.size === 1).toBe(true)
      })
    }
  })
})
