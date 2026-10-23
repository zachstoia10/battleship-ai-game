import { describe, expect, it } from 'vitest'
import { createInitialState, gameReducer, type GameAction, type GameState } from './gameReducer'
import { isFleetComplete } from './board'
import { FLEET } from './types'
import { buildFleetBoard } from '../test/helpers'

function run(state: GameState, ...actions: GameAction[]): GameState {
  return actions.reduce(gameReducer, state)
}

function startedGame(): GameState {
  return run(
    createInitialState(),
    { type: 'RANDOMIZE_PLACEMENT', board: buildFleetBoard() },
    { type: 'START_GAME', aiBoard: buildFleetBoard() },
  )
}

const aiShipCells = () => buildFleetBoard().ships.flatMap((s) => s.cells)

describe('placement phase', () => {
  it('starts in placement with the carrier selected', () => {
    const s = createInitialState()
    expect(s.phase).toBe('placement')
    expect(s.selectedShipId).toBe('copilot')
    expect(s.playerBoard.ships).toHaveLength(0)
  })

  it('places the selected ship and auto-selects the next unplaced ship', () => {
    const s = run(createInitialState(), { type: 'PLACE_SHIP', coord: { row: 0, col: 0 } })
    expect(s.playerBoard.ships.map((x) => x.id)).toEqual(['copilot'])
    expect(s.selectedShipId).toBe('cursor')
  })

  it('rotates and places vertically', () => {
    const s = run(createInitialState(), { type: 'ROTATE' }, { type: 'PLACE_SHIP', coord: { row: 0, col: 0 } })
    expect(s.orientation).toBe('vertical')
    expect(s.playerBoard.ships[0].cells.map((c) => c.col)).toEqual([0, 0, 0, 0, 0])
  })

  it('rejects invalid placements with a notice and leaves the board unchanged', () => {
    const outOfBounds = run(createInitialState(), { type: 'PLACE_SHIP', coord: { row: 0, col: 7 } })
    expect(outOfBounds.playerBoard.ships).toHaveLength(0)
    expect(outOfBounds.notice).toMatch(/beyond the board/)

    const overlap = run(
      createInitialState(),
      { type: 'PLACE_SHIP', coord: { row: 0, col: 0 } },
      { type: 'ROTATE' },
      { type: 'PLACE_SHIP', coord: { row: 0, col: 2 } },
    )
    expect(overlap.playerBoard.ships).toHaveLength(1)
    expect(overlap.notice).toMatch(/overlap/)
  })

  it('picks up a placed ship so it can be repositioned', () => {
    const s = run(
      createInitialState(),
      { type: 'PLACE_SHIP', coord: { row: 0, col: 0 } },
      { type: 'PICK_UP_SHIP', shipId: 'copilot' },
    )
    expect(s.playerBoard.ships).toHaveLength(0)
    expect(s.selectedShipId).toBe('copilot')
  })

  it('randomizes and clears placement', () => {
    const randomized = run(createInitialState(), { type: 'RANDOMIZE_PLACEMENT' })
    expect(isFleetComplete(randomized.playerBoard)).toBe(true)
    const cleared = run(randomized, { type: 'CLEAR_PLACEMENT' })
    expect(cleared.playerBoard.ships).toHaveLength(0)
    expect(cleared.selectedShipId).toBe(FLEET[0].id)
  })

  it('cannot start until all ships are placed', () => {
    const s = run(createInitialState(), { type: 'PLACE_SHIP', coord: { row: 0, col: 0 } }, { type: 'START_GAME' })
    expect(s.phase).toBe('placement')
    expect(s.notice).toMatch(/all five ships/)
  })

  it('starts the game with a randomly placed, complete AI fleet', () => {
    const s = run(createInitialState(), { type: 'RANDOMIZE_PLACEMENT' }, { type: 'START_GAME' })
    expect(s.phase).toBe('playing')
    expect(s.turn).toBe('player')
    expect(isFleetComplete(s.aiBoard)).toBe(true)
  })

  it('ignores attacks during placement and placement actions during play', () => {
    const placing = run(createInitialState(), { type: 'PLAYER_ATTACK', coord: { row: 0, col: 0 } })
    expect(placing.aiBoard.shots[0][0]).toBeNull()
    expect(placing.log).toHaveLength(0)

    const playing = startedGame()
    const after = run(playing, { type: 'CLEAR_PLACEMENT' }, { type: 'RANDOMIZE_PLACEMENT' })
    expect(after.playerBoard).toBe(playing.playerBoard)
  })
})

describe('turn management', () => {
  it('alternates player -> AI -> player, regardless of hit or miss', () => {
    let s = startedGame()
    s = run(s, { type: 'PLAYER_ATTACK', coord: { row: 0, col: 0 } }) // hit
    expect(s.turn).toBe('ai')
    s = run(s, { type: 'AI_ATTACK', coord: { row: 9, col: 9 }, gameId: s.gameId }) // miss
    expect(s.turn).toBe('player')
    s = run(s, { type: 'PLAYER_ATTACK', coord: { row: 9, col: 9 } }) // miss
    expect(s.turn).toBe('ai')
  })

  it('prevents the player from firing on the AI turn', () => {
    const s = run(startedGame(), { type: 'PLAYER_ATTACK', coord: { row: 0, col: 0 } })
    const again = run(s, { type: 'PLAYER_ATTACK', coord: { row: 1, col: 1 } })
    expect(again.aiBoard.shots[1][1]).toBeNull()
    expect(again).toBe(s)
  })

  it('prevents the AI from firing on the player turn', () => {
    const s = startedGame()
    expect(run(s, { type: 'AI_ATTACK', coord: { row: 0, col: 0 }, gameId: s.gameId })).toBe(s)
  })

  it('a repeated player attack does not consume the turn', () => {
    let s = run(startedGame(), { type: 'PLAYER_ATTACK', coord: { row: 5, col: 5 } })
    s = run(s, { type: 'AI_ATTACK', coord: { row: 9, col: 9 }, gameId: s.gameId })
    const repeated = run(s, { type: 'PLAYER_ATTACK', coord: { row: 5, col: 5 } })
    expect(repeated.turn).toBe('player')
    expect(repeated.notice).toMatch(/already fired at F6/)
    expect(repeated.log).toHaveLength(s.log.length)
  })

  it('logs hits, misses and sinks', () => {
    let s = startedGame()
    s = run(s, { type: 'PLAYER_ATTACK', coord: { row: 8, col: 0 } })
    s = run(s, { type: 'AI_ATTACK', coord: { row: 9, col: 9 }, gameId: s.gameId })
    s = run(s, { type: 'PLAYER_ATTACK', coord: { row: 8, col: 1 } })
    expect(s.log.map((e) => e.text)).toEqual([
      'You eliminated Google Gemini Code Assist at B9!',
      'The enemy missed at J10.',
      'You hit at A9.',
    ])
  })
})

function playerWinsGame(): GameState {
  let s = startedGame()
  const aiMisses = [
    ...Array.from({ length: 10 }, (_, col) => ({ row: 9, col })),
    ...Array.from({ length: 10 }, (_, col) => ({ row: 7, col })),
  ]
  aiShipCells().forEach((coord, i) => {
    s = run(s, { type: 'PLAYER_ATTACK', coord })
    if (s.phase === 'playing') {
      s = run(s, { type: 'AI_ATTACK', coord: aiMisses[i], gameId: s.gameId })
    }
  })
  return s
}

describe('win detection and game over', () => {

  it('declares the player the winner after sinking all AI ships', () => {
    const s = playerWinsGame()
    expect(s.phase).toBe('gameOver')
    expect(s.winner).toBe('player')
    expect(s.log[0].kind).toBe('win')
  })

  it('declares the AI the winner after sinking all player ships', () => {
    let s = startedGame()
    const playerMisses = Array.from({ length: 20 }, (_, i) => ({ row: i < 10 ? 9 : 7, col: i % 10 }))
    aiShipCells().forEach((coord, i) => {
      s = run(s, { type: 'PLAYER_ATTACK', coord: playerMisses[i] })
      s = run(s, { type: 'AI_ATTACK', coord, gameId: s.gameId })
    })
    expect(s.phase).toBe('gameOver')
    expect(s.winner).toBe('ai')
  })

  it('rejects all attacks after the game ends', () => {
    const s = playerWinsGame()
    expect(run(s, { type: 'PLAYER_ATTACK', coord: { row: 5, col: 5 } })).toBe(s)
    expect(run(s, { type: 'AI_ATTACK', coord: { row: 5, col: 5 }, gameId: s.gameId })).toBe(s)
  })
})

describe('new game', () => {
  it('fully resets mid-game', () => {
    let s = run(startedGame(), { type: 'PLAYER_ATTACK', coord: { row: 0, col: 0 } })
    s = run(s, { type: 'AI_ATTACK', coord: { row: 0, col: 0 }, gameId: s.gameId })
    const fresh = run(s, { type: 'NEW_GAME' })
    expect(fresh).toEqual({ ...createInitialState(), gameId: s.gameId + 1 })
  })

  it('fully resets after game over', () => {
    const finished = playerWinsGame()
    const fresh = run(finished, { type: 'NEW_GAME' })
    expect(fresh).toEqual({ ...createInitialState(), gameId: finished.gameId + 1 })
  })

  it('ignores a stale AI move from the previous game', () => {
    const old = run(startedGame(), { type: 'PLAYER_ATTACK', coord: { row: 0, col: 0 } })
    const next = run(
      old,
      { type: 'NEW_GAME' },
      { type: 'RANDOMIZE_PLACEMENT', board: buildFleetBoard() },
      { type: 'START_GAME', aiBoard: buildFleetBoard() },
      { type: 'PLAYER_ATTACK', coord: { row: 5, col: 5 } },
    )
    expect(next.turn).toBe('ai')
    const afterStale = run(next, { type: 'AI_ATTACK', coord: { row: 0, col: 0 }, gameId: old.gameId })
    expect(afterStale).toBe(next)
  })
})
