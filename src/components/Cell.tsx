import type { CSSProperties } from 'react'
import type { Orientation } from '../game/types'

export type CellStatus = 'empty' | 'ship' | 'hit' | 'miss' | 'sunk'

export interface ShipShape {
  orientation: Orientation
  segment: 'start' | 'middle' | 'end'
}

/** Competitor ship segment shown in a cell. Only passed when the cell may reveal it. */
export interface CellShip {
  id: string
  name: string
  logo: string
  tint: string
  /** Omitted for a lone enemy hit so the ship's direction isn't leaked. */
  shape?: ShipShape
}

interface CellProps {
  status: CellStatus
  label: string
  preview: 'valid' | 'invalid' | null
  isLastShot: boolean
  disabled: boolean
  ship?: CellShip | null
  /** Segment of one of your own ships, drawn as part of a single hull. */
  hull?: ShipShape | null
  onClick: () => void
  onHover: () => void
}

const STATUS_TEXT: Record<CellStatus, string> = {
  empty: 'open water',
  ship: 'your ship',
  hit: 'hit',
  miss: 'miss',
  sunk: 'sunk',
}

export function Cell({
  status,
  label,
  preview,
  isLastShot,
  disabled,
  ship,
  hull,
  onClick,
  onHover,
}: CellProps) {
  const classes = [
    'cell',
    `cell--${status}`,
    ship && 'cell--competitor',
    ship?.shape && `cell--${ship.shape.orientation === 'horizontal' ? 'h' : 'v'}`,
    ship?.shape && `cell--seg-${ship.shape.segment}`,
    ship && !ship.shape && 'cell--isolated',
    preview && `cell--preview-${preview}`,
    isLastShot && 'cell--last',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <button
      type="button"
      className={classes}
      style={ship ? ({ '--tint': ship.tint } as CSSProperties) : undefined}
      aria-label={`${label}, ${STATUS_TEXT[status]}${ship ? ` (${ship.name})` : ''}`}
      data-status={status}
      data-ship={ship?.id}
      disabled={disabled}
      onClick={onClick}
      onMouseEnter={onHover}
      onFocus={onHover}
    >
      {hull && (
        <span
          className={`cell__hull cell__hull--${hull.orientation === 'horizontal' ? 'h' : 'v'} cell__hull--${hull.segment}`}
          aria-hidden="true"
        />
      )}
      {ship && <img className="cell__logo" src={ship.logo} alt="" draggable={false} />}
      {(status === 'hit' || status === 'sunk') && <span className="cell__marker cell__marker--hit" />}
      {status === 'miss' && <span className="cell__marker cell__marker--miss" />}
    </button>
  )
}
