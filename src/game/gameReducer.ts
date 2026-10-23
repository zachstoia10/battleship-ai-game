import {
  createEmptyBoard,
  createRandomFleetBoard,
  isFleetComplete,
  placeShip,
  removeShip,
  shipAt,
} from './board'
import { allShipsSunk, receiveAttack } from './attack'
import { formatCoord } from './coords'
import { FLEET, type Board, type Coord, type Orientation, type Player } from './types'

export type Phase = 'placement' | 'playing' | 'gameOver'

export interface LogEntry {
  id: number
  actor: Player
  text: string
  kind: 'hit' | 'miss' | 'sunk' | 'win'
}

export interface GameState {
  /** Incremented on every new game so stale AI moves can be rejected. */
  gameId: number
  phase: Phase
  turn: Player
  winner: Player | null
  playerBoard: Board
  aiBoard: Board
  selectedShipId: string | null
  orientation: Orientation
  notice: string | null
  lastPlayerShot: Coord | null
  lastAIShot: Coord | null
  log: LogEntry[]
}

export type GameAction =
  | { type: 'SELECT_SHIP'; shipId: string }
  | { type: 'ROTATE' }
  | { type: 'PLACE_SHIP'; coord: Coord }
  | { type: 'PICK_UP_SHIP'; shipId: string }
  | { type: 'RANDOMIZE_PLACEMENT'; board?: Board }
  | { type: 'CLEAR_PLACEMENT' }
  | { type: 'START_GAME'; aiBoard?: Board }
  | { type: 'PLAYER_ATTACK'; coord: Coord }
  | { type: 'AI_ATTACK'; coord: Coord; gameId: number }
  | { type: 'NEW_GAME' }

export function createInitialState(gameId = 1): GameState {
  return {
    gameId,
    phase: 'placement',
    turn: 'player',
    winner: null,
    playerBoard: createEmptyBoard(),
    aiBoard: createEmptyBoard(),
    selectedShipId: FLEET[0].id,
    orientation: 'horizontal',
    notice: null,
    lastPlayerShot: null,
    lastAIShot: null,
    log: [],
  }
}

function nextUnplacedShipId(board: Board): string | null {
  return FLEET.find((def) => !board.ships.some((s) => s.id === def.id))?.id ?? null
}

function addLog(state: GameState, entry: Omit<LogEntry, 'id'>): LogEntry[] {
  const id = (state.log[0]?.id ?? 0) + 1
  return [{ ...entry, id }, ...state.log]
}

function handlePlacement(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'SELECT_SHIP':
      if (!FLEET.some((d) => d.id === action.shipId)) return state
      return { ...state, selectedShipId: action.shipId, notice: null }

    case 'ROTATE':
      return {
        ...state,
        orientation: state.orientation === 'horizontal' ? 'vertical' : 'horizontal',
      }

    case 'PLACE_SHIP': {
      const def = FLEET.find((d) => d.id === state.selectedShipId)
      if (!def) return state
      const result = placeShip(state.playerBoard, def, action.coord, state.orientation)
      if (!result.ok) {
        return {
          ...state,
          notice:
            result.reason === 'overlap'
              ? `The ${def.name} would overlap another ship.`
              : `The ${def.name} would extend beyond the board.`,
        }
      }
      return {
        ...state,
        playerBoard: result.board,
        selectedShipId: nextUnplacedShipId(result.board),
        notice: null,
      }
    }

    case 'PICK_UP_SHIP': {
      if (!state.playerBoard.ships.some((s) => s.id === action.shipId)) return state
      return {
        ...state,
        playerBoard: removeShip(state.playerBoard, action.shipId),
        selectedShipId: action.shipId,
        notice: null,
      }
    }

    case 'RANDOMIZE_PLACEMENT': {
      const board = action.board ?? createRandomFleetBoard()
      return { ...state, playerBoard: board, selectedShipId: null, notice: null }
    }

    case 'CLEAR_PLACEMENT':
      return {
        ...state,
        playerBoard: createEmptyBoard(),
        selectedShipId: FLEET[0].id,
        notice: null,
      }

    case 'START_GAME': {
      if (!isFleetComplete(state.playerBoard)) {
        return { ...state, notice: 'Place all five ships before starting.' }
      }
      return {
        ...state,
        phase: 'playing',
        turn: 'player',
        aiBoard: action.aiBoard ?? createRandomFleetBoard(),
        selectedShipId: null,
        notice: null,
      }
    }

    default:
      return state
  }
}

function handlePlayerAttack(state: GameState, coord: Coord): GameState {
  if (state.phase !== 'playing' || state.turn !== 'player') return state
  const attack = receiveAttack(state.aiBoard, coord)
  if (!attack.ok) {
    return {
      ...state,
      notice:
        attack.reason === 'already-attacked'
          ? `You already fired at ${formatCoord(coord)}. Pick another target.`
          : 'That target is off the board.',
    }
  }

  const label = formatCoord(coord)
  let log = addLog(state, {
    actor: 'player',
    kind: attack.sunkShip ? 'sunk' : attack.result,
    text: attack.sunkShip
      ? `You sank the enemy ${attack.sunkShip.name} at ${label}!`
      : attack.result === 'hit'
        ? `You hit at ${label}.`
        : `You missed at ${label}.`,
  })
  const won = allShipsSunk(attack.board)
  if (won) {
    log = addLog({ ...state, log }, { actor: 'player', kind: 'win', text: 'You sank the entire enemy fleet!' })
  }
  return {
    ...state,
    aiBoard: attack.board,
    lastPlayerShot: coord,
    notice: null,
    log,
    phase: won ? 'gameOver' : 'playing',
    winner: won ? 'player' : null,
    turn: won ? 'player' : 'ai',
  }
}

function handleAIAttack(state: GameState, coord: Coord, gameId: number): GameState {
  if (gameId !== state.gameId || state.phase !== 'playing' || state.turn !== 'ai') {
    return state
  }
  const attack = receiveAttack(state.playerBoard, coord)
  if (!attack.ok) return state

  const label = formatCoord(coord)
  const ship = shipAt(state.playerBoard, coord)
  let log = addLog(state, {
    actor: 'ai',
    kind: attack.sunkShip ? 'sunk' : attack.result,
    text: attack.sunkShip
      ? `The enemy sank your ${attack.sunkShip.name} at ${label}!`
      : attack.result === 'hit'
        ? `The enemy hit your ${ship?.name ?? 'ship'} at ${label}.`
        : `The enemy missed at ${label}.`,
  })
  const won = allShipsSunk(attack.board)
  if (won) {
    log = addLog({ ...state, log }, { actor: 'ai', kind: 'win', text: 'The enemy sank your entire fleet.' })
  }
  return {
    ...state,
    playerBoard: attack.board,
    lastAIShot: coord,
    log,
    phase: won ? 'gameOver' : 'playing',
    winner: won ? 'ai' : null,
    turn: won ? 'ai' : 'player',
  }
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'NEW_GAME':
      return createInitialState(state.gameId + 1)
    case 'PLAYER_ATTACK':
      return handlePlayerAttack(state, action.coord)
    case 'AI_ATTACK':
      return handleAIAttack(state, action.coord, action.gameId)
    default:
      return state.phase === 'placement' ? handlePlacement(state, action) : state
  }
}
