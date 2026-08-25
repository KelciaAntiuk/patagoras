import Phaser from 'phaser'
import type { InventorySlot, ItemDefinition, ItemStack } from './Inventory.types'
import { INVENTORY_EVENTS } from './Inventory.types'

export class InventorySystem extends Phaser.Events.EventEmitter {
  private readonly slots: InventorySlot[]

  constructor(private readonly capacity = 3) {
    super()
    this.slots = new Array(capacity).fill(null)
  }

  getCapacity(): number {
    return this.capacity
  }

  getSlots(): readonly InventorySlot[] {
    return this.slots.map((slot) => (slot ? { ...slot } : null))
  }

  isFull(): boolean {
    return this.slots.every((slot) => slot !== null)
  }

  has(itemId: string): boolean {
    return this.slots.some((slot) => slot?.item.id === itemId)
  }

  add(item: ItemDefinition, quantity = 1): boolean {
    let remaining = quantity

    if (item.stackable) {
      for (const slot of this.slots) {
        if (remaining <= 0) break
        if (slot && slot.item.id === item.id) {
          const space = item.maxQuantity - slot.quantity
          const amountToAdd = Math.min(space, remaining)
          slot.quantity += amountToAdd
          remaining -= amountToAdd
        }
      }
    }

    while (remaining > 0) {
      const emptyIndex = this.slots.findIndex((slot) => slot === null)
      if (emptyIndex === -1) break

      const amountToAdd = item.stackable ? Math.min(remaining, item.maxQuantity) : 1
      this.slots[emptyIndex] = { item, quantity: amountToAdd }
      remaining -= amountToAdd
    }

    this.emitChange()
    return remaining <= 0
  }

  remove(index: number, quantity = 1): boolean {
    const slot = this.slots[index]
    if (!slot) return false

    slot.quantity -= quantity
    if (slot.quantity <= 0) {
      this.slots[index] = null
    }

    this.emitChange()
    return true
  }

  removeAll(index: number): ItemStack | null {
    const slot = this.slots[index]
    if (!slot) return null

    this.slots[index] = null
    this.emitChange()
    return slot
  }

  private emitChange(): void {
    this.emit(INVENTORY_EVENTS.CHANGED, this.getSlots())
  }
}
