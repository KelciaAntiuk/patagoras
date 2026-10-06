import { PuzzleKind } from '../Puzzle.types'
import type { NumberInputPuzzleDef } from '../Puzzle.types'

export function createNumberInputPuzzle(
  id: string,
  roomId: string,
  prerequisiteIds: string[],
  description: string,
  prompt: string,
  answer: number
): NumberInputPuzzleDef {
  return {
    id,
    kind: PuzzleKind.NumberInput,
    roomId,
    description,
    prerequisiteIds,
    prompt,
    answer,
  }
}

