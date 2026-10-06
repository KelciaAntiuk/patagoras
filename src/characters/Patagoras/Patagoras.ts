import Phaser from 'phaser'

import {
    PATAGORAS_CONFIG,
} from './Patagoras.config'

import {
    PatagorasState,
} from './Patagoras.types'

export class Patagoras {

    public readonly sprite:
        Phaser.Physics.Arcade.Sprite

    private state:
        PatagorasState =
        PatagorasState.Idle

    constructor(
        scene: Phaser.Scene,
        x: number,
        y: number,
    ) {
        this.sprite =
            scene.physics.add.sprite(
                x,
                y,
                'patagoras',
            )

        this.sprite
            .setDepth(5)

        this.sprite
            .setCollideWorldBounds(
                true,
            )
    }

    public getState():
        PatagorasState {

        return this.state
    }

    public setState(
        state: PatagorasState,
    ): void {

        this.state =
            state
    }

    public moveTowards(
        x: number,
        y: number,
        speed:
            number =
            PATAGORAS_CONFIG.speed,
    ): void {

        const direction =
            new Phaser.Math.Vector2(
                x - this.sprite.x,
                y - this.sprite.y,
            )

        if (
            direction.length() === 0
        ) {
            this.stop()

            return
        }

        direction.normalize()

        this.sprite
            .setVelocity(
                direction.x * speed,
                direction.y * speed,
            )
    }

    public stop(): void {
        this.sprite
            .setVelocity(
                0,
                0,
            )
    }

    public setVelocity(
        x: number,
        y: number,
    ): void {

        const direction =
            new Phaser.Math.Vector2(
                x,
                y,
            )

        if (
            direction.length() > 0
        ) {
            direction.normalize()
        }

        this.sprite
            .setVelocity(
                direction.x *
                PATAGORAS_CONFIG.speed,

                direction.y *
                PATAGORAS_CONFIG.speed,
            )
    }

    public destroy(): void {
        this.sprite.destroy()
    }
}