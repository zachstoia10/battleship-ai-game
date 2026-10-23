import { useEffect, useState } from 'react'
import { Board, type PlacementPreview } from './components/Board'
import { FleetStatus } from './components/FleetStatus'
import { GameLog } from './components/GameLog'
import { PlacementPanel } from './components/PlacementPanel'
import { StatusBanner } from './components/StatusBanner'
import { getShipCells, shipAt, validatePlacement } from './game/board'
import { isInBounds } from './game/coords'
import { FLEET, type Coord } from './game/types'
import { useBattleship } from './hooks/useBattleship'

interface AppProps {
  aiDelayMs?: number
}

export default function App({ aiDelayMs }: AppProps) {
  const [state, dispatch] = useBattleship(aiDelayMs)
  const [hover, setHover] = useState<Coord | null>(null)
  const { phase, turn, playerBoard, aiBoard, selectedShipId, orientation } = state
  const placing = phase === 'placement'

  useEffect(() => {
    if (!placing) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'r' || e.key === 'R') dispatch({ type: 'ROTATE' })
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [placing, dispatch])

  let preview: PlacementPreview | null = null
  const selectedDef = FLEET.find((d) => d.id === selectedShipId)
  if (placing && hover && selectedDef && !shipAt(playerBoard, hover)) {
    const cells = getShipCells(hover, selectedDef.length, orientation)
    preview = {
      cells: cells.filter(isInBounds),
      valid: validatePlacement(playerBoard, cells, selectedDef.id) === null,
    }
  }

  const handlePlayerBoardClick = (coord: Coord) => {
    const ship = shipAt(playerBoard, coord)
    if (ship) dispatch({ type: 'PICK_UP_SHIP', shipId: ship.id })
    else dispatch({ type: 'PLACE_SHIP', coord })
  }

  const newGame = () => {
    setHover(null)
    dispatch({ type: 'NEW_GAME' })
  }

  return (
    <div className="app">
      <header className="app__header">
        <div className="brand">
          <svg className="brand__icon" viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M12 2a2 2 0 0 1 1 3.73V8h3v2h-3v9.93A8 8 0 0 0 19.93 14H18l3-4 3 4h-2.05A10 10 0 0 1 2.05 14H0l3-4 3 4H4.07A8 8 0 0 0 11 19.93V10H8V8h3V5.73A2 2 0 0 1 12 2Z"
              fill="currentColor"
            />
          </svg>
          <h1>Battleship</h1>
        </div>
        <button type="button" className="btn btn--primary" onClick={newGame}>
          New game
        </button>
      </header>

      <StatusBanner phase={phase} turn={turn} winner={state.winner} notice={state.notice} />

      <main className={`layout${placing ? ' layout--placement' : ''}`}>
        <section className="theater" aria-labelledby="player-heading">
          <h2 id="player-heading" className="theater__title">
            Your fleet
          </h2>
          <Board
            board={playerBoard}
            label="Your waters"
            showShips
            lastShot={state.lastAIShot}
            preview={preview}
            onCellClick={placing ? handlePlayerBoardClick : undefined}
            onCellHover={placing ? setHover : undefined}
          />
          {!placing && <FleetStatus title="Your ships" board={playerBoard} showDamage />}
        </section>

        {placing ? (
          <PlacementPanel
            board={playerBoard}
            selectedShipId={selectedShipId}
            orientation={orientation}
            onSelectShip={(shipId) =>
              playerBoard.ships.some((s) => s.id === shipId)
                ? dispatch({ type: 'PICK_UP_SHIP', shipId })
                : dispatch({ type: 'SELECT_SHIP', shipId })
            }
            onRotate={() => dispatch({ type: 'ROTATE' })}
            onRandomize={() => dispatch({ type: 'RANDOMIZE_PLACEMENT' })}
            onClear={() => dispatch({ type: 'CLEAR_PLACEMENT' })}
            onStart={() => dispatch({ type: 'START_GAME' })}
          />
        ) : (
          <section className="theater" aria-labelledby="enemy-heading">
            <h2 id="enemy-heading" className="theater__title">
              Enemy waters
            </h2>
            <Board
              board={aiBoard}
              label="Enemy waters"
              showShips={phase === 'gameOver'}
              lastShot={state.lastPlayerShot}
              disabled={phase !== 'playing' || turn !== 'player'}
              onCellClick={(coord) => dispatch({ type: 'PLAYER_ATTACK', coord })}
              isCellDisabled={(c) => aiBoard.shots[c.row][c.col] !== null}
            />
            <FleetStatus title="Enemy ships" board={aiBoard} showDamage={false} />
          </section>
        )}
      </main>

      {!placing && <GameLog entries={state.log} />}

      <footer className="app__footer">Hunt the enemy fleet before they find yours.</footer>
    </div>
  )
}
