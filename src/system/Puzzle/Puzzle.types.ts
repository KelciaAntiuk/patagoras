export const PuzzleState = {
  Locked: 'locked',
  Available: 'available',
  Solved: 'solved',
} as const

export type PuzzleState = (typeof PuzzleState)[keyof typeof PuzzleState]

export const PuzzleKind = {
  Note: 'note',
  NumberInput: 'number-input',
  EquationSlot: 'equation-slot',
  Password: 'password',
} as const

export type PuzzleKind = (typeof PuzzleKind)[keyof typeof PuzzleKind]

export interface PuzzleDefinition {
  readonly id: string
  readonly kind: PuzzleKind
  readonly roomId: string
  readonly description: string
  readonly prerequisiteIds: string[]
}

export interface NotePuzzleDef extends PuzzleDefinition {
  readonly kind: typeof PuzzleKind.Note
  readonly noteText: string
}

export interface NumberInputPuzzleDef extends PuzzleDefinition {
  readonly kind: typeof PuzzleKind.NumberInput
  readonly prompt: string
  readonly answer: number
}

export interface EquationSlotPuzzleDef extends PuzzleDefinition {
  readonly kind: typeof PuzzleKind.EquationSlot
  readonly equation: string
  readonly slotIndex: number
  readonly answer: number // Simplificando para receber o valor esperado direto
}

export interface PasswordPuzzleDef extends PuzzleDefinition {
  readonly kind: typeof PuzzleKind.Password
  readonly prompt: string
  readonly answer: string
  readonly caseSensitive: boolean
}

export const PUZZLE_EVENTS = {
  STATE_CHANGED: 'puzzle-state-changed',
  SOLVED: 'puzzle-solved',
  FAILED: 'puzzle-failed',
} as const

