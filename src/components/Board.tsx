import { COLUMN_LABELS, coordKey, formatCoord, sameCoord } from '../game/coords'
import { isShipSunk } from '../game/attack'
import { shipAt } from '../game/board'
import { BOARD_SIZE, type Board as BoardModel, type Coord, type Ship } from '../game/types'
import { brandFor } from '../branding/competitors'
import { Cell, type CellShip, type CellStatus } from './Cell'

export interface PlacementPreview {
  cells: Coord[]
  valid: boolean
  shipId?: string
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

function toCellShip(ship: Ship, coord: Coord, revealShape: boolean): CellShip | null {
  const brand = brandFor(ship.id)
  if (!brand) return null
  const index = ship.cells.findIndex((c) => sameCoord(c, coord))
  const last = ship.cells.length - 1
  return {
    id: ship.id,
    name: ship.name,
    logo: brand.logo,
    tint: brand.tint,
    shape: revealShape
      ? {
          orientation: last > 0 && ship.cells[0].row === ship.cells[1].row ? 'horizontal' : 'vertical',
          segment: index === 0 ? 'start' : index === last ? 'end' : 'middle',
        }
      : undefined,
  }
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
  const ghostLogo = preview?.valid && preview.shipId ? brandFor(preview.shipId)?.logo : null

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
            // Unhit enemy cells report 'empty', so their competitor is never revealed.
            const ship = status === 'empty' || status === 'miss' ? undefined : shipAt(board, coord)
            return (
              <Cell
                key={col}
                status={status}
                label={`${label} ${formatCoord(coord)}`}
                preview={inPreview ? (preview?.valid ? 'valid' : 'invalid') : null}
                isLastShot={!!lastShot && sameCoord(lastShot, coord)}
                ship={ship ? toCellShip(ship, coord, showShips || status === 'sunk') : null}
                ghostLogo={inPreview ? ghostLogo : null}
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
