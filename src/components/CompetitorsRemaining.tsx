import { brandFor } from '../branding/competitors'
import { isShipSunk } from '../game/attack'
import { ENEMY_FLEET, type Board } from '../game/types'

/** Alive/eliminated roll call for the AI's fleet. Shows names only, never positions or damage. */
export function CompetitorsRemaining({ board }: { board: Board }) {
  const rivals = ENEMY_FLEET.map((def) => {
    const ship = board.ships.find((s) => s.id === def.id)
    return { def, eliminated: !!ship && isShipSunk(board, ship) }
  })
  const remaining = rivals.filter((r) => !r.eliminated).length

  return (
    <section className="panel rivals" aria-labelledby="rivals-heading">
      <header className="rivals__header">
        <h2 id="rivals-heading">Competitors Remaining</h2>
        <p className="rivals__count" data-testid="competitors-remaining" aria-live="polite">
          <strong>{remaining}</strong> of {ENEMY_FLEET.length} Competitors Remaining
        </p>
      </header>
      <ul className="rivals__list">
        {rivals.map(({ def, eliminated }) => (
          <li
            key={def.id}
            className={`rival${eliminated ? ' rival--eliminated' : ''}`}
            data-testid={`rival-${def.id}`}
          >
            <span className="rival__logo">
              <img src={brandFor(def.id)?.logo} alt="" />
            </span>
            <span className="rival__name">{def.name}</span>
            <span className="rival__state">{eliminated ? 'Eliminated' : 'Active'}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}
