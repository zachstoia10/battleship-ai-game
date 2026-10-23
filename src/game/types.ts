export const BOARD_SIZE = 10

export type Orientation = 'horizontal' | 'vertical'

export interface Coord {
  row: number
  col: number
}

export interface ShipDefinition {
  id: string
  name: string
  length: number
}

export interface Ship extends ShipDefinition {
  cells: Coord[]
}

export type ShotResult = 'hit' | 'miss'

/** A board holds one side's ships and the shots that side has received. */
export interface Board {
  ships: Ship[]
  shots: (ShotResult | null)[][]
}

export type Player = 'player' | 'ai'

/** The player's (Cognition's) fleet. */
export const FLEET: readonly ShipDefinition[] = [
  { id: 'carrier', name: 'Carrier', length: 5 },
  { id: 'battleship', name: 'Battleship', length: 4 },
  { id: 'cruiser', name: 'Cruiser', length: 3 },
  { id: 'submarine', name: 'Submarine', length: 3 },
  { id: 'destroyer', name: 'Destroyer', length: 2 },
]

/** The AI's fleet: same lengths, branded as Cognition's competitors. */
export const ENEMY_FLEET: readonly ShipDefinition[] = [
  { id: 'copilot', name: 'GitHub Copilot', length: 5 },
  { id: 'cursor', name: 'Cursor', length: 4 },
  { id: 'claude-code', name: 'Claude Code', length: 3 },
  { id: 'codex', name: 'OpenAI Codex', length: 3 },
  { id: 'gemini', name: 'Google Gemini Code Assist', length: 2 },
]
