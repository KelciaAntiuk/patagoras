import type { ItemDefinition } from '../Inventory/Inventory.types'
import type { PuzzleContexto, PuzzleDefinicao } from './Puzzle.types'

export abstract class Puzzle<D extends PuzzleDefinicao = PuzzleDefinicao> {
  constructor(
    protected readonly ctx: PuzzleContexto,
    protected readonly def: D,
  ) {}

  abstract montar(): void

  aoSelecionarItem(_item: ItemDefinition, _indice: number): void {}

  desmontar(): void {}
}
