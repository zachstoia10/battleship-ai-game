import { useEffect, useState, type CSSProperties } from 'react'
import { brandFor } from '../branding/competitors'
import type { LogEntry } from '../game/gameReducer'

export const ELIMINATION_BANNER_MS = 2600
export const VICTORY_BANNER_MS = 4600
export const VICTORY_MESSAGE = "Congratulations! You've Beaten the Competition!"

interface EliminationBannerProps {
  entry: LogEntry
  /** The final competitor fell: celebrate the win instead. */
  victory?: boolean
}

/** Celebrates a fully sunk competitor. Remount (via `key`) for each new sink. */
export function EliminationBanner({ entry, victory = false }: EliminationBannerProps) {
  const [visible, setVisible] = useState(true)
  const duration = victory ? VICTORY_BANNER_MS : ELIMINATION_BANNER_MS

  useEffect(() => {
    const timer = window.setTimeout(() => setVisible(false), duration)
    return () => window.clearTimeout(timer)
  }, [duration])

  if (!visible || !entry.shipName) return null
  const logo = entry.shipId ? brandFor(entry.shipId)?.logo : undefined
  const style = { '--elim-hold': `${(duration - 400) / 1000}s` } as CSSProperties

  return (
    <div
      className={`elimination${victory ? ' elimination--victory' : ''}`}
      role="alert"
      data-testid="elimination"
      style={style}
    >
      <div className="elimination__card">
        <span className="elimination__bars" aria-hidden="true">
          <span />
          <span />
          <span />
          <span />
        </span>
        <p className="elimination__eyebrow">
          {victory ? `// ${entry.shipName} Eliminated! · 0 competitors remaining` : '// Competitor down'}
        </p>
        <div className="elimination__body">
          {logo && !victory && (
            <span className="elimination__logo">
              <img src={logo} alt="" />
            </span>
          )}
          <p className="elimination__title">{victory ? VICTORY_MESSAGE : `${entry.shipName} Eliminated!`}</p>
        </div>
        <span className="elimination__scan" aria-hidden="true" />
      </div>
    </div>
  )
}
