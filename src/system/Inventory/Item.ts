import type { GenericItemDefinition, ItemDefinition } from './Inventory.types'
import { ItemKind } from './Inventory.types'

export function applyItemDefaults<T extends { stackable?: boolean; maxQuantity?: number }>(
  def: T,
): T & { stackable: boolean; maxQuantity: number } {
  const stackable = def.stackable ?? false
  return {
    ...def,
    stackable,
    maxQuantity: def.maxQuantity ?? (stackable ? 99 : 1),
  }
}

export function createItem(
  def: Partial<Pick<GenericItemDefinition, 'stackable' | 'maxQuantity'>> &
    Omit<GenericItemDefinition, 'kind' | 'stackable' | 'maxQuantity'>,
): GenericItemDefinition {
  return Object.freeze({ ...applyItemDefaults(def), kind: ItemKind.Generic })
}

export const TEST_ITEM: ItemDefinition = createItem({
  id: 'test-item',
  name: 'Cristal de Teste',
  description: 'Um cristal brilhante. Não faz nada — é só para testar o inventário.',
  textureKey: 'test-item-icon',
  stackable: true,
  maxQuantity: 10,
})
