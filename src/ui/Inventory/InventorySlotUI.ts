import Phaser from 'phaser'
import type { InventorySlot, ItemDefinition } from '../../system/Inventory/Inventory.types'

export const SLOT_SIZE = 56

const BACKGROUND_COLOR = 0x241a12
const EMPTY_BORDER_COLOR = 0x5a4632
const FILLED_BORDER_COLOR = 0xd8b46a
const HOVER_BORDER_COLOR = 0xfff1c4

export class InventorySlotUI extends Phaser.GameObjects.Container {
  private readonly border: Phaser.GameObjects.Rectangle
  private icon?: Phaser.GameObjects.Image
  private slot: InventorySlot = null

  /** Com `onSelect`, o slot vira clicável quando tiver um item. */
  constructor(scene: Phaser.Scene, x: number, y: number, onSelect?: (item: ItemDefinition) => void) {
    super(scene, x, y)

    const background = scene.add.rectangle(0, 0, SLOT_SIZE, SLOT_SIZE, BACKGROUND_COLOR, 0.92)
    this.border = scene.add.rectangle(0, 0, SLOT_SIZE, SLOT_SIZE)
    this.border.setStrokeStyle(2, EMPTY_BORDER_COLOR)

    if (onSelect) {
      background.setInteractive({ useHandCursor: true })
      background.on('pointerover', () => this.slot && this.border.setStrokeStyle(2, HOVER_BORDER_COLOR))
      background.on('pointerout', () => this.paintBorder())
      background.on('pointerup', () => this.slot && onSelect(this.slot))
    }

    this.add([background, this.border])
    scene.add.existing(this)
  }

  setSlot(slot: InventorySlot): void {
    this.slot = slot
    this.icon?.destroy()
    this.icon = undefined
    this.paintBorder()

    if (!slot) return

    this.icon = this.scene.add.image(0, 0, slot.textureKey).setDisplaySize(34, 34)
    this.add(this.icon)
  }

  private paintBorder(): void {
    this.border.setStrokeStyle(2, this.slot ? FILLED_BORDER_COLOR : EMPTY_BORDER_COLOR)
  }
}
