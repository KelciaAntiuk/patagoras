import Phaser from 'phaser'
import type { ItemDefinition } from '../Inventory/Inventory.types'
import type { InventorySystem } from '../Inventory/InventorySystem'
import { COLLISION_EVENTS, PickupMode } from './Collision.types'
import type { CollisionConfig, PhysicsActor } from './Collision.types'
import { Pickup } from './Pickup'

const DEFAULT_PICKUP_RADIUS = 28

export class PickupCollision extends Phaser.Events.EventEmitter {
  private readonly group: Phaser.Physics.Arcade.StaticGroup
  private readonly mode: PickupMode
  private readonly radius: number

  private actor?: PhysicsActor
  private overlap?: Phaser.Physics.Arcade.Collider

  private current: Pickup | null = null
  private pending: Pickup | null = null
  private pendingDistance = Number.POSITIVE_INFINITY

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly inventory: InventorySystem,
    config: CollisionConfig = {},
  ) {
    super()
    this.mode = config.pickupMode ?? PickupMode.Interact
    this.radius = config.pickupRadius ?? DEFAULT_PICKUP_RADIUS
    this.group = scene.physics.add.staticGroup()
  }

  spawn(x: number, y: number, item: ItemDefinition): Pickup {
    const pickup = new Pickup(this.scene, x, y, item)
    this.group.add(pickup)
    return pickup
  }

  bindActor(actor: PhysicsActor): void {
    this.actor = actor
    this.overlap?.destroy()
    this.overlap = this.scene.physics.add.overlap(
      actor,
      this.group,
      (_actor, object) => this.onOverlap(object as Pickup),
    )
  }

  tryCollect(): boolean {
    if (!this.current) return false
    return this.collect(this.current)
  }

  getFocused(): Pickup | null {
    return this.current
  }

  update(): void {
    const next = this.pending && this.pending.active ? this.pending : null

    if (next !== this.current) {
      if (this.current?.active) {
        this.current.setHighlighted(false)
        this.emit(COLLISION_EVENTS.PICKUP_RANGE_LEFT, this.current)
      }
      this.current = next
      if (next) {
        next.setHighlighted(true)
        this.emit(COLLISION_EVENTS.PICKUP_RANGE_ENTERED, next)
      }
    }

    this.pending = null
    this.pendingDistance = Number.POSITIVE_INFINITY

    if (this.mode === PickupMode.Auto && this.current) {
      this.collect(this.current)
    }
  }

  destroy(): void {
    this.overlap?.destroy()
    this.group.clear(true, true)
    this.group.destroy(true)
    this.current = null
    this.pending = null
    super.destroy()
  }

  private onOverlap(pickup: Pickup): void {
    if (!this.actor || !pickup.active) return

    const distance = Phaser.Math.Distance.Between(
      this.actor.body.center.x,
      this.actor.body.center.y,
      pickup.x,
      pickup.y,
    )
    if (distance > this.radius) return

    if (distance < this.pendingDistance) {
      this.pending = pickup
      this.pendingDistance = distance
    }
  }

  private collect(pickup: Pickup): boolean {
    if (!pickup.active) return false

    if (!this.inventory.add(pickup.item)) {
      this.emit(COLLISION_EVENTS.PICKUP_BLOCKED, pickup)
      return false
    }

    if (this.current === pickup) this.current = null
    if (this.pending === pickup) this.pending = null

    this.emit(COLLISION_EVENTS.ITEM_COLLECTED, pickup)
    pickup.destroy()
    return true
  }
}
