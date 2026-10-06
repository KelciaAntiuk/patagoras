import type { Puzzle } from '../Puzzle'
import type { PuzzleContexto, PuzzleDefinicao } from '../Puzzle.types'
import { NotaPuzzle } from './NotaPuzzle'
import { SlotsPuzzle } from './SlotsPuzzle'

export function criarPuzzle(ctx: PuzzleContexto, def: PuzzleDefinicao): Puzzle {
  switch (def.tipo) {
    case 'slots':
      return new SlotsPuzzle(ctx, def)
    case 'nota':
      return new NotaPuzzle(ctx, def)
  }
}
