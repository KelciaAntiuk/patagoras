import type { FoodItemDefinition } from './Inventory.types'
import { ItemKind } from './Inventory.types'

export function createFoodItem(def: Omit<FoodItemDefinition, 'kind'>): FoodItemDefinition {
  return Object.freeze({ ...def, kind: ItemKind.Food })
}
