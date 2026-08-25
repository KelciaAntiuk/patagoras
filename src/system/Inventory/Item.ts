import type { GenericItemDefinition, ItemDefinition } from './Inventory.types'
import { ItemKind } from './Inventory.types'

export function createItem(def: Omit<GenericItemDefinition, 'kind'>): GenericItemDefinition {
  return Object.freeze({ ...def, kind: ItemKind.Generic })
}

export const TEST_ITEM: ItemDefinition = createItem({
  id: 'test-item',
  name: 'Cristal de Teste',
  description: 'Um cristal brilhante. Não faz nada — é só para testar o inventário.',
  textureKey: 'test-item-icon',
})
