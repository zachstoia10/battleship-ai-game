import { describe, expect, it } from 'vitest'
import { chooseAIMove, createAIView, findActiveHits, huntCandidates, targetCandidates } from './ai'
import { allShipsSunk, receiveAttack } from './attack'
import { createRandomFleetBoard } from './board'
import { coordKey } from './coords'
import type { Board, Coord } from './types'
import { buildFleetBoard, seededRng } from '../test/helpers'

function fire(board: Board, coords: Coord[]): Board {
  return coords.reduce((b, c) => {
    const r = receiveAttack(b, c)
    if (!r.ok) throw new Error(`attack failed: ${r.reason}`)
    return r.board
  }, board)
}

const keys = (cs: Coord[]) => cs.map(coordKey).sort()

describe('AI hunt mode', () => {
  it('fires on checkerboard parity cells when there are no active hits', () => {
    const view = createAIView(buildFleetBoard())
    const candidates = huntCandidates(view)
    expect(candidates.length).toBe(50)
    candidates.forEach((c) => expect((c.row + c.col) % 2).toBe(0))
  })

  it('never targets already-attacked cells', () => {
    const board = fire(buildFleetBoard(), [{ row: 1, col: 1 }, { row: 3, col: 3 }])
    const candidates = huntCandidates(createAIView(board))
    expect(keys(candidates)).not.toContain('1,1')
    expect(keys(candidates)).not.toContain('3,3')
  })

  it('skips isolated cells where the smallest remaining ship cannot fit', () => {
    // Surround (5,5) with misses; destroyer (len 2) is the smallest ship.
    const board = fire(buildFleetBoard(), [
      { row: 4, col: 5 },
      { row: 6, col: 5 },
      { row: 5, col: 4 },
      { row: 5, col: 6 },
    ])
    expect(keys(huntCandidates(createAIView(board)))).not.toContain('5,5')
  })
})

describe('AI target mode', () => {
  it('probes orthogonal neighbours after a single hit', () => {
    // Battleship occupies row 2, cols 0-3. Hit (2,2).
    const board = fire(buildFleetBoard(), [{ row: 2, col: 2 }])
    const view = createAIView(board)
    expect(keys(findActiveHits(view))).toEqual(['2,2'])
    expect(keys(targetCandidates(view))).toEqual(keys([
      { row: 1, col: 2 },
      { row: 3, col: 2 },
      { row: 2, col: 1 },
      { row: 2, col: 3 },
    ]))
  })

  it('extends along the line once two hits are aligned', () => {
    const board = fire(buildFleetBoard(), [{ row: 2, col: 1 }, { row: 2, col: 2 }])
    expect(keys(targetCandidates(createAIView(board)))).toEqual(['2,0', '2,3'])
  })

  it('continues the other direction when one end of the line is a miss', () => {
    const board = fire(buildFleetBoard(), [
      { row: 2, col: 2 },
      { row: 2, col: 3 },
      { row: 2, col: 4 }, // miss: battleship ends at col 3
    ])
    expect(keys(targetCandidates(createAIView(board)))).toEqual(['2,1'])
  })

  it('returns to hunt mode once the targeted ship is sunk', () => {
    const board = fire(buildFleetBoard(), [{ row: 8, col: 0 }, { row: 8, col: 1 }])
    const view = createAIView(board)
    expect(findActiveHits(view)).toHaveLength(0)
    expect(targetCandidates(view)).toHaveLength(0)
  })

  it('does not see unsunk ship positions in its view', () => {
    const view = createAIView(buildFleetBoard())
    expect(view).not.toHaveProperty('ships')
    expect(view.sunkCells).toHaveLength(0)
  })
})

describe('AI full games', () => {
  it('sinks every fleet without repeating a shot, well under 100 moves on average', () => {
    let total = 0
    const games = 60
    for (let seed = 1; seed <= games; seed++) {
      const rng = seededRng(seed)
      let board = createRandomFleetBoard(rng)
      const fired = new Set<string>()
      let moves = 0
      while (!allShipsSunk(board)) {
        const move = chooseAIMove(createAIView(board), rng)
        expect(fired.has(coordKey(move))).toBe(false)
        fired.add(coordKey(move))
        const r = receiveAttack(board, move)
        expect(r.ok).toBe(true)
        if (!r.ok) break
        board = r.board
        moves++
        expect(moves).toBeLessThanOrEqual(100)
      }
      total += moves
    }
    // Random firing averages ~96 moves; hunt-and-target should be far better.
    expect(total / games).toBeLessThan(70)
  })
})
