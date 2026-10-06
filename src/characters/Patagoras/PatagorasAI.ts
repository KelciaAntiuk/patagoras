import Phaser from 'phaser'

import {
    PATAGORAS_CONFIG,
} from './Patagoras.config'

import {
    PatagorasState,
} from './Patagoras.types'

import {
    Patagoras,
} from './Patagoras'

export class PatagorasAI {

    private patrolIndex = 0

    private readonly patrolPoints:
        Phaser.Math.Vector2[]

    constructor(
        private readonly patagoras:
            Patagoras,

        private readonly player:
            Phaser.Physics.Arcade.Sprite,
    ) {

        const startX =
            this.patagoras.sprite.x

        const startY =
            this.patagoras.sprite.y

        this.patrolPoints = [
            new Phaser.Math.Vector2(
                startX,
                startY,
            ),

            new Phaser.Math.Vector2(
                startX + 120,
                startY,
            ),

            new Phaser.Math.Vector2(
                startX + 120,
                startY + 120,
            ),

            new Phaser.Math.Vector2(
                startX,
                startY + 120,
            ),
        ]

        this.patagoras.setState(
            PatagorasState.Patrol,
        )
    }

    public update(): void {

        switch (
        this.patagoras.getState()
        ) {

            case PatagorasState.Patrol:
                this.updatePatrol()
                break

            case PatagorasState.Chase:
                this.updateChase()
                break

            case PatagorasState.Stunned:
                this.patagoras.stop()
                break

            case PatagorasState.Food:
                this.patagoras.stop()
                break

            case PatagorasState.Idle:
            default:
                this.patagoras.stop()
                break
        }
    }

    private updatePatrol(): void {

        const distanceToPlayer =
            this.getDistanceToPlayer()

        if (
            distanceToPlayer <=
            PATAGORAS_CONFIG
                .detectionRadius
        ) {
            this.patagoras.setState(
                PatagorasState.Chase,
            )

            return
        }

        const target =
            this.patrolPoints[
            this.patrolIndex
            ]

        const distanceToTarget =
            Phaser.Math.Distance.Between(
                this.patagoras.sprite.x,
                this.patagoras.sprite.y,
                target.x,
                target.y,
            )

        if (
            distanceToTarget < 10
        ) {

            this.patrolIndex =
                (
                    this.patrolIndex + 1
                ) %
                this.patrolPoints.length

            return
        }

        this.patagoras.moveTowards(
            target.x,
            target.y,
        )
    }

    private updateChase(): void {

        const distanceToPlayer =
            this.getDistanceToPlayer()

        if (
            distanceToPlayer >=
            PATAGORAS_CONFIG
                .loseTargetRadius
        ) {
            this.patagoras.setState(
                PatagorasState.Patrol,
            )

            return
        }

        this.patagoras.moveTowards(
            this.player.x,
            this.player.y,
            PATAGORAS_CONFIG
                .chaseSpeed,
        )
    }

    private getDistanceToPlayer():
        number {

        return Phaser.Math.Distance.Between(
            this.patagoras.sprite.x,
            this.patagoras.sprite.y,
            this.player.x,
            this.player.y,
        )
    }
}