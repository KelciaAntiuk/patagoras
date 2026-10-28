import type Phaser from 'phaser'
import type { PuzzleId } from '../../puzzles'
import type { WorldRect } from '../Collision/Collision.types'
import type { InventorySystem } from '../Inventory/InventorySystem'
import type { ItemId } from '../Inventory/Inventory.types'

// ---------------------------------------------------------------------------
// Eventos
// ---------------------------------------------------------------------------

export const DOOR_EVENTS = {
  /** Emitido quando a porta é destrancada (isLocked → false). */
  UNLOCKED: 'door-unlocked',
  /** Emitido quando a porta é aberta (isOpen → true). */
  OPENED: 'door-opened',
  /** Emitido quando a porta é fechada (isOpen → false). */
  CLOSED: 'door-closed',
  /** Emitido quando o jogador tenta interagir com uma porta trancada. */
  LOCKED_FEEDBACK: 'door-locked-feedback',
} as const

export type DoorEvent = (typeof DOOR_EVENTS)[keyof typeof DOOR_EVENTS]

// ---------------------------------------------------------------------------
// Condição de desbloqueio
// ---------------------------------------------------------------------------

/**
 * Função que determina se a porta pode ser destrancada.
 * Recebe o inventário do jogador como argumento para poder verificar itens,
 * puzzles resolvidos, etc.
 *
 * Retorna `true` se a condição for satisfeita.
 */
export type UnlockConditionFn = (inventario: InventorySystem) => boolean

/**
 * Definição da condição de desbloqueio de uma porta.
 *
 * Pode ser:
 * - Um **callback** livre (`UnlockConditionFn`)
 * - Um **itemId** (a porta destrava se o jogador tiver esse item)
 * - Um **puzzleId** (a porta destrava quando um evento `puzzle-solved` for
 *   emitido para esse puzzleId — integrado via `PuzzleDoorSystem`)
 */
export type UnlockCondition =
  | { readonly tipo: 'callback'; readonly fn: UnlockConditionFn }
  | { readonly tipo: 'item'; readonly itemId: ItemId }
  | { readonly tipo: 'puzzle'; readonly puzzleId: PuzzleId }

// ---------------------------------------------------------------------------
// Definição da porta (dados declarativos)
// ---------------------------------------------------------------------------

export interface PuzzleDoorDefinition {
  /** Identificador único da porta. */
  readonly id: string

  /** Posição e tamanho do retângulo visual/físico da porta. */
  readonly x: number
  readonly y: number
  readonly largura: number
  readonly altura: number

  /** Condição que destranca a porta. */
  readonly condicao: UnlockCondition

  /** Mensagem exibida ao abrir (ex: "O refeitório foi destrancado."). */
  readonly mensagemAbrir?: string

  /** Mensagem exibida quando a porta está trancada (ex: "Trancada"). */
  readonly mensagemTrancada?: string

  /** Se true, o jogador pode fechar a porta depois de aberta. Padrão: false. */
  readonly podeFechar?: boolean

  /** Chave de textura opcional caso utilize sprite/spritesheet. */
  readonly textureKey?: string

  /** Frame ou animação para porta aberta e fechada. */
  readonly openFrame?: string | number
  readonly closeFrame?: string | number
  readonly openAnimKey?: string
  readonly closeAnimKey?: string

  /** Cor de preenchimento da porta (padrão: 0x6b4526). */
  readonly cor?: number

  /** Cor da borda da porta (padrão: 0x2f1d0e). */
  readonly corBorda?: number

  /** Profundidade de renderização (padrão: 5). */
  readonly depth?: number
}

// ---------------------------------------------------------------------------
// Configuração do sistema
// ---------------------------------------------------------------------------

export interface PuzzleDoorSystemConfig {
  readonly jogador: Phaser.Physics.Arcade.Sprite
  readonly inventario: InventorySystem
  readonly puzzles?: import('../Puzzle/PuzzleSystem').PuzzleSystem
  readonly atoresColisao?: readonly Phaser.Physics.Arcade.Sprite[]
  readonly getObstacles?: () => readonly WorldRect[]

  /** Raio de proximidade para habilitar interação (padrão: 24). */
  readonly raioInteracao?: number
}
