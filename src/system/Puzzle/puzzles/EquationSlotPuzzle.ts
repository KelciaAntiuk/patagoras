import { PuzzleKind } from '../Puzzle.types'
import type { EquationSlotPuzzleDef } from '../Puzzle.types'

export function createEquationSlotPuzzle(
  id: string,
  roomId: string,
  prerequisiteIds: string[],
  description: string,
  equation: string,
  slotIndex: number,
  answer: number
): EquationSlotPuzzleDef {
  return {
    id,
    kind: PuzzleKind.EquationSlot,
    roomId,
    description,
    prerequisiteIds,
    equation,
    slotIndex,
    answer,
  }
}

