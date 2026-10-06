import Phaser from 'phaser'

import type {
    WorldRect,
} from '../../system/Collision/Collision.types'

type GridPoint = {
    x: number
    y: number
}

type Node = GridPoint & {
    g: number
    h: number
    f: number
    parent?: Node
}

export class PatagorasPathfinder {

    private readonly blocked =
        new Set<string>()

    private readonly columns: number

    private readonly rows: number

    constructor(
        worldWidth: number,
        worldHeight: number,
        private readonly cellSize: number,
        wallRects: readonly WorldRect[],
        obstaclePadding = 6,
    ) {
        this.columns = Math.ceil(
            worldWidth / cellSize,
        )

        this.rows = Math.ceil(
            worldHeight / cellSize,
        )

        this.buildBlockedGrid(
            wallRects,
            obstaclePadding,
        )
    }

    public findPath(
        startX: number,
        startY: number,
        targetX: number,
        targetY: number,
    ): Phaser.Math.Vector2[] {

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
                rawStart,
            )

        const target =
            this.findNearestWalkable(
                rawTarget,
            )

        if (!start || !target) {
            return []
        }

        const open = new Map<
            string,
            Node
        >()

        const closed =
            new Set<string>()

        const startNode: Node = {
            ...start,
            g: 0,
            h: this.heuristic(
                start,
                target,
            ),
            f: 0,
        }

        startNode.f =
            startNode.g +
            startNode.h

        open.set(
            this.key(start.x, start.y),
            startNode,
        )

        while (open.size > 0) {

            const current =
                this.getLowestF(open)

            if (!current) {
                break
            }

            const currentKey =
                this.key(
                    current.x,
                    current.y,
                )

            open.delete(currentKey)
            closed.add(currentKey)

            if (
                current.x === target.x &&
                current.y === target.y
            ) {
                return this.reconstructPath(
                    current,
                )
            }

            for (
                const neighbor
                of this.getNeighbors(current)
            ) {
                const neighborKey =
                    this.key(
                        neighbor.x,
                        neighbor.y,
                    )

                if (
                    closed.has(neighborKey) ||
                    this.isBlocked(
                        neighbor.x,
                        neighbor.y,
                    )
                ) {
                    continue
                }

                const tentativeG =
                    current.g + 1

                const existing =
                    open.get(neighborKey)

                if (
                    existing &&
                    tentativeG >= existing.g
                ) {
                    continue
                }

                const node: Node = {
                    x: neighbor.x,
                    y: neighbor.y,
                    g: tentativeG,
                    h: this.heuristic(
                        neighbor,
                        target,
                    ),
                    f: 0,
                    parent: current,
                }

                node.f =
                    node.g + node.h

                open.set(
                    neighborKey,
                    node,
                )
            }
        }

        return []
    }

    private buildBlockedGrid(
        wallRects: readonly WorldRect[],
        padding: number,
    ): void {

        for (const rect of wallRects) {

            const left =
                Math.floor(
                    (rect.x - padding) /
                    this.cellSize,
                )

            const right =
                Math.floor(
                    (
                        rect.x +
                        rect.width +
                        padding - 1
                    ) /
                    this.cellSize,
                )

            const top =
                Math.floor(
                    (rect.y - padding) /
                    this.cellSize,
                )

            const bottom =
                Math.floor(
                    (
                        rect.y +
                        rect.height +
                        padding - 1
                    ) /
                    this.cellSize,
                )

            for (
                let gridY = top;
                gridY <= bottom;
                gridY++
            ) {
                for (
                    let gridX = left;
                    gridX <= right;
                    gridX++
                ) {
                    if (
                        this.isInsideGrid(
                            gridX,
                            gridY,
                        )
                    ) {
                        this.blocked.add(
                            this.key(
                                gridX,
                                gridY,
                            ),
                        )
                    }
                }
            }
        }
    }

    private reconstructPath(
        endNode: Node,
    ): Phaser.Math.Vector2[] {

        const cells: GridPoint[] = []

        let current:
            Node | undefined =
            endNode

        while (current) {
            cells.push({
                x: current.x,
                y: current.y,
            })

            current = current.parent
        }

        cells.reverse()

        const simplified =
            this.removeCollinearCells(
                cells,
            )

        // Remove a célula inicial, pois o pato
        // já está nela.
        if (simplified.length > 1) {
            simplified.shift()
        }

        return simplified.map(
            cell =>
                this.gridToWorld(
                    cell.x,
                    cell.y,
                ),
        )
    }

    private removeCollinearCells(
        cells: GridPoint[],
    ): GridPoint[] {

        if (cells.length <= 2) {
            return cells
        }

        const result: GridPoint[] = [
            cells[0],
        ]

        for (
            let index = 1;
            index < cells.length - 1;
            index++
        ) {
            const previous =
                cells[index - 1]

            const current =
                cells[index]

            const next =
                cells[index + 1]

            const previousDx =
                current.x - previous.x

            const previousDy =
                current.y - previous.y

            const nextDx =
                next.x - current.x

            const nextDy =
                next.y - current.y

            if (
                previousDx !== nextDx ||
                previousDy !== nextDy
            ) {
                result.push(current)
            }
        }

        result.push(
            cells[cells.length - 1],
        )

        return result
    }

    private findNearestWalkable(
        point: GridPoint,
    ): GridPoint | null {

        if (
            this.isInsideGrid(
                point.x,
                point.y,
            ) &&
            !this.isBlocked(
                point.x,
                point.y,
            )
        ) {
            return point
        }

        const maxRadius = 4

        for (
            let radius = 1;
            radius <= maxRadius;
            radius++
        ) {
            for (
                let y = point.y - radius;
                y <= point.y + radius;
                y++
            ) {
                for (
                    let x = point.x - radius;
                    x <= point.x + radius;
                    x++
                ) {
                    const isBorder =
                        x === point.x - radius ||
                        x === point.x + radius ||
                        y === point.y - radius ||
                        y === point.y + radius

                    if (!isBorder) {
                        continue
                    }

                    if (
                        this.isInsideGrid(x, y) &&
                        !this.isBlocked(x, y)
                    ) {
                        return { x, y }
                    }
                }
            }
        }

        return null
    }

    private getNeighbors(
        node: GridPoint,
    ): GridPoint[] {

        const candidates = [
            { x: node.x + 1, y: node.y },
            { x: node.x - 1, y: node.y },
            { x: node.x, y: node.y + 1 },
            { x: node.x, y: node.y - 1 },
        ]

        return candidates.filter(
            point =>
                this.isInsideGrid(
                    point.x,
                    point.y,
                ),
        )
    }

    private getLowestF(
        open: Map<string, Node>,
    ): Node | undefined {

        let best: Node | undefined

        for (const node of open.values()) {
            if (
                !best ||
                node.f < best.f ||
                (
                    node.f === best.f &&
                    node.h < best.h
                )
            ) {
                best = node
            }
        }

        return best
    }

    private heuristic(
        from: GridPoint,
        to: GridPoint,
    ): number {
        return (
            Math.abs(from.x - to.x) +
            Math.abs(from.y - to.y)
        )
    }

    private worldToGrid(
        x: number,
        y: number,
    ): GridPoint {
        return {
            x: Phaser.Math.Clamp(
                Math.floor(x / this.cellSize),
                0,
                this.columns - 1,
            ),
            y: Phaser.Math.Clamp(
                Math.floor(y / this.cellSize),
                0,
                this.rows - 1,
            ),
        }
    }

    private gridToWorld(
        x: number,
        y: number,
    ): Phaser.Math.Vector2 {
        return new Phaser.Math.Vector2(
            x * this.cellSize +
            this.cellSize / 2,
            y * this.cellSize +
            this.cellSize / 2,
        )
    }

    private isBlocked(
        x: number,
        y: number,
    ): boolean {
        return this.blocked.has(
            this.key(x, y),
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

    private key(
        x: number,
        y: number,
    ): string {
        return `${x},${y}`
    }
}
