import { useEffect, useReducer } from 'react'
import { chooseAIMove, createAIView } from '../game/ai'
import { createInitialState, gameReducer } from '../game/gameReducer'

export const AI_THINK_DELAY_MS = 700

/** Game state plus the side effect that makes the AI take its turn. */
export function useBattleship(aiDelayMs = AI_THINK_DELAY_MS) {
  const [state, dispatch] = useReducer(gameReducer, undefined, () => createInitialState())
  const { phase, turn, gameId, playerBoard } = state

  useEffect(() => {
    if (phase !== 'playing' || turn !== 'ai') return
    const timer = window.setTimeout(() => {
      const coord = chooseAIMove(createAIView(playerBoard))
      dispatch({ type: 'AI_ATTACK', coord, gameId })
    }, aiDelayMs)
    return () => window.clearTimeout(timer)
  }, [phase, turn, gameId, playerBoard, aiDelayMs])

  return [state, dispatch] as const
}
