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

import {
    PatagorasPathfinder,
} from './PatagorasPathfinder'

export class PatagorasAI {

    private currentPath:
        Phaser.Math.Vector2[] = []

    private waypointIndex = 0

    private nextPathUpdateAt = 0

    private nextPlayerCheckAt = 0

    private stunTimer?:
        Phaser.Time.TimerEvent

    private searchTimer?:
        Phaser.Time.TimerEvent

    private lastKnownPlayerPosition =
        new Phaser.Math.Vector2()

    private wanderTarget?:
        Phaser.Math.Vector2

    constructor(
        private readonly scene:
            Phaser.Scene,

        private readonly patagoras:
            Patagoras,

        private readonly player:
            Phaser.Physics.Arcade.Sprite,

        private readonly pathfinder:
            PatagorasPathfinder,
    ) {
        this.patagoras.setState(
            PatagorasState.Wander,
        )
    }

    public update(): void {

        switch (
        this.patagoras.getState()
        ) {

            case PatagorasState.Patrol:
                this.updateWander()
                break

            case PatagorasState.Chase:
                this.updateChase()
                break

            case PatagorasState.Search:
                this.updateSearch()
                break

            case PatagorasState.Wander:
                this.updateWander()
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

    public stun(
        durationMs: number,
    ): void {

        this.stunTimer
            ?.remove(false)

        this.searchTimer
            ?.remove(false)

        this.searchTimer =
            undefined

        this.wanderTarget =
            undefined

        this.clearPath()

        this.patagoras.setState(
            PatagorasState.Stunned,
        )

        this.patagoras.stop()

        this.stunTimer =
            this.scene.time.delayedCall(
                durationMs,
                () => {

                    this.stunTimer =
                        undefined

                    this.startWander()
                },
            )
    }

    public destroy(): void {

        this.stunTimer
            ?.remove(false)

        this.searchTimer
            ?.remove(false)

        this.stunTimer =
            undefined

        this.searchTimer =
            undefined

        this.wanderTarget =
            undefined

        this.clearPath()
    }

    private updateChase(): void {

        const distanceToPlayer =
            this.getDistanceToPlayer()

        this.lastKnownPlayerPosition
            .set(
                this.player.x,
                this.player.y,
            )

        if (
            distanceToPlayer >=
            PATAGORAS_CONFIG
                .loseTargetRadius
        ) {

            this.startSearch()

            return
        }

        const hasPath =
            this.followPathTo(
                this.player.x,
                this.player.y,
                PATAGORAS_CONFIG
                    .chaseSpeed,
                true,
            )

        /*
         * O jogador está próximo,
         * mas não existe caminho
         * acessível até ele.
         *
         * Em vez de ficar parado,
         * Patágoras continua procurando.
         */
        if (!hasPath) {
            this.startWander()
        }
    }

    private updateSearch(): void {

        /*
         * Enquanto procura, verifica
         * se consegue alcançar novamente
         * o jogador.
         */
        if (
            this.tryStartChase()
        ) {
            return
        }

        const distanceToLastPosition =
            Phaser.Math.Distance.Between(
                this.patagoras.sprite.x,
                this.patagoras.sprite.y,
                this.lastKnownPlayerPosition.x,
                this.lastKnownPlayerPosition.y,
            )

        /*
         * Ainda não chegou onde
         * viu o jogador pela última vez.
         */
        if (
            distanceToLastPosition >
            PATAGORAS_CONFIG
                .searchReachDistance
        ) {

            const hasPath =
                this.followPathTo(
                    this.lastKnownPlayerPosition.x,
                    this.lastKnownPlayerPosition.y,
                    PATAGORAS_CONFIG
                        .chaseSpeed,
                    false,
                )

            /*
             * Nem a última posição
             * conhecida é alcançável.
             *
             * Continua procurando
             * aleatoriamente.
             */
            if (!hasPath) {
                this.startWander()
            }

            return
        }

        /*
         * Chegou à última posição
         * conhecida.
         */
        this.patagoras.stop()

        /*
         * O cronômetro começa somente
         * depois que ele chega ao local.
         */
        if (!this.searchTimer) {

            this.searchTimer =
                this.scene.time.delayedCall(
                    PATAGORAS_CONFIG
                        .searchDurationMs,
                    () => {

                        this.searchTimer =
                            undefined

                        if (
                            this.patagoras
                                .getState() !==
                            PatagorasState.Search
                        ) {
                            return
                        }

                        this.startWander()
                    },
                )
        }
    }

    private updateWander(): void {

        /*
         * Não basta o jogador estar
         * perto.
         *
         * Patágoras só entra em CHASE
         * se realmente existir um
         * caminho até ele.
         */
        if (
            this.tryStartChase()
        ) {
            return
        }

        if (!this.wanderTarget) {

            this.chooseWanderTarget()

            return
        }

        const distanceToTarget =
            Phaser.Math.Distance.Between(
                this.patagoras.sprite.x,
                this.patagoras.sprite.y,
                this.wanderTarget.x,
                this.wanderTarget.y,
            )

        if (
            distanceToTarget <=
            PATAGORAS_CONFIG
                .wanderReachDistance
        ) {

            this.wanderTarget =
                undefined

            this.clearPath()

            return
        }

        const hasPath =
            this.followPathTo(
                this.wanderTarget.x,
                this.wanderTarget.y,
                PATAGORAS_CONFIG.speed,
                false,
            )

        /*
         * O destino escolhido deixou
         * de ser acessível.
         *
         * Abandona o ponto e escolhe
         * outro.
         */
        if (!hasPath) {

            this.wanderTarget =
                undefined

            this.clearPath()
        }
    }

    private tryStartChase():
        boolean {

        const distanceToPlayer =
            this.getDistanceToPlayer()

        if (
            distanceToPlayer >
            PATAGORAS_CONFIG
                .detectionRadius
        ) {
            return false
        }

        const now =
            this.scene.time.now

        /*
         * Evita executar A* a cada frame
         * quando o jogador está perto,
         * mas inacessível.
         */
        if (
            now <
            this.nextPlayerCheckAt
        ) {
            return false
        }

        this.nextPlayerCheckAt =
            now +
            PATAGORAS_CONFIG
                .playerReachabilityCheckMs

        const path =
            this.pathfinder.findPath(
                this.patagoras.sprite.x,
                this.patagoras.sprite.y,
                this.player.x,
                this.player.y,
            )

        /*
         * Jogador detectado,
         * porém sem caminho.
         *
         * Continua no estado atual.
         */
        if (
            path.length === 0
        ) {
            return false
        }

        this.searchTimer
            ?.remove(false)

        this.searchTimer =
            undefined

        this.wanderTarget =
            undefined

        this.lastKnownPlayerPosition
            .set(
                this.player.x,
                this.player.y,
            )

        this.patagoras.setState(
            PatagorasState.Chase,
        )

        /*
         * Aproveita o caminho que
         * acabamos de calcular.
         */
        this.currentPath =
            path

        this.waypointIndex =
            0

        this.nextPathUpdateAt =
            now +
            PATAGORAS_CONFIG
                .pathRecalculateMs

        return true
    }

    private startSearch(): void {

        this.searchTimer
            ?.remove(false)

        this.searchTimer =
            undefined

        this.wanderTarget =
            undefined

        this.patagoras.setState(
            PatagorasState.Search,
        )

        this.clearPath()
    }

    private startWander(): void {

        this.searchTimer
            ?.remove(false)

        this.searchTimer =
            undefined

        this.wanderTarget =
            undefined

        this.clearPath()

        this.patagoras.setState(
            PatagorasState.Wander,
        )
    }

    private chooseWanderTarget(): void {

        const originX =
            this.patagoras.sprite.x

        const originY =
            this.patagoras.sprite.y

        for (
            let attempt = 0;
            attempt < 30;
            attempt++
        ) {

            const angle =
                Phaser.Math.FloatBetween(
                    0,
                    Math.PI * 2,
                )

            const distance =
                Phaser.Math.Between(
                    PATAGORAS_CONFIG
                        .wanderMinDistance,
                    PATAGORAS_CONFIG
                        .wanderRadius,
                )

            const targetX =
                originX +
                Math.cos(angle) *
                distance

            const targetY =
                originY +
                Math.sin(angle) *
                distance

            const path =
                this.pathfinder.findPath(
                    originX,
                    originY,
                    targetX,
                    targetY,
                )

            if (
                path.length === 0
            ) {
                continue
            }

            const reachableTarget =
                path[
                path.length - 1
                ]

            this.wanderTarget =
                new Phaser.Math.Vector2(
                    reachableTarget.x,
                    reachableTarget.y,
                )

            this.currentPath =
                path

            this.waypointIndex =
                0

            this.nextPathUpdateAt =
                this.scene.time.now +
                PATAGORAS_CONFIG
                    .pathRecalculateMs

            return
        }

        /*
         * Não encontrou destino válido.
         *
         * No próximo update ele tenta
         * novamente em vez de ficar
         * travado permanentemente.
         */
        this.wanderTarget =
            undefined

        this.clearPath()

        this.patagoras.stop()
    }

    private followPathTo(
        targetX: number,
        targetY: number,
        speed: number,
        dynamicTarget: boolean,
    ): boolean {

        const now =
            this.scene.time.now

        const needsNewPath =
            this.currentPath.length === 0 ||
            this.waypointIndex >=
            this.currentPath.length ||
            (
                dynamicTarget &&
                now >=
                this.nextPathUpdateAt
            )

        if (needsNewPath) {

            const path =
                this.pathfinder.findPath(
                    this.patagoras.sprite.x,
                    this.patagoras.sprite.y,
                    targetX,
                    targetY,
                )

            this.nextPathUpdateAt =
                now +
                PATAGORAS_CONFIG
                    .pathRecalculateMs

            /*
             * Não existe rota até
             * o destino.
             */
            if (
                path.length === 0
            ) {

                this.currentPath = []

                this.waypointIndex = 0

                this.patagoras.stop()

                return false
            }

            this.currentPath =
                path

            this.waypointIndex = 0
        }

        const waypoint =
            this.currentPath[
            this.waypointIndex
            ]

        if (!waypoint) {

            this.patagoras.stop()

            return false
        }

        const distanceToWaypoint =
            Phaser.Math.Distance.Between(
                this.patagoras.sprite.x,
                this.patagoras.sprite.y,
                waypoint.x,
                waypoint.y,
            )

        if (
            distanceToWaypoint <=
            PATAGORAS_CONFIG
                .waypointReachDistance
        ) {

            this.waypointIndex++

            const nextWaypoint =
                this.currentPath[
                this.waypointIndex
                ]

            if (!nextWaypoint) {

                this.patagoras.stop()

                return true
            }

            this.patagoras.moveTowards(
                nextWaypoint.x,
                nextWaypoint.y,
                speed,
            )

            return true
        }

        this.patagoras.moveTowards(
            waypoint.x,
            waypoint.y,
            speed,
        )

        return true
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

    private clearPath(): void {

        this.currentPath = []

        this.waypointIndex = 0

        this.nextPathUpdateAt = 0
    }
}