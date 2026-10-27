import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import { ELIMINATION_BANNER_MS, VICTORY_BANNER_MS } from './components/EliminationBanner'
import { buildFleetBoard } from './test/helpers'

// Make every "random" fleet the known layout from buildFleetBoard so the
// UI tests know where the AI's ships are: rows 0/2/4/6/8 from column A.
vi.mock('./game/board', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./game/board')>()
  return {
    ...actual,
    createRandomFleetBoard: (_rng?: () => number, fleet?: Parameters<typeof buildFleetBoard>[1]) =>
      buildFleetBoard({}, fleet),
  }
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

    // William McCarthy (4) horizontally from H2 would run off the board.
    fireEvent.click(cell('Your waters', 'H2'))
    expect(screen.getByText('William McCarthy would extend beyond the board.')).toBeInTheDocument()
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
    const remaining = () => screen.getByTestId('competitors-remaining').textContent
    expect(remaining()).toBe('5 of 5 Competitors Remaining')

    fireEvent.click(cell('Enemy waters', 'A9'))
    expect(cell('Enemy waters', 'A9')).toHaveAttribute('data-status', 'hit')
    finishAITurn()
    fireEvent.click(cell('Enemy waters', 'B9'))
    expect(cell('Enemy waters', 'A9')).toHaveAttribute('data-status', 'sunk')
    expect(remaining()).toBe('4 of 5 Competitors Remaining')
    expect(screen.getByTestId('rival-gemini')).toHaveTextContent('Eliminated')
    expect(screen.getByTestId('rival-gemini')).toHaveClass('rival--eliminated')
    expect(screen.getByTestId('rival-cursor')).toHaveTextContent('Active')
    expect(screen.getByRole('progressbar', { name: 'Competitors eliminated' })).toHaveAttribute('aria-valuenow', '1')
    expect(screen.queryByTestId('confetti')).not.toBeInTheDocument()
    expect(screen.getByText('You eliminated Google Gemini Code Assist at B9!')).toBeInTheDocument()
    finishAITurn()

    for (const coord of SHIP_COORDS.filter((c) => c !== 'A9' && c !== 'B9')) {
      fireEvent.click(cell('Enemy waters', coord))
      finishAITurn()
    }
    // The AI could in theory win first; with 15 more moves it cannot sink 17 cells.
    expect(status()).toBe("Congratulations! You've Beaten the Competition!")
    expect(screen.getByRole('alert')).toHaveTextContent("Congratulations! You've Beaten the Competition!")
    expect(remaining()).toBe('0 of 5 Competitors Remaining')
    expect(screen.getByRole('progressbar', { name: 'Competitors eliminated' })).toHaveAttribute('aria-valuenow', '5')
    expect(screen.getByTestId('confetti')).toBeInTheDocument()
    act(() => {
      vi.advanceTimersByTime(VICTORY_BANNER_MS)
    })
    expect(screen.queryByTestId('elimination')).not.toBeInTheDocument()
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

  it('keeps the player ships as classic ships with no competitor logos', () => {
    render(<App aiDelayMs={AI_DELAY} />)
    expect(screen.getByRole('heading', { name: /Cognition · Your fleet/ })).toBeInTheDocument()
    expect(screen.queryByText('GitHub Copilot', { selector: '.ship-option__name' })).not.toBeInTheDocument()
    fireEvent.click(cell('Your waters', 'A1'))
    fireEvent.click(screen.getByRole('button', { name: /Rotate/ }))
    fireEvent.click(cell('Your waters', 'J2'))
    for (const c of ['A1', 'B1', 'C1', 'D1', 'E1', 'J2', 'J3', 'J4', 'J5']) {
      const el = cell('Your waters', c)
      expect(el).toHaveAttribute('data-status', 'ship')
      expect(el).not.toHaveAttribute('data-ship')
      expect(el.querySelector('img')).toBeNull()
    }
    // Each ship is drawn as one hull: rounded start, middle segments, rounded end.
    const hull = (c: string) => cell('Your waters', c).querySelector('.cell__hull')
    expect(hull('A1')).toHaveClass('cell__hull--h', 'cell__hull--start')
    expect(hull('C1')).toHaveClass('cell__hull--h', 'cell__hull--middle')
    expect(hull('E1')).toHaveClass('cell__hull--h', 'cell__hull--end')
    expect(hull('J2')).toHaveClass('cell__hull--v', 'cell__hull--start')
    expect(hull('J5')).toHaveClass('cell__hull--v', 'cell__hull--end')
    expect(hull('F1')).toBeNull()
  })

  it('keeps enemy competitors hidden until hit, then shows the logo under the red marker', () => {
    render(<App aiDelayMs={AI_DELAY} />)
    startRandomGame()
    for (const c of SHIP_COORDS) {
      expect(cell('Enemy waters', c)).not.toHaveAttribute('data-ship')
      expect(cell('Enemy waters', c).querySelector('img')).toBeNull()
    }

    fireEvent.click(cell('Enemy waters', 'A1'))
    const hit = cell('Enemy waters', 'A1')
    expect(hit).toHaveAttribute('data-status', 'hit')
    expect(hit).toHaveAttribute('data-ship', 'copilot')
    // A lone hit must not reveal which way the ship runs.
    expect(hit).toHaveClass('cell--isolated')
    expect(hit).not.toHaveClass('cell--h')
    expect(hit).not.toHaveClass('cell--v')
    const [logo, marker] = Array.from(hit.children)
    expect(logo).toHaveClass('cell__logo')
    expect(marker).toHaveClass('cell__marker--hit')
    // Neighbouring cells of the same ship stay hidden.
    expect(cell('Enemy waters', 'B1')).not.toHaveAttribute('data-ship')
    // Misses are unchanged: no logo.
    finishAITurn()
    fireEvent.click(cell('Enemy waters', 'J10'))
    expect(cell('Enemy waters', 'J10').querySelector('img')).toBeNull()
    expect(cell('Enemy waters', 'J10').querySelector('.cell__marker--miss')).not.toBeNull()
  })

  it('announces each eliminated competitor by name', () => {
    render(<App aiDelayMs={AI_DELAY} />)
    startRandomGame()
    fireEvent.click(cell('Enemy waters', 'A9'))
    expect(screen.queryByTestId('elimination')).not.toBeInTheDocument()
    finishAITurn()
    fireEvent.click(cell('Enemy waters', 'B9'))
    expect(screen.getByRole('alert')).toHaveTextContent('Google Gemini Code Assist Eliminated!')
    // Once sunk, the whole hull outline is shown.
    expect(cell('Enemy waters', 'A9')).toHaveClass('cell--h', 'cell--seg-start')
    expect(cell('Enemy waters', 'B9')).toHaveClass('cell--h', 'cell--seg-end')

    act(() => {
      vi.advanceTimersByTime(ELIMINATION_BANNER_MS)
    })
    expect(screen.queryByTestId('elimination')).not.toBeInTheDocument()

    for (const c of ['A7', 'B7', 'C7']) {
      finishAITurn()
      fireEvent.click(cell('Enemy waters', c))
    }
    expect(screen.getByRole('alert')).toHaveTextContent('OpenAI Codex Eliminated!')
  })
})
