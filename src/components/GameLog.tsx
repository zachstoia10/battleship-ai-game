import type { LogEntry } from '../game/gameReducer'

export function GameLog({ entries }: { entries: LogEntry[] }) {
  return (
    <section className="panel log" aria-labelledby="log-heading">
      <h3 id="log-heading">Captain's log</h3>
      {entries.length === 0 ? (
        <p className="panel__hint">No shots fired yet.</p>
      ) : (
        <ol className="log__list">
          {entries.slice(0, 12).map((entry) => (
            <li key={entry.id} className={`log__entry log__entry--${entry.actor} log__entry--${entry.kind}`}>
              {entry.text}
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}
