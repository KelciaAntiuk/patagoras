import type Phaser from 'phaser'
import type { InventorySystem } from '../Inventory/InventorySystem'

export const PUZZLE_EVENTS = {
  /** Puzzle abriu. Payload: `puzzleId`. */
  OPENED: 'puzzle-opened',
  /** Jogador resolveu o puzzle. Payload: `puzzleId`. Sempre seguido de CLOSED. */
  SOLVED: 'puzzle-solved',
  /** Puzzle fechou, por qualquer motivo. Payload: `PuzzleFechamento`. */
  CLOSED: 'puzzle-closed',
} as const

export const PuzzleCloseReason = {
  /** ESC ou botão X. */
  Jogador: 'jogador',
  /** O Patágoras pegou o jogador com o puzzle aberto. */
  Atacado: 'atacado',
  /** O puzzle foi resolvido. */
  Resolvido: 'resolvido',
  /** A GameScene foi encerrada (reiniciar, sair...). */
  Encerrado: 'encerrado',
} as const

export type PuzzleCloseReason = (typeof PuzzleCloseReason)[keyof typeof PuzzleCloseReason]

export interface PuzzleFechamento {
  readonly puzzleId: string
  readonly motivo: PuzzleCloseReason
}

/**
 * Tudo que um puzzle concreto recebe da base. O puzzle só precisa
 * desenhar dentro de `area` e chamar `resolver()` quando o jogador acertar;
 * abrir, fechar, overlay, inventário e ataque do Patágoras ficam por conta da base.
 */
export interface PuzzleContexto {
  /** Cena do modal — use para criar game objects, tweens, timers e teclas. */
  readonly cena: Phaser.Scene
  /** Região livre do modal, entre o título e o inventário. */
  readonly area: Phaser.Geom.Rectangle
  /** Inventário do jogador. Alterações aparecem na hora na barra do modal e no HUD. */
  readonly inventario: InventorySystem
  /** Marca o puzzle como resolvido e fecha o modal. */
  resolver(): void
  /** Fecha o modal sem resolver. */
  fechar(): void
}
