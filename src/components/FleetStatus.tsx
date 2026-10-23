import { isShipSunk } from '../game/attack'
import { FLEET, type Board } from '../game/types'
import { ShipPips } from './ShipPips'

interface FleetStatusProps {
  title: string
  board: Board
  /** Show per-ship damage. Only for your own fleet, so enemy hits aren't leaked. */
  showDamage: boolean
}

export function FleetStatus({ title, board, showDamage }: FleetStatusProps) {
  const ships = FLEET.map((def) => {
    const ship = board.ships.find((s) => s.id === def.id)
    const hits = ship ? ship.cells.filter((c) => board.shots[c.row][c.col] === 'hit').length : 0
    const sunk = ship ? isShipSunk(board, ship) : false
    return { def, hits, sunk }
  })
  const afloat = ships.filter((s) => !s.sunk).length

  return (
    <section className="panel fleet" aria-label={title}>
      <header className="fleet__header">
        <h3>{title}</h3>
        <span className="fleet__count" data-testid={`${title}-remaining`}>
          {afloat} / {FLEET.length} afloat
        </span>
      </header>
      <ul className="fleet__list">
        {ships.map(({ def, hits, sunk }) => (
          <li key={def.id} className={`fleet__ship${sunk ? ' fleet__ship--sunk' : ''}`}>
            <span className="fleet__name">{def.name}</span>
            <ShipPips length={def.length} hits={showDamage || sunk ? hits : 0} sunk={sunk} />
            <span className="fleet__state">{sunk ? 'Sunk' : 'Afloat'}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}
