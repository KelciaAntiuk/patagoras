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

  add(item: ItemDefinition): boolean {
    const emptyIndex = this.slots.findIndex((slot) => slot === null)
    if (emptyIndex === -1) return false

    this.slots[emptyIndex] = { item }
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
