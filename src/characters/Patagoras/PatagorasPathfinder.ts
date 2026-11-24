import Phaser from 'phaser'

import type {
    WorldRect,
} from '../../system/Collision/Collision.types'

import {
    hasLineOfSight,
    segmentIntersectsRect,
} from '../../system/Collision/LineOfSight'

type GridPoint = {
    x: number
    y: number
}

type DynamicObstacleEntry = {
    readonly rect: WorldRect
    readonly cells: number[]
}

export interface FindPathOptions {
    readonly snapTarget?: boolean
}

export interface AvoidPoint {
    readonly x: number
    readonly y: number
    readonly minDistance: number
}

export interface SafePositionOptions {
    readonly bounds?: WorldRect
    readonly avoidPoints?: readonly AvoidPoint[]
    readonly preferredExtraMargin?: number
}

const DIRECTIONS: readonly (readonly [number, number, number])[] = [
    [1, 0, 1],
    [-1, 0, 1],
    [0, 1, 1],
    [0, -1, 1],
    [1, 1, Math.SQRT2],
    [1, -1, Math.SQRT2],
    [-1, 1, Math.SQRT2],
    [-1, -1, Math.SQRT2],
]

const NEAR_WALL_PENALTY = 0.12
const RAY_EPSILON = 1e-4

export class PatagorasPathfinder {

    private readonly staticObstacles: readonly WorldRect[]

    private readonly bodyHalfWidth: number

    private readonly bodyHalfHeight: number

    private readonly inflatedHalfWidth: number

    private readonly inflatedHalfHeight: number

    private readonly columns: number

    private readonly rows: number

    private readonly gridOffsetX: number

    private readonly gridOffsetY: number

    private readonly staticBlocked: Uint8Array

    private readonly dynamicBlockedCount: Uint16Array

    private readonly dynamicObstacles =
        new Map<string, DynamicObstacleEntry>()

    private activeObstaclesCache: readonly WorldRect[] | null = null

    private readonly gScore: Float32Array

    private readonly parent: Int32Array

    private readonly visitState: Uint32Array

    private visitStamp = 0

    private readonly heapIndices: number[] = []

    private readonly heapF: number[] = []

    constructor(
        private readonly worldWidth: number,
        private readonly worldHeight: number,
        private readonly cellSize: number,
        wallRects: readonly WorldRect[],
        obstaclePadding = 0,
        bodyWidth = 0,
        bodyHeight = 0,
    ) {
        this.staticObstacles = [...wallRects]
        this.bodyHalfWidth = bodyWidth / 2
        this.bodyHalfHeight = bodyHeight / 2
        this.inflatedHalfWidth =
            this.bodyHalfWidth + obstaclePadding
        this.inflatedHalfHeight =
            this.bodyHalfHeight + obstaclePadding

        const firstRect = wallRects[0]

        this.gridOffsetX = firstRect
            ? (
                ((firstRect.x + 8 - cellSize / 2) % cellSize) +
                cellSize
            ) % cellSize
            : 0

        this.gridOffsetY = firstRect
            ? (
                ((firstRect.y + 8 - cellSize / 2) % cellSize) +
                cellSize
            ) % cellSize
            : 0

        this.columns = Math.ceil(
            worldWidth / cellSize,
        )

        this.rows = Math.ceil(
            worldHeight / cellSize,
        )

        const totalCells =
            this.columns * this.rows

        this.staticBlocked =
            new Uint8Array(totalCells)

        this.dynamicBlockedCount =
            new Uint16Array(totalCells)

        this.gScore =
            new Float32Array(totalCells)

        this.parent =
            new Int32Array(totalCells)

        this.visitState =
            new Uint32Array(totalCells)

        this.buildBlockedGrid(
            wallRects,
        )
    }

    public setDynamicObstacle(
        id: string,
        rect: WorldRect,
        blocked: boolean,
    ): void {
        const existing =
            this.dynamicObstacles.get(id)

        if (existing) {
            for (const idx of existing.cells) {
                if (this.dynamicBlockedCount[idx] > 0) {
                    this.dynamicBlockedCount[idx]--
                }
            }
            this.dynamicObstacles.delete(id)
            this.activeObstaclesCache = null
        }

        if (!blocked) {
            return
        }

        const cells =
            this.getInflatedCellIndices(rect)

        for (const idx of cells) {
            this.dynamicBlockedCount[idx]++
        }

        this.dynamicObstacles.set(id, {
            rect,
            cells,
        })
        this.activeObstaclesCache = null
    }

    public getActiveObstacles(): readonly WorldRect[] {
        if (this.activeObstaclesCache) {
            return this.activeObstaclesCache
        }

        if (this.dynamicObstacles.size === 0) {
            this.activeObstaclesCache =
                this.staticObstacles
            return this.activeObstaclesCache
        }

        const combined: WorldRect[] = [
            ...this.staticObstacles,
        ]

        for (const entry of this.dynamicObstacles.values()) {
            combined.push(entry.rect)
        }

        this.activeObstaclesCache = combined
        return combined
    }

    public isWorldPointWalkable(
        x: number,
        y: number,
        extraMargin = 0,
    ): boolean {
        const halfW =
            this.inflatedHalfWidth + extraMargin
        const halfH =
            this.inflatedHalfHeight + extraMargin

        if (
            x - halfW < 0 ||
            x + halfW > this.worldWidth ||
            y - halfH < 0 ||
            y + halfH > this.worldHeight
        ) {
            return false
        }

        return !this.overlapsAnyObstacle(
            x,
            y,
            halfW,
            halfH,
        )
    }

    public hasClearBodyPath(
        startX: number,
        startY: number,
        endX: number,
        endY: number,
        useSafetyPadding = true,
    ): boolean {
        const baseHalfW = useSafetyPadding
            ? this.inflatedHalfWidth
            : this.bodyHalfWidth
        const baseHalfH = useSafetyPadding
            ? this.inflatedHalfHeight
            : this.bodyHalfHeight
        const hw = Math.max(0, baseHalfW - RAY_EPSILON)
        const hh = Math.max(0, baseHalfH - RAY_EPSILON)

        for (const r of this.staticObstacles) {
            if (
                segmentIntersectsRect(
                    startX,
                    startY,
                    endX,
                    endY,
                    r.x - hw,
                    r.y - hh,
                    r.width + hw * 2,
                    r.height + hh * 2,
                )
            ) {
                return false
            }
        }

        for (const entry of this.dynamicObstacles.values()) {
            const r = entry.rect
            if (
                segmentIntersectsRect(
                    startX,
                    startY,
                    endX,
                    endY,
                    r.x - hw,
                    r.y - hh,
                    r.width + hw * 2,
                    r.height + hh * 2,
                )
            ) {
                return false
            }
        }

        return true
    }

    public getWalkablePointsInBounds(
        bounds: WorldRect,
        stepCells = 2,
    ): Phaser.Math.Vector2[] {
        const step = Math.max(1, Math.floor(stepCells))
        const minGrid = this.worldToGrid(
            bounds.x,
            bounds.y,
        )
        const maxGrid = this.worldToGrid(
            bounds.x + bounds.width,
            bounds.y + bounds.height,
        )

        const points: Phaser.Math.Vector2[] = []

        for (let gy = minGrid.y; gy <= maxGrid.y; gy += step) {
            for (let gx = minGrid.x; gx <= maxGrid.x; gx += step) {
                if (this.isBlockedCell(gx, gy)) {
                    continue
                }

                const wx = this.cellCenterX(gx)
                const wy = this.cellCenterY(gy)

                if (
                    wx < bounds.x ||
                    wx > bounds.x + bounds.width ||
                    wy < bounds.y ||
                    wy > bounds.y + bounds.height
                ) {
                    continue
                }

                if (this.isWorldPointWalkable(wx, wy)) {
                    points.push(
                        new Phaser.Math.Vector2(wx, wy),
                    )
                }
            }
        }

        return points
    }

    public findSafePositionNear(
        centerX: number,
        centerY: number,
        options: SafePositionOptions = {},
    ): Phaser.Math.Vector2 | null {
        const {
            bounds,
            avoidPoints = [],
            preferredExtraMargin = 0,
        } = options

        const minGrid = bounds
            ? this.worldToGrid(bounds.x, bounds.y)
            : { x: 0, y: 0 }
        const maxGrid = bounds
            ? this.worldToGrid(
                bounds.x + bounds.width,
                bounds.y + bounds.height,
            )
            : {
                x: this.columns - 1,
                y: this.rows - 1,
            }

        const search = (
            extraMargin: number,
        ): Phaser.Math.Vector2 | null => {
            let bestX = 0
            let bestY = 0
            let bestDistSq = Infinity

            for (let gy = minGrid.y; gy <= maxGrid.y; gy++) {
                const wy = this.cellCenterY(gy)

                if (
                    bounds &&
                    (wy < bounds.y ||
                        wy > bounds.y + bounds.height)
                ) {
                    continue
                }

                for (let gx = minGrid.x; gx <= maxGrid.x; gx++) {
                    if (this.isBlockedCell(gx, gy)) {
                        continue
                    }

                    const wx = this.cellCenterX(gx)

                    if (
                        bounds &&
                        (wx < bounds.x ||
                            wx > bounds.x + bounds.width)
                    ) {
                        continue
                    }

                    const dx = wx - centerX
                    const dy = wy - centerY
                    const distSq = dx * dx + dy * dy

                    if (distSq >= bestDistSq) {
                        continue
                    }

                    if (
                        !this.isWorldPointWalkable(
                            wx,
                            wy,
                            extraMargin,
                        )
                    ) {
                        continue
                    }

                    let tooClose = false

                    for (const avoid of avoidPoints) {
                        const adx = wx - avoid.x
                        const ady = wy - avoid.y
                        if (
                            adx * adx + ady * ady <
                            avoid.minDistance * avoid.minDistance
                        ) {
                            tooClose = true
                            break
                        }
                    }

                    if (tooClose) {
                        continue
                    }

                    bestDistSq = distSq
                    bestX = wx
                    bestY = wy
                }
            }

            return bestDistSq < Infinity
                ? new Phaser.Math.Vector2(bestX, bestY)
                : null
        }

        if (preferredExtraMargin > 0) {
            const preferred = search(preferredExtraMargin)
            if (preferred) {
                return preferred
            }
        }

        return search(0)
    }

    public findPath(
        startX: number,
        startY: number,
        targetX: number,
        targetY: number,
        options: FindPathOptions = {},
    ): Phaser.Math.Vector2[] {
        const snapTarget = options.snapTarget ?? true

        if (
            !snapTarget &&
            !this.isWorldPointWalkable(targetX, targetY)
        ) {
            return []
        }

        if (
            this.isWorldPointWalkable(startX, startY) &&
            this.isWorldPointWalkable(targetX, targetY) &&
            this.hasClearBodyPath(
                startX,
                startY,
                targetX,
                targetY,
                true,
            )
        ) {
            return [
                new Phaser.Math.Vector2(
                    targetX,
                    targetY,
                ),
            ]
        }

        const rawStart =
            this.worldToGrid(
                startX,
                startY,
            )

        const rawTarget =
            this.worldToGrid(
                targetX,
                targetY,
            )

        const start =
            this.findNearestWalkable(
                startX,
                startY,
                rawStart,
                12,
            )

        const target = snapTarget
            ? this.findNearestWalkable(
                targetX,
                targetY,
                rawTarget,
                12,
            )
            : this.isInsideGrid(rawTarget.x, rawTarget.y) &&
                !this.isBlockedCell(rawTarget.x, rawTarget.y)
                ? rawTarget
                : null

        if (!start || !target) {
            return []
        }

        if (
            start.x === target.x &&
            start.y === target.y
        ) {
            if (
                !this.overlapsAnyObstacle(
                    targetX,
                    targetY,
                    this.bodyHalfWidth,
                    this.bodyHalfHeight,
                ) &&
                this.hasClearBodyPath(
                    startX,
                    startY,
                    targetX,
                    targetY,
                    false,
                )
            ) {
                return [
                    new Phaser.Math.Vector2(
                        targetX,
                        targetY,
                    ),
                ]
            }

            return [
                this.gridToWorld(
                    target.x,
                    target.y,
                ),
            ]
        }

        if (this.visitStamp >= 0xfffffff0) {
            this.visitState.fill(0)
            this.visitStamp = 0
        }

        this.visitStamp += 2
        const openTag = this.visitStamp
        const closedTag = this.visitStamp + 1

        const startIdx =
            start.y * this.columns + start.x
        const targetIdx =
            target.y * this.columns + target.x

        this.heapIndices.length = 0
        this.heapF.length = 0

        this.gScore[startIdx] = 0
        this.parent[startIdx] = -1
        this.visitState[startIdx] = openTag

        this.heapPush(
            startIdx,
            this.heuristic(start.x, start.y, target.x, target.y),
        )

        while (this.heapIndices.length > 0) {
            const currentIdx = this.heapPop()

            if (this.visitState[currentIdx] === closedTag) {
                continue
            }

            if (currentIdx === targetIdx) {
                return this.reconstructPath(
                    currentIdx,
                    startX,
                    startY,
                    targetX,
                    targetY,
                )
            }

            this.visitState[currentIdx] = closedTag

            const cx = currentIdx % this.columns
            const cy = (currentIdx - cx) / this.columns
            const currentG = this.gScore[currentIdx]

            for (const [dx, dy, baseCost] of DIRECTIONS) {
                const nx = cx + dx
                const ny = cy + dy

                if (!this.isInsideGrid(nx, ny)) {
                    continue
                }

                const neighborIdx =
                    ny * this.columns + nx

                if (
                    this.visitState[neighborIdx] === closedTag ||
                    this.isBlockedIndex(neighborIdx)
                ) {
                    continue
                }

                if (dx !== 0 && dy !== 0) {
                    if (
                        this.isBlockedIndex(cy * this.columns + nx) ||
                        this.isBlockedIndex(ny * this.columns + cx)
                    ) {
                        continue
                    }
                }

                const nearWall =
                    this.isNearCardinalObstacle(nx, ny)
                const tentativeG =
                    currentG +
                    baseCost +
                    (nearWall ? NEAR_WALL_PENALTY : 0)

                if (
                    this.visitState[neighborIdx] === openTag &&
                    tentativeG >= this.gScore[neighborIdx]
                ) {
                    continue
                }

                this.gScore[neighborIdx] = tentativeG
                this.parent[neighborIdx] = currentIdx
                this.visitState[neighborIdx] = openTag

                const f =
                    tentativeG +
                    this.heuristic(nx, ny, target.x, target.y)

                this.heapPush(neighborIdx, f)
            }
        }

        return []
    }

    private buildBlockedGrid(
        wallRects: readonly WorldRect[],
    ): void {
        for (const rect of wallRects) {
            const cells =
                this.getInflatedCellIndices(rect)

            for (const idx of cells) {
                this.staticBlocked[idx] = 1
            }
        }
    }

    private getInflatedCellIndices(
        rect: WorldRect,
    ): number[] {
        const minX =
            rect.x - this.inflatedHalfWidth
        const maxX =
            rect.x + rect.width + this.inflatedHalfWidth
        const minY =
            rect.y - this.inflatedHalfHeight
        const maxY =
            rect.y + rect.height + this.inflatedHalfHeight

        const halfCell = this.cellSize / 2

        const left = Math.max(
            0,
            Math.floor(
                (minX - this.gridOffsetX - halfCell) /
                this.cellSize,
            ) + 1,
        )

        const right = Math.min(
            this.columns - 1,
            Math.ceil(
                (maxX - this.gridOffsetX - halfCell) /
                this.cellSize,
            ) - 1,
        )

        const top = Math.max(
            0,
            Math.floor(
                (minY - this.gridOffsetY - halfCell) /
                this.cellSize,
            ) + 1,
        )

        const bottom = Math.min(
            this.rows - 1,
            Math.ceil(
                (maxY - this.gridOffsetY - halfCell) /
                this.cellSize,
            ) - 1,
        )

        if (left > right || top > bottom) {
            return []
        }

        const cells: number[] = []

        for (let gy = top; gy <= bottom; gy++) {
            const rowOffset = gy * this.columns
            for (let gx = left; gx <= right; gx++) {
                cells.push(rowOffset + gx)
            }
        }

        return cells
    }

    private reconstructPath(
        endIdx: number,
        startWorldX: number,
        startWorldY: number,
        targetWorldX: number,
        targetWorldY: number,
    ): Phaser.Math.Vector2[] {
        const cellCenters: { x: number; y: number }[] = []

        let current = endIdx

        while (current !== -1) {
            const gx = current % this.columns
            const gy = (current - gx) / this.columns
            cellCenters.push({
                x: this.cellCenterX(gx),
                y: this.cellCenterY(gy),
            })
            current = this.parent[current]
        }

        cellCenters.reverse()

        const rawPts: { x: number; y: number }[] = [
            ...cellCenters,
        ]

        const lastCell =
            cellCenters[cellCenters.length - 1]

        if (
            lastCell &&
            !this.overlapsAnyObstacle(
                targetWorldX,
                targetWorldY,
                this.bodyHalfWidth,
                this.bodyHalfHeight,
            ) &&
            this.hasClearBodyPath(
                lastCell.x,
                lastCell.y,
                targetWorldX,
                targetWorldY,
                false,
            )
        ) {
            rawPts.push({
                x: targetWorldX,
                y: targetWorldY,
            })
        }

        const smoothed: Phaser.Math.Vector2[] = [
            new Phaser.Math.Vector2(
                rawPts[0].x,
                rawPts[0].y,
            ),
        ]
        let anchorIdx = 0

        while (anchorIdx < rawPts.length - 1) {
            let furthest = anchorIdx + 1

            for (
                let j = rawPts.length - 1;
                j > anchorIdx + 1;
                j--
            ) {
                if (
                    this.hasClearBodyPath(
                        rawPts[anchorIdx].x,
                        rawPts[anchorIdx].y,
                        rawPts[j].x,
                        rawPts[j].y,
                        true,
                    )
                ) {
                    furthest = j
                    break
                }
            }

            smoothed.push(
                new Phaser.Math.Vector2(
                    rawPts[furthest].x,
                    rawPts[furthest].y,
                ),
            )
            anchorIdx = furthest
        }

        while (smoothed.length >= 2) {
            const first = smoothed[0]
            const second = smoothed[1]

            if (
                this.hasClearBodyPath(
                    startWorldX,
                    startWorldY,
                    second.x,
                    second.y,
                    true,
                )
            ) {
                smoothed.shift()
                continue
            }

            const dot =
                (startWorldX - first.x) * (second.x - first.x) +
                (startWorldY - first.y) * (second.y - first.y)

            if (
                dot >= 0 &&
                this.hasClearBodyPath(
                    startWorldX,
                    startWorldY,
                    second.x,
                    second.y,
                    false,
                )
            ) {
                smoothed.shift()
                continue
            }

            break
        }

        if (
            smoothed.length >= 2 &&
            Phaser.Math.Distance.Between(
                startWorldX,
                startWorldY,
                smoothed[0].x,
                smoothed[0].y,
            ) <= 1 &&
            this.hasClearBodyPath(
                startWorldX,
                startWorldY,
                smoothed[1].x,
                smoothed[1].y,
                true,
            )
        ) {
            smoothed.shift()
        }

        return smoothed
    }

    private findNearestWalkable(
        worldX: number,
        worldY: number,
        origin: GridPoint,
        maxRadius: number,
    ): GridPoint | null {
        if (
            this.isInsideGrid(origin.x, origin.y) &&
            !this.isBlockedCell(origin.x, origin.y)
        ) {
            return origin
        }

        const obstacles = this.getActiveObstacles()
        let bestVisible: GridPoint | null = null
        let bestVisibleDistSq = Infinity
        let bestFallback: GridPoint | null = null
        let bestFallbackDistSq = Infinity

        const minY = Math.max(0, origin.y - maxRadius)
        const maxY = Math.min(this.rows - 1, origin.y + maxRadius)
        const minX = Math.max(0, origin.x - maxRadius)
        const maxX = Math.min(this.columns - 1, origin.x + maxRadius)

        for (let gy = minY; gy <= maxY; gy++) {
            const wy = this.cellCenterY(gy)
            const dy = wy - worldY
            const dySq = dy * dy

            if (
                dySq >= bestVisibleDistSq &&
                dySq >= bestFallbackDistSq
            ) {
                continue
            }

            for (let gx = minX; gx <= maxX; gx++) {
                if (this.isBlockedCell(gx, gy)) {
                    continue
                }

                const wx = this.cellCenterX(gx)
                const dx = wx - worldX
                const distSq = dx * dx + dySq

                if (distSq < bestFallbackDistSq) {
                    bestFallbackDistSq = distSq
                    bestFallback = { x: gx, y: gy }
                }

                if (
                    distSq < bestVisibleDistSq &&
                    hasLineOfSight(
                        worldX,
                        worldY,
                        wx,
                        wy,
                        obstacles,
                    )
                ) {
                    bestVisibleDistSq = distSq
                    bestVisible = { x: gx, y: gy }
                }
            }
        }

        return bestVisible ?? bestFallback
    }

    private overlapsAnyObstacle(
        x: number,
        y: number,
        halfW: number,
        halfH: number,
    ): boolean {
        const left = x - halfW
        const right = x + halfW
        const top = y - halfH
        const bottom = y + halfH

        for (const r of this.staticObstacles) {
            if (
                right > r.x &&
                left < r.x + r.width &&
                bottom > r.y &&
                top < r.y + r.height
            ) {
                return true
            }
        }

        for (const entry of this.dynamicObstacles.values()) {
            const r = entry.rect
            if (
                right > r.x &&
                left < r.x + r.width &&
                bottom > r.y &&
                top < r.y + r.height
            ) {
                return true
            }
        }

        return false
    }

    private isNearCardinalObstacle(
        gx: number,
        gy: number,
    ): boolean {
        const idx = gy * this.columns + gx

        if (gx > 0 && this.isBlockedIndex(idx - 1)) {
            return true
        }
        if (
            gx + 1 < this.columns &&
            this.isBlockedIndex(idx + 1)
        ) {
            return true
        }
        if (gy > 0 && this.isBlockedIndex(idx - this.columns)) {
            return true
        }
        if (
            gy + 1 < this.rows &&
            this.isBlockedIndex(idx + this.columns)
        ) {
            return true
        }

        return false
    }

    private heapPush(
        idx: number,
        f: number,
    ): void {
        let i = this.heapIndices.length
        this.heapIndices.push(idx)
        this.heapF.push(f)

        while (i > 0) {
            const p = (i - 1) >> 1
            if (this.heapF[p] <= f) {
                break
            }
            this.heapIndices[i] = this.heapIndices[p]
            this.heapF[i] = this.heapF[p]
            i = p
        }

        this.heapIndices[i] = idx
        this.heapF[i] = f
    }

    private heapPop(): number {
        const top = this.heapIndices[0]
        const lastIdx = this.heapIndices.pop()!
        const lastF = this.heapF.pop()!
        const length = this.heapIndices.length

        if (length > 0) {
            let i = 0

            while (true) {
                const left = (i << 1) + 1
                const right = left + 1
                let smallest = i

                if (
                    left < length &&
                    this.heapF[left] < this.heapF[smallest]
                ) {
                    smallest = left
                }

                if (
                    right < length &&
                    this.heapF[right] < this.heapF[smallest]
                ) {
                    smallest = right
                }

                if (smallest === i) {
                    break
                }

                this.heapIndices[i] = this.heapIndices[smallest]
                this.heapF[i] = this.heapF[smallest]
                i = smallest
            }

            this.heapIndices[i] = lastIdx
            this.heapF[i] = lastF
        }

        return top
    }

    private heuristic(
        ax: number,
        ay: number,
        bx: number,
        by: number,
    ): number {
        const dx = Math.abs(ax - bx)
        const dy = Math.abs(ay - by)
        return (
            dx +
            dy +
            (Math.SQRT2 - 2) * Math.min(dx, dy)
        )
    }

    private worldToGrid(
        x: number,
        y: number,
    ): GridPoint {
        const halfCell = this.cellSize / 2
        return {
            x: Phaser.Math.Clamp(
                Math.round(
                    (x - this.gridOffsetX - halfCell) /
                    this.cellSize,
                ),
                0,
                this.columns - 1,
            ),
            y: Phaser.Math.Clamp(
                Math.round(
                    (y - this.gridOffsetY - halfCell) /
                    this.cellSize,
                ),
                0,
                this.rows - 1,
            ),
        }
    }

    private cellCenterX(gx: number): number {
        return (
            this.gridOffsetX +
            gx * this.cellSize +
            this.cellSize / 2
        )
    }

    private cellCenterY(gy: number): number {
        return (
            this.gridOffsetY +
            gy * this.cellSize +
            this.cellSize / 2
        )
    }

    private gridToWorld(
        x: number,
        y: number,
    ): Phaser.Math.Vector2 {
        return new Phaser.Math.Vector2(
            this.cellCenterX(x),
            this.cellCenterY(y),
        )
    }

    private isBlockedCell(
        x: number,
        y: number,
    ): boolean {
        return this.isBlockedIndex(
            y * this.columns + x,
        )
    }

    private isBlockedIndex(
        idx: number,
    ): boolean {
        return (
            this.staticBlocked[idx] !== 0 ||
            this.dynamicBlockedCount[idx] !== 0
        )
    }

    private isInsideGrid(
        x: number,
        y: number,
    ): boolean {
        return (
            x >= 0 &&
            y >= 0 &&
            x < this.columns &&
            y < this.rows
        )
    }
}
