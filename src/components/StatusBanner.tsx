import type { Phase } from '../game/gameReducer'
import type { Player } from '../game/types'

interface StatusBannerProps {
  phase: Phase
  turn: Player
  winner: Player | null
  notice: string | null
}

export function StatusBanner({ phase, turn, winner, notice }: StatusBannerProps) {
  let message: string
  let tone: string
  if (phase === 'placement') {
    message = 'Position your ships, then start the battle.'
    tone = 'neutral'
  } else if (phase === 'gameOver') {
    message = winner === 'player' ? 'Victory! You sank the enemy fleet.' : 'Defeat. Your fleet has been sunk.'
    tone = winner === 'player' ? 'win' : 'lose'
  } else if (turn === 'player') {
    message = 'Your turn — fire on the enemy waters.'
    tone = 'player'
  } else {
    message = 'Enemy is taking aim…'
    tone = 'ai'
  }

  return (
    <div className={`status status--${tone}`} role="status" aria-live="polite">
      <p className="status__message" data-testid="status-message">
        {message}
      </p>
      {notice && <p className="status__notice">{notice}</p>}
    </div>
  )
}
