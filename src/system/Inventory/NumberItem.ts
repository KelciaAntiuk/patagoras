import type { NumberItemDefinition } from './Inventory.types'
import { ItemKind } from './Inventory.types'

export function createNumberItem(def: Omit<NumberItemDefinition, 'kind'>): NumberItemDefinition {
  return Object.freeze({ ...def, kind: ItemKind.Number })
}

export const NUMBER_ITEM_THREE: NumberItemDefinition = createNumberItem({
  id: 'number-item-3',
  name: 'Número 3',
  description: 'Uma peça de quebra-cabeça com o valor 3.',
  textureKey: 'number-item-icon-3',
  value: 3,
})
