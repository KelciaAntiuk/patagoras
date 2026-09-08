import type Phaser from 'phaser'

export interface WorldRect {
  readonly x: number
  readonly y: number
  readonly width: number
  readonly height: number
}

export type PhysicsActor = Phaser.Types.Physics.Arcade.GameObjectWithBody

export const PickupMode = {
  Auto: 'auto',
  Interact: 'interact',
} as const

export type PickupMode = (typeof PickupMode)[keyof typeof PickupMode]

export const COLLISION_EVENTS = {
  PICKUP_RANGE_ENTERED: 'collision-pickup-range-entered',
  PICKUP_RANGE_LEFT: 'collision-pickup-range-left',
  ITEM_COLLECTED: 'collision-item-collected',
  PICKUP_BLOCKED: 'collision-pickup-blocked',
} as const

export type CollisionEvent = (typeof COLLISION_EVENTS)[keyof typeof COLLISION_EVENTS]

export interface CollisionConfig {
  readonly pickupMode?: PickupMode
  readonly pickupRadius?: number
}
