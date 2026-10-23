export type CellStatus = 'empty' | 'ship' | 'hit' | 'miss' | 'sunk'

interface CellProps {
  status: CellStatus
  label: string
  preview: 'valid' | 'invalid' | null
  isLastShot: boolean
  disabled: boolean
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

export function Cell({ status, label, preview, isLastShot, disabled, onClick, onHover }: CellProps) {
  const classes = [
    'cell',
    `cell--${status}`,
    preview && `cell--preview-${preview}`,
    isLastShot && 'cell--last',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <button
      type="button"
      className={classes}
      aria-label={`${label}, ${STATUS_TEXT[status]}`}
      data-status={status}
      disabled={disabled}
      onClick={onClick}
      onMouseEnter={onHover}
      onFocus={onHover}
    >
      {(status === 'hit' || status === 'sunk') && <span className="cell__marker cell__marker--hit" />}
      {status === 'miss' && <span className="cell__marker cell__marker--miss" />}
    </button>
  )
}
