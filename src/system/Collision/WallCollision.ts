import Phaser from 'phaser'
import type { PhysicsActor, WorldRect } from './Collision.types'

export class WallCollision {
  private readonly group: Phaser.Physics.Arcade.StaticGroup
  private readonly colliders: Phaser.Physics.Arcade.Collider[] = []

  constructor(private readonly scene: Phaser.Scene) {
    this.group = scene.physics.add.staticGroup()
  }

  addWall(rect: WorldRect): this {
    const zone = this.scene.add.zone(
      rect.x + rect.width / 2,
      rect.y + rect.height / 2,
      rect.width,
      rect.height,
    )
    this.group.add(zone)
    const body = zone.body as Phaser.Physics.Arcade.StaticBody
    body.setSize(rect.width, rect.height)
    body.updateFromGameObject()
    return this
  }

  addWalls(rects: readonly WorldRect[]): this {
    rects.forEach((rect) => this.addWall(rect))
    return this
  }

  bindActor(actor: PhysicsActor): Phaser.Physics.Arcade.Collider {
    const collider = this.scene.physics.add.collider(actor, this.group)
    this.colliders.push(collider)
    return collider
  }

  getGroup(): Phaser.Physics.Arcade.StaticGroup {
    return this.group
  }

  destroy(): void {
    this.colliders.forEach((collider) => collider.destroy())
    this.colliders.length = 0
    this.group.clear(true, true)
    this.group.destroy(true)
  }
}
