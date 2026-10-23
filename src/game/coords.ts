import { BOARD_SIZE, type Coord } from './types'

export const COLUMN_LABELS = 'ABCDEFGHIJ'.split('')

export function isInBounds({ row, col }: Coord): boolean {
  return (
    Number.isInteger(row) &&
    Number.isInteger(col) &&
    row >= 0 &&
    row < BOARD_SIZE &&
    col >= 0 &&
    col < BOARD_SIZE
  )
}

export function sameCoord(a: Coord, b: Coord): boolean {
  return a.row === b.row && a.col === b.col
}

export function coordKey({ row, col }: Coord): string {
  return `${row},${col}`
}

/** Human-readable label, e.g. { row: 0, col: 1 } -> "B1". */
export function formatCoord({ row, col }: Coord): string {
  return `${COLUMN_LABELS[col]}${row + 1}`
}

export function neighbors({ row, col }: Coord): Coord[] {
  return [
    { row: row - 1, col },
    { row: row + 1, col },
    { row, col: col - 1 },
    { row, col: col + 1 },
  ].filter(isInBounds)
}
