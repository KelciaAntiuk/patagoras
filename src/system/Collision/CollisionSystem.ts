import Phaser from 'phaser'

import type {
  ItemDefinition,
} from '../Inventory/Inventory.types'

import type {
  InventorySystem,
} from '../Inventory/InventorySystem'

import {
  COLLISION_EVENTS,
} from './Collision.types'

import type {
  CollisionConfig,
  CollisionEvent,
  PhysicsActor,
  WorldRect,
} from './Collision.types'

import {
  PickupCollision,
} from './PickupCollision'

import type {
  Pickup,
} from './Pickup'

import {
  WallCollision,
} from './WallCollision'

export class CollisionSystem
  extends Phaser.Events.EventEmitter {

  readonly walls:
    WallCollision

  readonly pickups:
    PickupCollision

  private debugVisible = false

  private readonly pickupEventHandlers =
    new Map<
      CollisionEvent,
      (pickup: Pickup) => void
    >()

  constructor(
    private readonly scene:
      Phaser.Scene,

    inventory:
      InventorySystem,

    config:
      CollisionConfig = {},
  ) {
    super()

    this.walls =
      new WallCollision(
        scene,
      )

    this.pickups =
      new PickupCollision(
        scene,
        inventory,
        config,
      )

    const events =
      Object.values(
        COLLISION_EVENTS,
      ) as CollisionEvent[]

    for (
      const event of events
    ) {
      const handler =
        (
          pickup: Pickup,
        ): void => {
          this.emit(
            event,
            pickup,
          )
        }

      this.pickupEventHandlers
        .set(
          event,
          handler,
        )

      this.pickups.on(
        event,
        handler,
      )
    }
  }

  buildWalls(
    rects:
      readonly WorldRect[],
  ): this {
    this.walls.addWalls(
      rects,
    )

    return this
  }

  spawnPickup(
    x: number,
    y: number,
    item: ItemDefinition,
  ): Pickup {
    return this.pickups.spawn(
      x,
      y,
      item,
    )
  }

  bindActor(
    actor: PhysicsActor,
  ): this {
    this.walls.bindActor(
      actor,
    )

    this.pickups.bindActor(
      actor,
    )

    return this
  }

  update(): void {
    this.pickups.update()
  }

  tryCollect(): boolean {
    return this.pickups
      .tryCollect()
  }

  setDebugVisible(
    visible: boolean,
  ): void {
    const world =
      this.scene.physics.world

    if (
      visible &&
      !world.debugGraphic
    ) {
      world
        .createDebugGraphic()
    }

    world.drawDebug =
      visible

    if (
      world.debugGraphic
    ) {
      world.debugGraphic
        .setVisible(
          visible,
        )
    }

    this.debugVisible =
      visible
  }

  toggleDebug(): boolean {
    this.setDebugVisible(
      !this.debugVisible,
    )

    return this.debugVisible
  }

  destroy(): void {
    this.pickupEventHandlers
      .forEach(
        (
          handler,
          event,
        ) => {
          this.pickups.off(
            event,
            handler,
          )
        },
      )

    this.pickupEventHandlers
      .clear()

    this.walls.destroy()
    this.pickups.destroy()

    super.destroy()
  }
}