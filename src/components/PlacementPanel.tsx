import { FLEET, type Board, type Orientation } from '../game/types'
import { isFleetComplete } from '../game/board'
import { ShipPips } from './ShipPips'

interface PlacementPanelProps {
  board: Board
  selectedShipId: string | null
  orientation: Orientation
  onSelectShip: (shipId: string) => void
  onRotate: () => void
  onRandomize: () => void
  onClear: () => void
  onStart: () => void
}

export function PlacementPanel({
  board,
  selectedShipId,
  orientation,
  onSelectShip,
  onRotate,
  onRandomize,
  onClear,
  onStart,
}: PlacementPanelProps) {
  const ready = isFleetComplete(board)

  return (
    <section className="panel placement" aria-labelledby="placement-heading">
      <h2 id="placement-heading">Deploy your fleet</h2>
      <p className="panel__hint">
        Select a ship, then click your board to place it. Click a placed ship to pick it back
        up. Press <kbd>R</kbd> to rotate.
      </p>
      <ul className="placement__ships">
        {FLEET.map((def) => {
          const placed = board.ships.some((s) => s.id === def.id)
          const selected = def.id === selectedShipId
          return (
            <li key={def.id}>
              <button
                type="button"
                className={`ship-option${selected ? ' ship-option--selected' : ''}${placed ? ' ship-option--placed' : ''}`}
                aria-pressed={selected}
                onClick={() => onSelectShip(def.id)}
              >
                <span className="ship-option__name">{def.name}</span>
                <ShipPips length={def.length} />
                <span className="ship-option__state">{placed ? 'Placed' : selected ? 'Selected' : ''}</span>
              </button>
            </li>
          )
        })}
      </ul>
      <div className="placement__actions">
        <button type="button" className="btn" onClick={onRotate}>
          Rotate ({orientation === 'horizontal' ? 'Horizontal' : 'Vertical'})
        </button>
        <button type="button" className="btn" onClick={onRandomize}>
          Randomize
        </button>
        <button type="button" className="btn btn--ghost" onClick={onClear}>
          Clear
        </button>
      </div>
      <button type="button" className="btn btn--primary btn--block" onClick={onStart} disabled={!ready}>
        Start battle
      </button>
    </section>
  )
}
