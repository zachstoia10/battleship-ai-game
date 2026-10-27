import type { CSSProperties } from 'react'

const COLORS = ['#193cb8', '#fcbb00', '#9f2d00', '#6e11b0', '#fa5050', '#ffffff']
const PIECES = 70

/** Deterministic spread (golden-ratio steps) so every render is identical. */
const spread = (i: number, salt: number) => ((i + 1) * 0.618033988749 * salt) % 1

/** One-shot confetti burst for the final win. Decorative only. */
export function Confetti() {
  return (
    <div className="confetti" aria-hidden="true" data-testid="confetti">
      {Array.from({ length: PIECES }, (_, i) => {
        const style = {
          left: `${spread(i, 1) * 100}%`,
          background: COLORS[i % COLORS.length],
          '--drift': `${(spread(i, 3) - 0.5) * 260}px`,
          '--spin': `${360 + spread(i, 5) * 720}deg`,
          animationDelay: `${spread(i, 7) * 0.9}s`,
          animationDuration: `${2.6 + spread(i, 11) * 1.6}s`,
          width: `${6 + spread(i, 13) * 6}px`,
          height: `${8 + spread(i, 17) * 8}px`,
        } as CSSProperties
        return <span key={i} className="confetti__piece" style={style} />
      })}
    </div>
  )
}
