import Phaser from 'phaser'

import type {
    CollisionSystem,
} from '../../Collision/CollisionSystem'

import {
    ItemKind,
} from '../Inventory.types'

import type {
    FoodItemDefinition,
} from '../Inventory.types'

import type {
    InventorySystem,
} from '../InventorySystem'

import type {
    Patagoras,
} from '../../../characters/Patagoras/Patagoras'

import type {
    PatagorasAI,
} from '../../../characters/Patagoras/PatagorasAI'

import {
    FOOD_THROW_CONFIG,
} from './Food.config'

import {
    FOOD_EVENTS,
} from './Food.events'

export class FoodThrowSystem
    extends Phaser.Events.EventEmitter {

    private activeProjectile?:
        Phaser.Physics.Arcade.Sprite

    private wallCollider?:
        Phaser.Physics.Arcade.Collider

    private patagorasOverlap?:
        Phaser.Physics.Arcade.Collider

    private landingTimer?:
        Phaser.Time.TimerEvent

    constructor(
        private readonly scene:
            Phaser.Scene,

        private readonly player:
            Phaser.Physics.Arcade.Sprite,

        private readonly patagoras:
            Patagoras,

        private readonly patagorasAI:
            PatagorasAI,

        private readonly inventory:
            InventorySystem,

        private readonly collision:
            CollisionSystem,
    ) {
        super()
    }

    public tryUseFood(): boolean {

        if (this.activeProjectile) {
            this.emit(
                FOOD_EVENTS.BUSY,
            )

            return false
        }

        const foodIndex =
            this.inventory
                .getSlots()
                .findIndex(
                    slot =>
                        slot?.kind ===
                        ItemKind.Food,
                )

        if (foodIndex === -1) {
            this.emit(
                FOOD_EVENTS.NO_FOOD,
            )

            return false
        }

        const removedItem =
            this.inventory.removeAll(
                foodIndex,
            )

        if (
            !removedItem ||
            removedItem.kind !==
            ItemKind.Food
        ) {
            return false
        }

        this.throwFood(
            removedItem,
        )

        return true
    }

    public getPlayerSpeedMultiplier():
        number {

        if (this.activeProjectile) {
            return FOOD_THROW_CONFIG
                .playerSlowMultiplier
        }

        return 1
    }

    public isThrowing(): boolean {
        return Boolean(
            this.activeProjectile,
        )
    }

    public destroy(): void {
        this.clearFlight()
        this.removeAllListeners()
    }

    private throwFood(
        food: FoodItemDefinition,
    ): void {

        const startX =
            this.player.body?.center.x ??
            this.player.x

        const startY =
            this.player.body?.center.y ??
            this.player.y

        const direction =
            new Phaser.Math.Vector2(
                this.patagoras.sprite.x -
                startX,

                this.patagoras.sprite.y -
                startY,
            )

        const distanceToPatagoras =
            direction.length()

        const patagorasWasInRange =
            distanceToPatagoras <=
            FOOD_THROW_CONFIG.maxRange

        // Caso estejam exatamente na mesma
        // posição, consideramos que acertou.
        if (distanceToPatagoras <= 1) {
            this.landOnPatagoras(
                food,
            )

            return
        }

        direction.normalize()

        const throwDistance =
            Math.min(
                distanceToPatagoras,
                FOOD_THROW_CONFIG.maxRange,
            )

        const worldBounds =
            this.scene.physics.world.bounds

        const targetX =
            Phaser.Math.Clamp(
                startX +
                direction.x *
                throwDistance,

                worldBounds.left + 8,
                worldBounds.right - 8,
            )

        const targetY =
            Phaser.Math.Clamp(
                startY +
                direction.y *
                throwDistance,

                worldBounds.top + 8,
                worldBounds.bottom - 8,
            )

        const actualDistance =
            Phaser.Math.Distance.Between(
                startX,
                startY,
                targetX,
                targetY,
            )

        const projectile =
            this.scene.physics.add.sprite(
                startX,
                startY,
                food.textureKey,
            )

        this.activeProjectile =
            projectile

        projectile
            .setDepth(20)
            .setDisplaySize(
                18,
                18,
            )

        const body =
            projectile.body as
            Phaser.Physics.Arcade.Body

        body.setSize(
            14,
            14,
            true,
        )

        this.wallCollider =
            this.scene.physics.add.collider(
                projectile,
                this.collision.walls
                    .getGroup(),
                () => {
                    this.landOnGround(
                        food,
                        projectile.x,
                        projectile.y,
                    )
                },
            )

        // Só pode acertar o pato se ele estava
        // dentro do alcance no momento do uso.
        if (patagorasWasInRange) {
            this.patagorasOverlap =
                this.scene.physics.add.overlap(
                    projectile,
                    this.patagoras.sprite,
                    () => {
                        this.landOnPatagoras(
                            food,
                        )
                    },
                )
        }

        this.scene.physics.moveTo(
            projectile,
            targetX,
            targetY,
            FOOD_THROW_CONFIG
                .projectileSpeed,
        )

        const travelMs =
            Math.max(
                1,
                (
                    actualDistance /
                    FOOD_THROW_CONFIG
                        .projectileSpeed
                ) * 1000,
            )

        this.landingTimer =
            this.scene.time.delayedCall(
                travelMs,
                () => {
                    this.landOnGround(
                        food,
                        targetX,
                        targetY,
                    )
                },
            )

        this.emit(
            FOOD_EVENTS.THROW_STARTED,
            food,
        )
    }

    private landOnPatagoras(
        food: FoodItemDefinition,
    ): void {

        const x =
            this.patagoras.sprite.x

        const y =
            this.patagoras.sprite.y

        this.clearFlight()

        const pickup =
            this.collision.spawnPickup(
                x,
                y,
                food,
            )

        // Fica visualmente abaixo do pato.
        pickup.setDepth(4)

        this.patagorasAI.stun(
            FOOD_THROW_CONFIG
                .patagorasSleepMs,
        )

        this.emit(
            FOOD_EVENTS.HIT_PATAGORAS,
            pickup,
        )
    }

    private landOnGround(
        food: FoodItemDefinition,
        x: number,
        y: number,
    ): void {

        if (!this.activeProjectile) {
            return
        }

        this.clearFlight()

        const pickup =
            this.collision.spawnPickup(
                x,
                y,
                food,
            )

        pickup.setDepth(4)

        this.emit(
            FOOD_EVENTS.LANDED,
            pickup,
        )
    }

    private clearFlight(): void {

        this.landingTimer
            ?.remove(false)

        this.wallCollider
            ?.destroy()

        this.patagorasOverlap
            ?.destroy()

        this.activeProjectile
            ?.destroy()

        this.landingTimer =
            undefined

        this.wallCollider =
            undefined

        this.patagorasOverlap =
            undefined

        this.activeProjectile =
            undefined
    }
}
