import Phaser from 'phaser'

import {
    Patagoras,
} from './Patagoras'

import {
    PATAGORAS_CONFIG,
} from './Patagoras.config'

import {
    PATAGORAS_EVENTS,
} from './Patagoras.events'

import {
    PatagorasState,
} from './Patagoras.types'

export class PatagorasHit
    extends Phaser.Events.EventEmitter {

    private canHit = true

    private readonly collider:
        Phaser.Physics.Arcade.Collider

    constructor(
        private readonly scene:
            Phaser.Scene,

        private readonly patagoras:
            Patagoras,

        private readonly player:
            Phaser.Physics.Arcade.Sprite,
    ) {
        super()

        this.collider =
            this.scene.physics.add.overlap(
                this.patagoras.sprite,
                this.player,
                () => {
                    this.handleHit()
                },
            )
    }

    private handleHit(): void {

        if (!this.canHit) {
            return
        }

        if (
            this.patagoras.getState() ===
            PatagorasState.Stunned
        ) {
            return
        }

        this.canHit = false

        this.emit(
            PATAGORAS_EVENTS
                .HIT_PLAYER,
        )

        this.scene.time.delayedCall(
            PATAGORAS_CONFIG
                .hitCooldownMs,

            () => {
                this.canHit = true
            },
        )
    }

    public destroy(): void {

        this.collider.destroy()

        this.removeAllListeners()
    }
}