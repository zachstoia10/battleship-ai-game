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
  const eliminated = ENEMY_FLEET.length - remaining

  return (
    <section className="panel rivals" aria-labelledby="rivals-heading">
      <header className="rivals__header">
        <h2 id="rivals-heading">Competitors Remaining</h2>
        <p className="rivals__count" data-testid="competitors-remaining" aria-live="polite">
          <strong>{remaining}</strong> of {ENEMY_FLEET.length} Competitors Remaining
        </p>
      </header>
      <div
        className="rivals__progress"
        role="progressbar"
        aria-label="Competitors eliminated"
        aria-valuemin={0}
        aria-valuemax={ENEMY_FLEET.length}
        aria-valuenow={eliminated}
      >
        <span className="rivals__progress-fill" style={{ width: `${(eliminated / ENEMY_FLEET.length) * 100}%` }} />
      </div>
      <ul className="rivals__list">
        {rivals.map(({ def, eliminated: out }) => (
          <li
            key={def.id}
            className={`rival${out ? ' rival--eliminated' : ''}`}
            data-testid={`rival-${def.id}`}
          >
            <span className="rival__logo">
              <img src={brandFor(def.id)?.logo} alt="" />
            </span>
            <span className="rival__name">{def.name}</span>
            <span className="rival__state">{out ? 'Eliminated' : 'Active'}</span>
            {out && (
              <span className="rival__stamp" aria-hidden="true">
                Eliminated
              </span>
            )}
          </li>
        ))}
      </ul>
    </section>
  )
}
