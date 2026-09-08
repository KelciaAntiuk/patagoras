import Phaser from 'phaser'
import type { InventorySlot } from '../../system/Inventory/Inventory.types'

export const SLOT_SIZE = 56

const BACKGROUND_COLOR = 0x241a12
const EMPTY_BORDER_COLOR = 0x5a4632
const FILLED_BORDER_COLOR = 0xd8b46a

export class InventorySlotUI extends Phaser.GameObjects.Container {
  private readonly border: Phaser.GameObjects.Rectangle
  private icon?: Phaser.GameObjects.Image

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y)

    const background = scene.add.rectangle(0, 0, SLOT_SIZE, SLOT_SIZE, BACKGROUND_COLOR, 0.92)
    this.border = scene.add.rectangle(0, 0, SLOT_SIZE, SLOT_SIZE)
    this.border.setStrokeStyle(2, EMPTY_BORDER_COLOR)

    this.add([background, this.border])
    scene.add.existing(this)
  }

  setSlot(slot: InventorySlot): void {
    this.icon?.destroy()
    this.icon = undefined

    if (!slot) {
      this.border.setStrokeStyle(2, EMPTY_BORDER_COLOR)
      return
    }

    this.border.setStrokeStyle(2, FILLED_BORDER_COLOR)

    this.icon = this.scene.add.image(0, 0, slot.textureKey).setDisplaySize(34, 34)
    this.add(this.icon)
  }
}
