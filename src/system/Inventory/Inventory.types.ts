export type ItemId = string

export const ItemKind = {
  Generic: 'generic',
  Number: 'number',
  Food: 'food',
} as const

export type ItemKind = (typeof ItemKind)[keyof typeof ItemKind]

interface BaseItemDefinition {
  readonly id: ItemId
  readonly name: string
  readonly description: string
  readonly textureKey: string
}

export interface GenericItemDefinition extends BaseItemDefinition {
  readonly kind: typeof ItemKind.Generic
}

export interface NumberItemDefinition extends BaseItemDefinition {
  readonly kind: typeof ItemKind.Number
  readonly value: number
}

export interface FoodItemDefinition extends BaseItemDefinition {
  readonly kind: typeof ItemKind.Food
}

export type ItemDefinition = GenericItemDefinition | NumberItemDefinition | FoodItemDefinition

export type InventorySlot = ItemDefinition | null

export const INVENTORY_EVENTS = {
  CHANGED: 'inventory-changed',
} as const
