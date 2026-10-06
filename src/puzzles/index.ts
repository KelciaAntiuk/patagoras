import type { Puzzle } from '../system/Puzzle/Puzzle'
import type { PuzzleContexto } from '../system/Puzzle/Puzzle.types'
import { PuzzleTeste } from './PuzzleTeste'

/** Todos os puzzles do jogo. A chave é o id usado nos gatilhos do mapa. */
export const PUZZLES = {
  teste: PuzzleTeste,
} satisfies Record<string, new (ctx: PuzzleContexto) => Puzzle>

export type PuzzleId = keyof typeof PUZZLES
