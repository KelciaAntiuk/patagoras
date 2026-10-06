import { PuzzleKind } from '../Puzzle.types'
import type { NotePuzzleDef } from '../Puzzle.types'

export function createNotePuzzle(
  id: string,
  roomId: string,
  prerequisiteIds: string[],
  description: string,
  noteText: string
): NotePuzzleDef {
  return {
    id,
    kind: PuzzleKind.Note,
    roomId,
    description,
    prerequisiteIds,
    noteText,
  }
}

