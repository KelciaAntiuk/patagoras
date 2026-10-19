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
                'pato-0003',
            )

        this.sprite
            .setDepth(5)

        this.sprite
            .setSize(14, 14)
            .setOffset(3, 4)

        this.sprite
            .setCollideWorldBounds(
                true,
            )

        if (scene.anims.exists('pato-andar-baixo')) {
            this.sprite.anims.play('pato-andar-baixo')
        }
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

    public updateAnimation(): void {
        const vx = this.sprite.body ? this.sprite.body.velocity.x : 0
        const vy = this.sprite.body ? this.sprite.body.velocity.y : 0

        // Diagonal para baixo (S + A ou S + D)
        if (vy > 5 && Math.abs(vx) > 5) {
            // As sprites 0019 e 0020 olham nativamente para a direita
            this.sprite.setFlipX(vx < 0)
            this.sprite.anims.play('pato-andar-diagonal-baixo', true)
        }
        // Se o movimento horizontal for predominante
        else if (Math.abs(vx) > 5 && Math.abs(vx) >= Math.abs(vy)) {
            // As sprites 0013 a 0018 olham nativamente para a direita
            this.sprite.setFlipX(vx < 0)
            this.sprite.anims.play('pato-andar-lado', true)
        }
        // Quando o pato anda reto para baixo (direção S / vy > 0)
        else if (vy > 5) {
            this.sprite.setFlipX(false)
            this.sprite.anims.play('pato-andar-baixo', true)
        }
        // Quando o pato anda para cima (direção W / vy < 0)
        else if (vy < -5) {
            this.sprite.setFlipX(false)
            this.sprite.anims.play('pato-andar-cima', true)
        }
    }

    public destroy(): void {
        this.sprite.destroy()
    }
}