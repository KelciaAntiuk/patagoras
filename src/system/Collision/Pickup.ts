import Phaser from 'phaser'
import type { ItemDefinition } from '../Inventory/Inventory.types'

const HIGHLIGHT_TINT = 0xffe9a8
const HIGHLIGHT_SCALE = 1.15

export class Pickup extends Phaser.Physics.Arcade.Sprite {
  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    readonly item: ItemDefinition,
  ) {
    super(scene, x, y, item.textureKey)

    scene.add.existing(this)
    scene.physics.add.existing(this, true)

    this.setName(`pickup:${item.id}`)
  }

  setHighlighted(on: boolean): void {
    if (on) {
      this.setTint(HIGHLIGHT_TINT)
      this.setScale(HIGHLIGHT_SCALE)
    } else {
      this.clearTint()
      this.setScale(1)
    }
  }
}
