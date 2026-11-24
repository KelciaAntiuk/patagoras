import Phaser from 'phaser'

import type {
    WorldRect,
} from '../../system/Collision/Collision.types'

import {
    getActorCenter,
    hasLineOfSight,
} from '../../system/Collision/LineOfSight'

import type {
    ObstacleProvider,
} from '../../system/Collision/LineOfSight'

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

export interface PatagorasAIOptions {
    readonly getVisionObstacles?: ObstacleProvider
    readonly getObstacles?: ObstacleProvider
    readonly isSameRoom?: () => boolean
    readonly patrolBounds?: WorldRect
}

export class PatagorasAI {

    private currentPath:
        Phaser.Math.Vector2[] = []

    private waypointIndex = 0

    private nextPathUpdateAt = 0

    private stunTimer?:
        Phaser.Time.TimerEvent

    private wanderTarget?:
        Phaser.Math.Vector2

    private hasDetectedPlayer = false

    private hasVisualContact = false

    private hasStuckSample = false

    private lastStuckCheckAt = 0

    private readonly lastStuckCheckPosition =
        new Phaser.Math.Vector2()

    private hasLastPathTarget = false

    private readonly lastPathTarget =
        new Phaser.Math.Vector2()

    private hasPrevStepPosition = false

    private readonly prevStepPosition =
        new Phaser.Math.Vector2()

    constructor(
        private readonly scene:
            Phaser.Scene,

        private readonly patagoras:
            Patagoras,

        private readonly player:
            Phaser.Physics.Arcade.Sprite,

        private readonly pathfinder:
            PatagorasPathfinder,

        private readonly options?:
            PatagorasAIOptions,
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
            case PatagorasState.Wander:
                this.updateWander()
                break

            case PatagorasState.Chase:
                this.updateChase()
                break

            case PatagorasState.Search:
                if (this.hasDetectedPlayer) {
                    this.resumeChase()
                } else {
                    this.startWander()
                }
                break

            case PatagorasState.Stunned:
            case PatagorasState.Food:
            case PatagorasState.Idle:
            default:
                this.patagoras.stop()
                break
        }
    }

    public canSeePlayer(): boolean {
        if (
            this.options?.isSameRoom &&
            !this.options.isSameRoom()
        ) {
            return false
        }

        const duckX =
            this.patagoras.getBodyCenterX()
        const duckY =
            this.patagoras.getBodyCenterY()

        const { x: playerX, y: playerY } =
            getActorCenter(this.player)

        const dx = playerX - duckX
        const dy = playerY - duckY
        const distance = Math.hypot(dx, dy)

        if (
            distance >
            PATAGORAS_CONFIG.detectionRadius
        ) {
            return false
        }

        if (distance > 1) {
            const facing =
                this.patagoras.getFacingDirection()

            if (facing.lengthSq() > 0) {
                const cosHalfFov = Math.cos(
                    Phaser.Math.DegToRad(
                        PATAGORAS_CONFIG.visionFovDegrees / 2,
                    ),
                )
                const dot =
                    (dx / distance) * facing.x +
                    (dy / distance) * facing.y

                if (dot < cosHalfFov - 1e-6) {
                    return false
                }
            }
        }

        const obstacles =
            this.options?.getVisionObstacles?.() ??
            this.options?.getObstacles?.() ??
            this.pathfinder.getActiveObstacles()

        return hasLineOfSight(
            duckX,
            duckY,
            playerX,
            playerY,
            obstacles,
        )
    }

    public hasPlayerBeenDetected(): boolean {
        return this.hasDetectedPlayer
    }

    public hasVisualContactWithPlayer(): boolean {
        return this.hasVisualContact
    }

    public getCurrentPath(): readonly Phaser.Math.Vector2[] {
        return this.currentPath
    }

    public stun(
        durationMs: number,
    ): void {

        this.stunTimer
            ?.remove(false)

        this.wanderTarget =
            undefined

        this.hasVisualContact = false

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

                    if (this.hasDetectedPlayer) {
                        this.resumeChase()
                    } else {
                        this.startWander()
                    }
                },
            )
    }

    public reset(): void {
        this.stunTimer
            ?.remove(false)

        this.stunTimer =
            undefined

        this.hasDetectedPlayer = false
        this.hasVisualContact = false
        this.wanderTarget = undefined
        this.clearPath()
        this.patagoras.stop()
        this.patagoras.setState(
            PatagorasState.Wander,
        )
    }

    public destroy(): void {

        this.stunTimer
            ?.remove(false)

        this.stunTimer =
            undefined

        this.wanderTarget =
            undefined

        this.clearPath()
    }

    private updateChase(): void {

        this.hasVisualContact =
            this.canSeePlayer()

        const { x: playerX, y: playerY } =
            getActorCenter(this.player)

        const speed = this.hasVisualContact
            ? this.patagoras.getChaseSpeed()
            : this.patagoras.getLostSightChaseSpeed()

        const hasPath =
            this.followPathTo(
                playerX,
                playerY,
                speed,
                true,
            )

        /*
         * Após a primeira detecção, a perseguição
         * é permanente: se não houver rota no
         * momento (ex.: porta fechada), aguarda o
         * próximo recálculo sem voltar à patrulha.
         */
        if (!hasPath) {
            this.patagoras.stop()
        }
    }

    private updateWander(): void {

        if (this.hasDetectedPlayer) {
            this.resumeChase()
            return
        }

        if (this.canSeePlayer()) {
            this.hasDetectedPlayer = true
            this.hasVisualContact = true
            this.wanderTarget = undefined
            this.clearPath()
            this.patagoras.setState(
                PatagorasState.Chase,
            )
            this.updateChase()
            return
        }

        if (!this.wanderTarget) {
            this.chooseWanderTarget()

            if (!this.wanderTarget) {
                return
            }
        }

        const distanceToTarget =
            Phaser.Math.Distance.Between(
                this.patagoras.getBodyCenterX(),
                this.patagoras.getBodyCenterY(),
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
                this.patagoras.getSpeed(),
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

    private resumeChase(): void {
        this.wanderTarget = undefined
        this.clearPath()
        this.patagoras.setState(
            PatagorasState.Chase,
        )
        this.updateChase()
    }

    private startWander(): void {

        this.wanderTarget =
            undefined

        this.hasVisualContact = false

        this.clearPath()

        this.patagoras.setState(
            PatagorasState.Wander,
        )
    }

    private chooseWanderTarget(): void {

        const originX =
            this.patagoras.getBodyCenterX()

        const originY =
            this.patagoras.getBodyCenterY()

        const patrolBounds =
            this.options?.patrolBounds

        if (patrolBounds) {
            const candidates =
                this.pathfinder.getWalkablePointsInBounds(
                    patrolBounds,
                    2,
                )

            if (candidates.length > 0) {
                const minDist =
                    PATAGORAS_CONFIG.wanderMinDistance
                const farCandidates =
                    candidates.filter(
                        point =>
                            Phaser.Math.Distance.Between(
                                originX,
                                originY,
                                point.x,
                                point.y,
                            ) >= minDist,
                    )

                const pool =
                    farCandidates.length > 0
                        ? farCandidates
                        : candidates

                for (
                    let attempt = 0;
                    attempt < 30;
                    attempt++
                ) {
                    const candidate =
                        pool[
                            Phaser.Math.Between(
                                0,
                                pool.length - 1,
                            )
                        ]

                    const path =
                        this.pathfinder.findPath(
                            originX,
                            originY,
                            candidate.x,
                            candidate.y,
                            { snapTarget: false },
                        )

                    if (path.length === 0) {
                        continue
                    }

                    this.setWanderPath(
                        path,
                        originX,
                        originY,
                    )

                    return
                }
            }
        }

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

            if (
                !this.pathfinder.isWorldPointWalkable(
                    targetX,
                    targetY,
                )
            ) {
                continue
            }

            const path =
                this.pathfinder.findPath(
                    originX,
                    originY,
                    targetX,
                    targetY,
                    { snapTarget: false },
                )

            if (
                path.length === 0
            ) {
                continue
            }

            this.setWanderPath(
                path,
                originX,
                originY,
            )

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

    private setWanderPath(
        path: Phaser.Math.Vector2[],
        originX: number,
        originY: number,
    ): void {
        const reachableTarget = path[path.length - 1]

        this.wanderTarget =
            new Phaser.Math.Vector2(
                reachableTarget.x,
                reachableTarget.y,
            )

        this.currentPath = path
        this.waypointIndex = 0
        this.nextPathUpdateAt =
            this.scene.time.now +
            PATAGORAS_CONFIG.pathRecalculateMs
        this.lastPathTarget.set(
            reachableTarget.x,
            reachableTarget.y,
        )
        this.hasLastPathTarget = true
        this.hasPrevStepPosition = false
        this.resetStuckTracker(originX, originY)
    }

    private followPathTo(
        targetX: number,
        targetY: number,
        speed: number,
        dynamicTarget: boolean,
    ): boolean {

        const now =
            this.scene.time.now

        const currentX =
            this.patagoras.getBodyCenterX()

        const currentY =
            this.patagoras.getBodyCenterY()

        const hasActivePath =
            this.currentPath.length > 0 &&
            this.waypointIndex < this.currentPath.length

        let shouldRecalculate = !hasActivePath

        if (
            !shouldRecalculate &&
            dynamicTarget &&
            now >= this.nextPathUpdateAt
        ) {
            const targetMoved = this.hasLastPathTarget
                ? Phaser.Math.Distance.Between(
                    this.lastPathTarget.x,
                    this.lastPathTarget.y,
                    targetX,
                    targetY,
                )
                : Infinity

            const remainingClear =
                this.isRemainingPathClear(currentX, currentY)

            const directToTarget =
                this.pathfinder.hasClearBodyPath(
                    currentX,
                    currentY,
                    targetX,
                    targetY,
                    true,
                )

            if (
                remainingClear &&
                !directToTarget &&
                targetMoved <
                    PATAGORAS_CONFIG.pathTargetRepathDistance
            ) {
                this.nextPathUpdateAt =
                    now + PATAGORAS_CONFIG.pathRecalculateMs
            } else {
                shouldRecalculate = true
            }
        }

        if (shouldRecalculate) {

            const newPath =
                this.pathfinder.findPath(
                    currentX,
                    currentY,
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
                newPath.length === 0
            ) {

                this.currentPath = []

                this.waypointIndex = 0

                this.hasStuckSample = false
                this.hasLastPathTarget = false
                this.hasPrevStepPosition = false

                this.patagoras.stop()

                return false
            }

            let keepOldPath = false

            if (
                dynamicTarget &&
                hasActivePath &&
                this.isRemainingPathClear(currentX, currentY)
            ) {
                const oldRemaining =
                    this.currentPath.slice(this.waypointIndex)
                const oldEnd =
                    oldRemaining[oldRemaining.length - 1]
                const endShift =
                    Phaser.Math.Distance.Between(
                        oldEnd.x,
                        oldEnd.y,
                        targetX,
                        targetY,
                    )

                if (endShift <= 28) {
                    const oldDir = new Phaser.Math.Vector2(
                        oldRemaining[0].x - currentX,
                        oldRemaining[0].y - currentY,
                    )
                    const newDir = new Phaser.Math.Vector2(
                        newPath[0].x - currentX,
                        newPath[0].y - currentY,
                    )

                    if (
                        oldDir.lengthSq() > 1e-4 &&
                        newDir.lengthSq() > 1e-4
                    ) {
                        oldDir.normalize()
                        newDir.normalize()
                        const dot =
                            oldDir.x * newDir.x +
                            oldDir.y * newDir.y

                        if (dot < -0.35) {
                            const oldLen =
                                this.computePathLength(
                                    currentX,
                                    currentY,
                                    oldRemaining,
                                    targetX,
                                    targetY,
                                )
                            const newLen =
                                this.computePathLength(
                                    currentX,
                                    currentY,
                                    newPath,
                                    targetX,
                                    targetY,
                                )

                            if (
                                oldLen - newLen <
                                PATAGORAS_CONFIG.pathFlipMinSavings
                            ) {
                                keepOldPath = true
                            }
                        }
                    }
                }
            }

            if (!keepOldPath) {
                this.currentPath =
                    newPath

                this.waypointIndex = 0
                this.lastPathTarget.set(targetX, targetY)
                this.hasLastPathTarget = true
                this.resetStuckTracker(currentX, currentY)
            }
        }

        while (this.waypointIndex < this.currentPath.length) {
            const nextWaypoint =
                this.currentPath[this.waypointIndex + 1]

            if (
                nextWaypoint &&
                this.pathfinder.hasClearBodyPath(
                    currentX,
                    currentY,
                    nextWaypoint.x,
                    nextWaypoint.y,
                    true,
                )
            ) {
                this.waypointIndex++
                continue
            }

            const waypoint =
                this.currentPath[this.waypointIndex]

            const distanceToWaypoint =
                Phaser.Math.Distance.Between(
                    currentX,
                    currentY,
                    waypoint.x,
                    waypoint.y,
                )

            if (
                distanceToWaypoint <=
                PATAGORAS_CONFIG
                    .waypointReachDistance
            ) {
                this.waypointIndex++
                continue
            }

            if (
                this.hasPrevStepPosition &&
                this.didCrossWaypoint(
                    this.prevStepPosition.x,
                    this.prevStepPosition.y,
                    currentX,
                    currentY,
                    waypoint.x,
                    waypoint.y,
                )
            ) {
                this.waypointIndex++
                continue
            }

            break
        }

        const activeWaypoint =
            this.currentPath[
            this.waypointIndex
            ]

        if (!activeWaypoint) {
            if (
                dynamicTarget &&
                this.pathfinder.hasClearBodyPath(
                    currentX,
                    currentY,
                    targetX,
                    targetY,
                    false,
                )
            ) {
                this.patagoras.moveTowards(
                    targetX,
                    targetY,
                    speed,
                )
                this.prevStepPosition.set(currentX, currentY)
                this.hasPrevStepPosition = true
            } else {
                this.clearPath()
                this.patagoras.stop()
            }

            return true
        }

        if (!this.hasStuckSample) {
            this.resetStuckTracker(currentX, currentY)
        } else if (
            now - this.lastStuckCheckAt >=
            PATAGORAS_CONFIG.stuckCheckIntervalMs
        ) {
            const moved =
                Phaser.Math.Distance.Between(
                    this.lastStuckCheckPosition.x,
                    this.lastStuckCheckPosition.y,
                    currentX,
                    currentY,
                )

            this.lastStuckCheckAt = now
            this.lastStuckCheckPosition.set(
                currentX,
                currentY,
            )

            if (moved < PATAGORAS_CONFIG.stuckMinDistance) {
                this.clearPath()
            }
        }

        this.patagoras.moveTowards(
            activeWaypoint.x,
            activeWaypoint.y,
            speed,
        )

        this.prevStepPosition.set(currentX, currentY)
        this.hasPrevStepPosition = true

        return true
    }

    private isRemainingPathClear(
        currentX: number,
        currentY: number,
    ): boolean {
        if (this.waypointIndex >= this.currentPath.length) {
            return false
        }

        let prevX = currentX
        let prevY = currentY

        for (
            let i = this.waypointIndex;
            i < this.currentPath.length;
            i++
        ) {
            const wp = this.currentPath[i]
            if (
                !this.pathfinder.hasClearBodyPath(
                    prevX,
                    prevY,
                    wp.x,
                    wp.y,
                    false,
                )
            ) {
                return false
            }
            prevX = wp.x
            prevY = wp.y
        }

        return true
    }

    private computePathLength(
        startX: number,
        startY: number,
        waypoints: readonly Phaser.Math.Vector2[],
        finalTargetX: number,
        finalTargetY: number,
    ): number {
        let total = 0
        let prevX = startX
        let prevY = startY

        for (const wp of waypoints) {
            total += Phaser.Math.Distance.Between(
                prevX,
                prevY,
                wp.x,
                wp.y,
            )
            prevX = wp.x
            prevY = wp.y
        }

        total += Phaser.Math.Distance.Between(
            prevX,
            prevY,
            finalTargetX,
            finalTargetY,
        )

        return total
    }

    private didCrossWaypoint(
        prevX: number,
        prevY: number,
        curX: number,
        curY: number,
        wpX: number,
        wpY: number,
    ): boolean {
        const segDx = curX - prevX
        const segDy = curY - prevY
        const segLenSq = segDx * segDx + segDy * segDy

        if (segLenSq <= 1e-6) {
            return false
        }

        const t = Phaser.Math.Clamp(
            ((wpX - prevX) * segDx + (wpY - prevY) * segDy) /
                segLenSq,
            0,
            1,
        )

        if (t <= 0) {
            return false
        }

        const closestX = prevX + t * segDx
        const closestY = prevY + t * segDy
        const distToSegment =
            Phaser.Math.Distance.Between(
                wpX,
                wpY,
                closestX,
                closestY,
            )

        const threshold = Math.max(
            1.5,
            PATAGORAS_CONFIG.waypointReachDistance,
        )

        if (distToSegment > threshold) {
            return false
        }

        const pastDot =
            (curX - wpX) * segDx + (curY - wpY) * segDy

        return pastDot >= 0
    }

    private resetStuckTracker(
        x: number,
        y: number,
    ): void {
        this.hasStuckSample = true
        this.lastStuckCheckAt = this.scene.time.now
        this.lastStuckCheckPosition.set(x, y)
    }

    private clearPath(): void {

        this.currentPath = []

        this.waypointIndex = 0

        this.nextPathUpdateAt = 0

        this.hasStuckSample = false

        this.hasLastPathTarget = false

        this.hasPrevStepPosition = false
    }
}
