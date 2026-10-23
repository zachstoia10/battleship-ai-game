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
  { id: 'carrier', name: 'Zachary Stoia', length: 5 },
  { id: 'battleship', name: 'William McCarthy', length: 4 },
  { id: 'cruiser', name: 'Austin Mead', length: 3 },
  { id: 'submarine', name: 'Sebastian Canizares', length: 3 },
  { id: 'destroyer', name: 'Adam Achebe', length: 2 },
]

/** The AI's fleet: same lengths, branded as Cognition's competitors. */
export const ENEMY_FLEET: readonly ShipDefinition[] = [
  { id: 'copilot', name: 'GitHub Copilot', length: 5 },
  { id: 'cursor', name: 'Cursor', length: 4 },
  { id: 'claude-code', name: 'Claude Code', length: 3 },
  { id: 'codex', name: 'OpenAI Codex', length: 3 },
  { id: 'gemini', name: 'Google Gemini Code Assist', length: 2 },
]
