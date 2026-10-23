import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import { buildFleetBoard } from './test/helpers'

// Make every "random" fleet the known layout from buildFleetBoard so the
// UI tests know where the AI's ships are: rows 0/2/4/6/8 from column A.
vi.mock('./game/board', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./game/board')>()
  return { ...actual, createRandomFleetBoard: () => buildFleetBoard() }
})

const AI_DELAY = 500
const cell = (board: 'Your waters' | 'Enemy waters', coord: string) =>
  screen.getByRole('button', { name: new RegExp(`^${board} ${coord},`) })
const status = () => screen.getByTestId('status-message').textContent

function startRandomGame() {
  fireEvent.click(screen.getByRole('button', { name: 'Randomize' }))
  fireEvent.click(screen.getByRole('button', { name: 'Start battle' }))
}

function finishAITurn() {
  act(() => {
    vi.advanceTimersByTime(AI_DELAY)
  })
}

const SHIP_COORDS = [
  ['A1', 'B1', 'C1', 'D1', 'E1'],
  ['A3', 'B3', 'C3', 'D3'],
  ['A5', 'B5', 'C5'],
  ['A7', 'B7', 'C7'],
  ['A9', 'B9'],
].flat()

beforeEach(() => {
  vi.useFakeTimers()
})
afterEach(() => {
  vi.useRealTimers()
})

describe('App', () => {
  it('starts in placement and requires a full fleet before battle', () => {
    render(<App aiDelayMs={AI_DELAY} />)
    expect(status()).toMatch(/Position your ships/)
    expect(screen.getByRole('button', { name: 'Start battle' })).toBeDisabled()
    fireEvent.click(screen.getByRole('button', { name: 'Randomize' }))
    expect(screen.getByRole('button', { name: 'Start battle' })).toBeEnabled()
  })

  it('places, rotates and rejects invalid manual placements', () => {
    render(<App aiDelayMs={AI_DELAY} />)
    fireEvent.click(cell('Your waters', 'A1'))
    for (const c of ['A1', 'B1', 'C1', 'D1', 'E1']) {
      expect(cell('Your waters', c)).toHaveAttribute('data-status', 'ship')
    }

    // Battleship (4) horizontally from H2 would run off the board.
    fireEvent.click(cell('Your waters', 'H2'))
    expect(screen.getByText(/extend beyond the board/)).toBeInTheDocument()
    expect(cell('Your waters', 'H2')).toHaveAttribute('data-status', 'empty')

    // Rotate, then place the battleship vertically down column J.
    fireEvent.click(screen.getByRole('button', { name: /Rotate \(Horizontal\)/ }))
    expect(screen.getByRole('button', { name: /Rotate \(Vertical\)/ })).toBeInTheDocument()
    fireEvent.click(cell('Your waters', 'J2'))
    for (const c of ['J2', 'J3', 'J4', 'J5']) {
      expect(cell('Your waters', c)).toHaveAttribute('data-status', 'ship')
    }

    // Clicking a placed ship picks it up again.
    fireEvent.click(cell('Your waters', 'J3'))
    expect(cell('Your waters', 'J3')).toHaveAttribute('data-status', 'empty')
  })

  it('alternates turns and prevents repeated attacks', () => {
    render(<App aiDelayMs={AI_DELAY} />)
    startRandomGame()
    expect(status()).toMatch(/Your turn/)

    fireEvent.click(cell('Enemy waters', 'J10'))
    expect(cell('Enemy waters', 'J10')).toHaveAttribute('data-status', 'miss')
    expect(status()).toMatch(/Enemy is taking aim/)
    // Enemy board is locked during the AI turn.
    expect(cell('Enemy waters', 'A1')).toBeDisabled()

    finishAITurn()
    expect(status()).toMatch(/Your turn/)
    const playerShots = screen
      .getAllByRole('button', { name: /^Your waters / })
      .filter((b) => ['hit', 'miss', 'sunk'].includes(b.getAttribute('data-status')!))
    expect(playerShots).toHaveLength(1)

    // The already-attacked cell can't be fired on again.
    expect(cell('Enemy waters', 'J10')).toBeDisabled()
    expect(cell('Enemy waters', 'A1')).toBeEnabled()
  })

  it('shows hits, sunk ships and remaining counts, then declares the winner', () => {
    render(<App aiDelayMs={AI_DELAY} />)
    startRandomGame()
    const remaining = () => screen.getByTestId('Enemy ships-remaining').textContent

    fireEvent.click(cell('Enemy waters', 'A9'))
    expect(cell('Enemy waters', 'A9')).toHaveAttribute('data-status', 'hit')
    finishAITurn()
    fireEvent.click(cell('Enemy waters', 'B9'))
    expect(cell('Enemy waters', 'A9')).toHaveAttribute('data-status', 'sunk')
    expect(remaining()).toBe('4 / 5 afloat')
    expect(screen.getByText('You sank the enemy Destroyer at B9!')).toBeInTheDocument()
    finishAITurn()

    for (const coord of SHIP_COORDS.filter((c) => c !== 'A9' && c !== 'B9')) {
      fireEvent.click(cell('Enemy waters', coord))
      finishAITurn()
    }
    // The AI could in theory win first; with 15 more moves it cannot sink 17 cells.
    expect(status()).toMatch(/Victory/)
    expect(remaining()).toBe('0 / 5 afloat')
    // No attacks once the game is over.
    expect(cell('Enemy waters', 'J10')).toBeDisabled()
  })

  it('New game resets mid-game and cancels the pending AI move', () => {
    render(<App aiDelayMs={AI_DELAY} />)
    startRandomGame()
    fireEvent.click(cell('Enemy waters', 'A1'))
    expect(status()).toMatch(/Enemy is taking aim/)

    fireEvent.click(screen.getByRole('button', { name: 'New game' }))
    finishAITurn()

    expect(status()).toMatch(/Position your ships/)
    expect(screen.queryByRole('group', { name: 'Enemy waters' })).not.toBeInTheDocument()
    const yourCells = within(screen.getByRole('group', { name: 'Your waters' })).getAllByRole('button')
    expect(yourCells).toHaveLength(100)
    yourCells.forEach((b) => expect(b).toHaveAttribute('data-status', 'empty'))
  })
})
