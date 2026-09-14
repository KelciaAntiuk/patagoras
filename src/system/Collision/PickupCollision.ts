import Phaser from 'phaser'

import type {
  ItemDefinition,
} from '../Inventory/Inventory.types'

import type {
  InventorySystem,
} from '../Inventory/InventorySystem'

import {
  COLLISION_EVENTS,
  PickupMode,
} from './Collision.types'

import type {
  CollisionConfig,
  PhysicsActor,
} from './Collision.types'

import {
  Pickup,
} from './Pickup'

const DEFAULT_PICKUP_RADIUS = 28

export class PickupCollision
  extends Phaser.Events.EventEmitter {

  private readonly group:
    Phaser.Physics.Arcade.StaticGroup

  private readonly mode:
    PickupMode

  private readonly radius:
    number

  private actor?: PhysicsActor

  private current:
    Pickup | null = null

  constructor(
    private readonly scene:
      Phaser.Scene,

    private readonly inventory:
      InventorySystem,

    config:
      CollisionConfig = {},
  ) {
    super()

    this.mode =
      config.pickupMode ??
      PickupMode.Interact

    this.radius =
      config.pickupRadius ??
      DEFAULT_PICKUP_RADIUS

    this.group =
      scene.physics.add.staticGroup()
  }

  spawn(
    x: number,
    y: number,
    item: ItemDefinition,
  ): Pickup {
    const pickup = new Pickup(
      this.scene,
      x,
      y,
      item,
    )

    this.group.add(pickup)

    return pickup
  }

  bindActor(
    actor: PhysicsActor,
  ): void {
    this.actor = actor
  }

  tryCollect(): boolean {
    if (!this.current) {
      return false
    }

    return this.collect(
      this.current,
    )
  }

  getFocused():
    Pickup | null {
    return this.current
  }

  getRadius():
    number {
    return this.radius
  }

  update(): void {
    const next =
      this.findNearestInRange()

    const changed =
      next !== this.current

    if (changed) {
      if (
        this.current?.active
      ) {
        this.current
          .setHighlighted(false)

        this.emit(
          COLLISION_EVENTS
            .PICKUP_RANGE_LEFT,
          this.current,
        )
      }

      this.current = next

      if (next) {
        next.setHighlighted(
          true,
        )

        this.emit(
          COLLISION_EVENTS
            .PICKUP_RANGE_ENTERED,
          next,
        )
      }
    }

    // No modo automático, tenta coletar
    // somente quando entra ou troca de alvo.
    // Isso evita PICKUP_BLOCKED
    // sendo disparado a cada frame.
    if (
      changed &&
      this.mode ===
      PickupMode.Auto &&
      this.current
    ) {
      this.collect(
        this.current,
      )
    }
  }

  destroy(): void {
    this.group.clear(
      true,
      true,
    )

    this.group.destroy(true)

    this.current = null
    this.actor = undefined

    super.destroy()
  }

  private findNearestInRange():
    Pickup | null {

    if (!this.actor?.body) {
      return null
    }

    let nearest:
      Pickup | null = null

    let nearestDistance =
      Number.POSITIVE_INFINITY

    for (
      const child
      of this.group.getChildren()
    ) {
      if (
        !(child instanceof Pickup) ||
        !child.active
      ) {
        continue
      }

      const distance =
        Phaser.Math.Distance
          .Between(
            this.actor.body
              .center.x,

            this.actor.body
              .center.y,

            child.x,
            child.y,
          )

      if (
        distance <=
        this.radius &&
        distance <
        nearestDistance
      ) {
        nearest = child
        nearestDistance =
          distance
      }
    }

    return nearest
  }

  private collect(
    pickup: Pickup,
  ): boolean {

    if (!pickup.active) {
      return false
    }

    const added =
      this.inventory.add(
        pickup.item,
      )

    if (!added) {
      this.emit(
        COLLISION_EVENTS
          .PICKUP_BLOCKED,
        pickup,
      )

      return false
    }

    if (
      this.current === pickup
    ) {
      this.current = null
    }

    this.emit(
      COLLISION_EVENTS
        .ITEM_COLLECTED,
      pickup,
    )

    pickup.destroy()

    return true
  }
}