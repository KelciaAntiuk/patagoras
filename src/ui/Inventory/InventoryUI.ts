import Phaser from 'phaser'
import { INVENTORY_EVENTS } from '../../system/Inventory/Inventory.types'
import type { InventorySlot } from '../../system/Inventory/Inventory.types'
import type { InventorySystem } from '../../system/Inventory/InventorySystem'
import { InventorySlotUI, SLOT_SIZE } from './InventorySlotUI'

const SPACING = 10
const PADDING = 14

export class InventoryUI extends Phaser.GameObjects.Container {
  private readonly slotViews: InventorySlotUI[] = []

  constructor(scene: Phaser.Scene, inventory: InventorySystem, x: number, y: number) {
    super(scene, x, y)

    const capacity = inventory.getCapacity()
    const slotsWidth = capacity * SLOT_SIZE + (capacity - 1) * SPACING
    const panelWidth = slotsWidth + PADDING * 2
    const panelHeight = SLOT_SIZE + PADDING * 2

    const panel = scene.add.rectangle(0, 0, panelWidth, panelHeight, 0x1a1208, 0.6)
    panel.setStrokeStyle(1, 0x4d3a24)
    this.add(panel)

    for (let i = 0; i < capacity; i++) {
      const slotX = -slotsWidth / 2 + SLOT_SIZE / 2 + i * (SLOT_SIZE + SPACING)
      const slotView = new InventorySlotUI(scene, slotX, 0)
      this.slotViews.push(slotView)
      this.add(slotView)
    }

    this.setScrollFactor(0)
    this.setDepth(100)
    scene.add.existing(this)

    this.sync(inventory.getSlots())
    inventory.on(INVENTORY_EVENTS.CHANGED, (slots: readonly InventorySlot[]) => this.sync(slots))
  }

  private sync(slots: readonly InventorySlot[]): void {
    slots.forEach((slot, i) => this.slotViews[i]?.setSlot(slot))
  }
}
