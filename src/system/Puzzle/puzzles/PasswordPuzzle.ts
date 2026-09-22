import { PuzzleKind } from '../Puzzle.types'
import type { PasswordPuzzleDef } from '../Puzzle.types'

export function createPasswordPuzzle(
  id: string,
  roomId: string,
  prerequisiteIds: string[],
  description: string,
  prompt: string,
  answer: string,
  caseSensitive = false
): PasswordPuzzleDef {
  return {
    id,
    kind: PuzzleKind.Password,
    roomId,
    description,
    prerequisiteIds,
    prompt,
    answer,
    caseSensitive,
  }
}

