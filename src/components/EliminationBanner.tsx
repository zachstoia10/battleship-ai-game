import { useEffect, useState } from 'react'
import { brandFor } from '../branding/competitors'
import type { LogEntry } from '../game/gameReducer'

export const ELIMINATION_BANNER_MS = 2600

/** Celebrates a fully sunk competitor. Remount (via `key`) for each new sink. */
export function EliminationBanner({ entry }: { entry: LogEntry }) {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const timer = window.setTimeout(() => setVisible(false), ELIMINATION_BANNER_MS)
    return () => window.clearTimeout(timer)
  }, [])

  if (!visible || !entry.shipName) return null
  const logo = entry.shipId ? brandFor(entry.shipId)?.logo : undefined
  const byPlayer = entry.actor === 'player'

  return (
    <div className={`elimination elimination--${entry.actor}`} role="alert" data-testid="elimination">
      <div className="elimination__card">
        <span className="elimination__bars" aria-hidden="true">
          <span />
          <span />
          <span />
          <span />
        </span>
        <p className="elimination__eyebrow">{byPlayer ? '// Competitor down' : '// You lost a ship'}</p>
        <div className="elimination__body">
          {logo && (
            <span className="elimination__logo">
              <img src={logo} alt="" />
            </span>
          )}
          <p className="elimination__title">{entry.shipName} Eliminated!</p>
        </div>
        <span className="elimination__scan" aria-hidden="true" />
      </div>
    </div>
  )
}
