import type { NumberItemDefinition } from './Inventory.types'
import { ItemKind } from './Inventory.types'
import { applyItemDefaults } from './Item'

export function createNumberItem(
  def: Partial<Pick<NumberItemDefinition, 'stackable' | 'maxQuantity'>> &
    Omit<NumberItemDefinition, 'kind' | 'stackable' | 'maxQuantity'>,
): NumberItemDefinition {
  return Object.freeze({ ...applyItemDefaults(def), kind: ItemKind.Number })
}

export const NUMBER_ITEM_THREE: NumberItemDefinition = createNumberItem({
  id: 'number-item-3',
  name: 'Número 3',
  description: 'Uma peça de quebra-cabeça com o valor 3.',
  textureKey: 'number-item-icon-3',
  value: 3,
})
