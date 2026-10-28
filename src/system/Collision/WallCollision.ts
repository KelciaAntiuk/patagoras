import Phaser from 'phaser'
import type {
  PhysicsActor,
  WorldRect,
} from './Collision.types'

export class WallCollision {
  private readonly group:
    Phaser.Physics.Arcade.StaticGroup

  private readonly wallRects: WorldRect[] = []

  private readonly colliders = new Map<
    PhysicsActor,
    Phaser.Physics.Arcade.Collider
  >()

  constructor(
    private readonly scene: Phaser.Scene,
  ) {
    this.group =
      scene.physics.add.staticGroup()
  }

  addWall(rect: WorldRect): this {
    this.wallRects.push(rect)

    const zone = this.scene.add.zone(
      rect.x + rect.width / 2,
      rect.y + rect.height / 2,
      rect.width,
      rect.height,
    )

    this.group.add(zone)

    const body =
      zone.body as Phaser.Physics.Arcade.StaticBody

    body.setSize(
      rect.width,
      rect.height,
    )

    body.updateFromGameObject()

    return this
  }

  addWalls(
    rects: readonly WorldRect[],
  ): this {
    rects.forEach((rect) => {
      this.addWall(rect)
    })

    return this
  }

  bindActor(
    actor: PhysicsActor,
  ): Phaser.Physics.Arcade.Collider {
    const existing =
      this.colliders.get(actor)

    if (existing) {
      return existing
    }

    const collider =
      this.scene.physics.add.collider(
        actor,
        this.group,
        undefined,
        this.processWallCollision,
        this,
      )

    this.colliders.set(
      actor,
      collider,
    )

    return collider
  }

  unbindActor(
    actor: PhysicsActor,
  ): void {
    const collider =
      this.colliders.get(actor)

    if (!collider) {
      return
    }

    collider.destroy()

    this.colliders.delete(actor)
  }

  getGroup():
    Phaser.Physics.Arcade.StaticGroup {
    return this.group
  }

  destroy(): void {
    this.colliders.forEach(
      (collider) => {
        collider.destroy()
      },
    )

    this.colliders.clear()
    this.wallRects.length = 0

    if (this.group.children) {
      this.group.clear(
        true,
        true,
      )

      this.group.destroy(true)
    }
  }

  private hasWallAt(
    x: number,
    y: number,
  ): boolean {
    for (const r of this.wallRects) {
      if (
        x >= r.x &&
        x <= r.x + r.width &&
        y >= r.y &&
        y <= r.y + r.height
      ) {
        return true
      }
    }

    return false
  }

  private processWallCollision(
    actorObj: Parameters<Phaser.Types.Physics.Arcade.ArcadePhysicsCallback>[0],
    wallObj: Parameters<Phaser.Types.Physics.Arcade.ArcadePhysicsCallback>[1],
  ): boolean {
    const actorBody = (
      actorObj as Phaser.Types.Physics.Arcade.GameObjectWithBody
    ).body as Phaser.Physics.Arcade.Body | undefined
    const wallBody = (
      wallObj as Phaser.Types.Physics.Arcade.GameObjectWithBody
    ).body as Phaser.Physics.Arcade.StaticBody | undefined

    if (!actorBody || !wallBody) {
      return true
    }

    const penX =
      actorBody.center.x < wallBody.center.x
        ? actorBody.right - wallBody.x
        : wallBody.right - actorBody.x

    const penY =
      actorBody.center.y < wallBody.center.y
        ? actorBody.bottom - wallBody.y
        : wallBody.bottom - actorBody.y

    const sampleX = Phaser.Math.Clamp(
      actorBody.center.x,
      wallBody.x + 1,
      wallBody.right - 1,
    )
    const sampleY = Phaser.Math.Clamp(
      actorBody.center.y,
      wallBody.y + 1,
      wallBody.bottom - 1,
    )

    const yFaceIsInternalSeam =
      actorBody.center.y < wallBody.center.y
        ? this.hasWallAt(sampleX, wallBody.y - 2)
        : this.hasWallAt(sampleX, wallBody.bottom + 2)

    const xFaceIsInternalSeam =
      actorBody.center.x < wallBody.center.x
        ? this.hasWallAt(wallBody.x - 2, sampleY)
        : this.hasWallAt(wallBody.right + 2, sampleY)

    let resolveXFirst: boolean
    if (yFaceIsInternalSeam && !xFaceIsInternalSeam) {
      resolveXFirst = true
    } else if (xFaceIsInternalSeam && !yFaceIsInternalSeam) {
      resolveXFirst = false
    } else {
      resolveXFirst = penX < penY
    }

    this.scene.physics.world.forceX = resolveXFirst

    const cornerThreshold = 3.5
    if (
      Math.abs(actorBody.velocity.y) > 5 &&
      Math.abs(actorBody.velocity.x) < 5 &&
      penX > 0 &&
      penX <= cornerThreshold
    ) {
      const targetY =
        actorBody.velocity.y > 0
          ? wallBody.y + 2
          : wallBody.bottom - 2
      if (actorBody.center.x < wallBody.center.x) {
        const freeLeft = !this.hasWallAt(wallBody.x - 2, targetY)
        if (freeLeft) {
          actorBody.position.x -= Math.min(penX + 0.5, 2)
          actorBody.updateCenter()
        }
      } else {
        const freeRight = !this.hasWallAt(wallBody.right + 2, targetY)
        if (freeRight) {
          actorBody.position.x += Math.min(penX + 0.5, 2)
          actorBody.updateCenter()
        }
      }
    } else if (
      Math.abs(actorBody.velocity.x) > 5 &&
      Math.abs(actorBody.velocity.y) < 5 &&
      penY > 0 &&
      penY <= cornerThreshold
    ) {
      const targetX =
        actorBody.velocity.x > 0
          ? wallBody.x + 2
          : wallBody.right - 2
      if (actorBody.center.y < wallBody.center.y) {
        const freeTop = !this.hasWallAt(targetX, wallBody.y - 2)
        if (freeTop) {
          actorBody.position.y -= Math.min(penY + 0.5, 2)
          actorBody.updateCenter()
        }
      } else {
        const freeBottom = !this.hasWallAt(targetX, wallBody.bottom + 2)
        if (freeBottom) {
          actorBody.position.y += Math.min(penY + 0.5, 2)
          actorBody.updateCenter()
        }
      }
    }

    return true
  }
}