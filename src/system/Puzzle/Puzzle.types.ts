import type Phaser from 'phaser'
import type { PuzzleId } from '../../puzzles'
import type { ItemDefinition, ItemId } from '../Inventory/Inventory.types'
import type { InventorySystem } from '../Inventory/InventorySystem'

export const PUZZLE_EVENTS = {
  OPENED: 'puzzle-opened',
  SOLVED: 'puzzle-solved',
  FAILED: 'puzzle-failed',
  CLOSED: 'puzzle-closed',
} as const

export const PuzzleCloseReason = {
  Jogador: 'jogador',
  Atacado: 'atacado',
  Resolvido: 'resolvido',
  Encerrado: 'encerrado',
} as const

export type PuzzleCloseReason = (typeof PuzzleCloseReason)[keyof typeof PuzzleCloseReason]

export interface PuzzleFechamento {
  readonly puzzleId: PuzzleId
  readonly motivo: PuzzleCloseReason
}

export const PuzzleEstado = {
  Bloqueado: 'bloqueado',
  Disponivel: 'disponivel',
  Resolvido: 'resolvido',
} as const

export type PuzzleEstado = (typeof PuzzleEstado)[keyof typeof PuzzleEstado]

/** Número: aceita item numérico com esse valor. Texto: aceita o item com esse id. */
export type RespostaSlot = number | ItemId

interface PuzzleBaseDef {
  readonly titulo: string
  readonly requisitos?: readonly PuzzleId[]
}

export interface SlotsPuzzleDef extends PuzzleBaseDef {
  readonly tipo: 'slots'
  readonly enunciado: string
  readonly slots: readonly { readonly rotulo?: string; readonly resposta: RespostaSlot }[]
}

export interface NotaPuzzleDef extends PuzzleBaseDef {
  readonly tipo: 'nota'
  readonly texto: string
}

export type PuzzleDefinicao = SlotsPuzzleDef | NotaPuzzleDef

export interface PuzzleContexto {
  readonly cena: Phaser.Scene
  readonly area: Phaser.Geom.Rectangle
  readonly inventario: InventorySystem
  resolver(): void
  errar(): void
  fechar(): void
}

export function itemAtende(item: ItemDefinition, resposta: RespostaSlot): boolean {
  return typeof resposta === 'number' ? item.kind === 'number' && item.value === resposta : item.id === resposta
}
