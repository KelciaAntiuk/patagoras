import type { ItemDefinition } from '../Inventory/Inventory.types'
import type { PuzzleContexto } from './Puzzle.types'

/**
 * Classe base de todo puzzle do jogo.
 *
 * Para criar um puzzle novo:
 * 1. Crie uma classe em `src/puzzles/` que estenda `Puzzle`.
 * 2. Defina `titulo` e implemente `montar()` desenhando dentro de `this.ctx.area`.
 * 3. Registre a classe em `src/puzzles/index.ts`.
 *
 * Game objects criados com `this.ctx.cena` são destruídos sozinhos quando o
 * modal fecha; `desmontar()` só é necessário para limpar coisas fora da cena.
 */
export abstract class Puzzle {
  abstract readonly titulo: string

  constructor(protected readonly ctx: PuzzleContexto) {}

  abstract montar(): void

  /** Jogador clicou em um item do inventário com o puzzle aberto. */
  aoSelecionarItem(_item: ItemDefinition, _indice: number): void {}

  /** Chamado quando o modal fecha, por qualquer motivo. */
  desmontar(): void {}
}
