import type { FoodItemDefinition } from './Inventory.types'
import { ItemKind } from './Inventory.types'
import { applyItemDefaults } from './Item'

export function createFoodItem(
  def: Partial<Pick<FoodItemDefinition, 'stackable' | 'maxQuantity'>> &
    Omit<FoodItemDefinition, 'kind' | 'stackable' | 'maxQuantity'>,
): FoodItemDefinition {
  return Object.freeze({ ...applyItemDefaults(def), kind: ItemKind.Food })
}
