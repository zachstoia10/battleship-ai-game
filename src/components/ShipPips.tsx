interface ShipPipsProps {
  length: number
  hits?: number
  sunk?: boolean
}

export function ShipPips({ length, hits = 0, sunk = false }: ShipPipsProps) {
  return (
    <span className={`pips${sunk ? ' pips--sunk' : ''}`} aria-hidden="true">
      {Array.from({ length }, (_, i) => (
        <span key={i} className={`pip${i < hits ? ' pip--hit' : ''}`} />
      ))}
    </span>
  )
}
