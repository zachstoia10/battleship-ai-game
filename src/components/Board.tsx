import { COLUMN_LABELS, coordKey, formatCoord, sameCoord } from '../game/coords'
import { isShipSunk } from '../game/attack'
import { shipAt } from '../game/board'
import { BOARD_SIZE, type Board as BoardModel, type Coord } from '../game/types'
import { Cell, type CellStatus } from './Cell'

export interface PlacementPreview {
  cells: Coord[]
  valid: boolean
}

interface BoardProps {
  board: BoardModel
  /** Used in each cell's accessible name, e.g. "Enemy waters A1". */
  label: string
  showShips: boolean
  disabled?: boolean
  lastShot?: Coord | null
  preview?: PlacementPreview | null
  onCellClick?: (coord: Coord) => void
  onCellHover?: (coord: Coord | null) => void
  isCellDisabled?: (coord: Coord) => boolean
}

function getStatus(board: BoardModel, coord: Coord, showShips: boolean): CellStatus {
  const shot = board.shots[coord.row][coord.col]
  const ship = shipAt(board, coord)
  if (shot === 'hit') return ship && isShipSunk(board, ship) ? 'sunk' : 'hit'
  if (shot === 'miss') return 'miss'
  return ship && showShips ? 'ship' : 'empty'
}

export function Board({
  board,
  label,
  showShips,
  disabled = false,
  lastShot,
  preview,
  onCellClick,
  onCellHover,
  isCellDisabled,
}: BoardProps) {
  const previewKeys = new Set(preview?.cells.map(coordKey))

  return (
    <div
      className={`board${disabled ? ' board--disabled' : ''}`}
      role="group"
      aria-label={label}
      onMouseLeave={() => onCellHover?.(null)}
    >
      <div className="board__corner" aria-hidden="true" />
      {COLUMN_LABELS.map((letter) => (
        <div key={letter} className="board__label" aria-hidden="true">
          {letter}
        </div>
      ))}
      {Array.from({ length: BOARD_SIZE }, (_, row) => (
        <Row key={row} row={row}>
          {Array.from({ length: BOARD_SIZE }, (_, col) => {
            const coord = { row, col }
            const status = getStatus(board, coord, showShips)
            const inPreview = previewKeys.has(coordKey(coord))
            return (
              <Cell
                key={col}
                status={status}
                label={`${label} ${formatCoord(coord)}`}
                preview={inPreview ? (preview?.valid ? 'valid' : 'invalid') : null}
                isLastShot={!!lastShot && sameCoord(lastShot, coord)}
                disabled={disabled || !onCellClick || (isCellDisabled?.(coord) ?? false)}
                onClick={() => onCellClick?.(coord)}
                onHover={() => onCellHover?.(coord)}
              />
            )
          })}
        </Row>
      ))}
    </div>
  )
}

function Row({ row, children }: { row: number; children: React.ReactNode }) {
  return (
    <>
      <div className="board__label" aria-hidden="true">
        {row + 1}
      </div>
      {children}
    </>
  )
}
