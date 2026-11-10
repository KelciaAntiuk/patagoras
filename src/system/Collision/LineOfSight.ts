import type { WorldRect } from './Collision.types'

export type ObstacleProvider = () => readonly WorldRect[]

export function getActorCenter(actor: {
  readonly x: number
  readonly y: number
  readonly body?: {
    readonly center: {
      readonly x: number
      readonly y: number
    }
  } | null
}): { x: number; y: number } {
  if (actor.body?.center) {
    return {
      x: actor.body.center.x,
      y: actor.body.center.y,
    }
  }

  return {
    x: actor.x,
    y: actor.y,
  }
}

export function segmentEntryT(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  rx: number,
  ry: number,
  rw: number,
  rh: number,
): number | null {
  let tmin = 0
  let tmax = 1
  const dx = x2 - x1
  const dy = y2 - y1

  if (Math.abs(dx) < 1e-8) {
    if (x1 < rx || x1 > rx + rw) {
      return null
    }
  } else {
    const inv = 1 / dx
    let t1 = (rx - x1) * inv
    let t2 = (rx + rw - x1) * inv
    if (t1 > t2) {
      const tmp = t1
      t1 = t2
      t2 = tmp
    }
    tmin = Math.max(tmin, t1)
    tmax = Math.min(tmax, t2)
    if (tmin > tmax) {
      return null
    }
  }

  if (Math.abs(dy) < 1e-8) {
    if (y1 < ry || y1 > ry + rh) {
      return null
    }
  } else {
    const inv = 1 / dy
    let t1 = (ry - y1) * inv
    let t2 = (ry + rh - y1) * inv
    if (t1 > t2) {
      const tmp = t1
      t1 = t2
      t2 = tmp
    }
    tmin = Math.max(tmin, t1)
    tmax = Math.min(tmax, t2)
    if (tmin > tmax) {
      return null
    }
  }

  return tmin
}

export function segmentIntersectsRect(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  rx: number,
  ry: number,
  rw: number,
  rh: number,
): boolean {
  return segmentEntryT(x1, y1, x2, y2, rx, ry, rw, rh) !== null
}

/**
 * Reduz a distância máxima de um disparo linear caso intercepte algum obstáculo sólido.
 */
export function clipDistanceToObstacles(
  startX: number,
  startY: number,
  dirX: number,
  dirY: number,
  maxDist: number,
  obstacles: readonly WorldRect[],
): number {
  const endX = startX + dirX * maxDist
  const endY = startY + dirY * maxDist
  let bestDist = maxDist

  for (const r of obstacles) {
    const t = segmentEntryT(
      startX,
      startY,
      endX,
      endY,
      r.x,
      r.y,
      r.width,
      r.height,
    )
    if (t !== null) {
      const hitDist = Math.max(0, t * maxDist - 4)
      if (hitDist < bestDist) {
        bestDist = hitDist
      }
    }
  }

  return bestDist
}

function isSameRect(a: WorldRect, b: WorldRect): boolean {
  return (
    a === b ||
    (a.x === b.x &&
      a.y === b.y &&
      a.width === b.width &&
      a.height === b.height)
  )
}

/**
 * Verifica se existe linha de visão desobstruída entre o ponto inicial
 * (ex.: centro físico do jogador) e o ponto-alvo no mundo.
 */
export function hasLineOfSight(
  startX: number,
  startY: number,
  targetX: number,
  targetY: number,
  obstacles: readonly WorldRect[],
  ignoreRect?: WorldRect,
): boolean {
  const dx = targetX - startX
  const dy = targetY - startY
  const dist = Math.hypot(dx, dy)

  if (dist <= 1) {
    return true
  }

  const ux = dx / dist
  const uy = dy / dist
  const pull = Math.min(1.5, dist * 0.4)
  const endX = targetX - ux * pull
  const endY = targetY - uy * pull

  const nx = -uy * 1.2
  const ny = ux * 1.2

  for (const r of obstacles) {
    if (ignoreRect && isSameRect(r, ignoreRect)) {
      continue
    }

    if (
      segmentIntersectsRect(
        startX,
        startY,
        endX,
        endY,
        r.x - 0.5,
        r.y - 0.5,
        r.width + 1,
        r.height + 1,
      )
    ) {
      return false
    }

    if (dist > 6) {
      if (
        segmentIntersectsRect(
          startX + nx,
          startY + ny,
          endX,
          endY,
          r.x,
          r.y,
          r.width,
          r.height,
        ) ||
        segmentIntersectsRect(
          startX - nx,
          startY - ny,
          endX,
          endY,
          r.x,
          r.y,
          r.width,
          r.height,
        )
      ) {
        return false
      }
    }
  }

  return true
}
