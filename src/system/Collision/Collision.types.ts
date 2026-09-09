import type Phaser from 'phaser'

/**
 * Retângulo no mundo.
 * x e y representam o canto superior esquerdo.
 */
export interface WorldRect {
  readonly x: number
  readonly y: number
  readonly width: number
  readonly height: number
}

/**
 * Objetos físicos que podem ser vinculados
 * ao sistema de colisão.
 *
 * Sprite e Image possuem body possivelmente null
 * nos tipos do Phaser, por isso não usamos
 * GameObjectWithBody aqui.
 */
export type PhysicsActor =
  | Phaser.Physics.Arcade.Sprite
  | Phaser.Physics.Arcade.Image

export const PickupMode = {
  Auto: 'auto',
  Interact: 'interact',
} as const

export type PickupMode =
  (typeof PickupMode)[keyof typeof PickupMode]

export const COLLISION_EVENTS = {
  PICKUP_RANGE_ENTERED: 'collision-pickup-range-entered',
  PICKUP_RANGE_LEFT: 'collision-pickup-range-left',
  ITEM_COLLECTED: 'collision-item-collected',
  PICKUP_BLOCKED: 'collision-pickup-blocked',
} as const

export type CollisionEvent =
  (typeof COLLISION_EVENTS)[keyof typeof COLLISION_EVENTS]

export interface CollisionConfig {
  readonly pickupMode?: PickupMode
  readonly pickupRadius?: number
}