import Phaser from 'phaser'
import { PuzzleState, PUZZLE_EVENTS } from './Puzzle.types'
import type { PuzzleDefinition } from './Puzzle.types'

export class PuzzleManager extends Phaser.Events.EventEmitter {
  private readonly puzzles = new Map<string, PuzzleDefinition>()
  private readonly states = new Map<string, PuzzleState>()

  register(puzzle: PuzzleDefinition): void {
    if (this.puzzles.has(puzzle.id)) {
      throw new Error(`Puzzle já registrado: ${puzzle.id}`)
    }

    this.puzzles.set(puzzle.id, puzzle)

    const initialState =
      puzzle.prerequisiteIds.length === 0
        ? PuzzleState.Available
        : PuzzleState.Locked

    this.states.set(puzzle.id, initialState)

    this.updateStates()
  }

  registerMany(puzzles: readonly PuzzleDefinition[]): void {
    puzzles.forEach((puzzle) => this.register(puzzle))
  }

  getPuzzle(id: string): PuzzleDefinition | undefined {
    return this.puzzles.get(id)
  }

  getState(id: string): PuzzleState {
    return this.states.get(id) ?? PuzzleState.Locked
  }

  isAvailable(id: string): boolean {
    return this.getState(id) === PuzzleState.Available
  }

  isSolved(id: string): boolean {
    return this.getState(id) === PuzzleState.Solved
  }

  solve(id: string): void {
    if (!this.puzzles.has(id)) {
      throw new Error(`Puzzle não encontrado: ${id}`)
    }

    if (this.states.get(id) !== PuzzleState.Available) {
      return
    }

    this.states.set(id, PuzzleState.Solved)

    this.emit(PUZZLE_EVENTS.SOLVED, id)
    this.emit(
      PUZZLE_EVENTS.STATE_CHANGED,
      id,
      PuzzleState.Solved
    )

    this.updateStates()
  }

  fail(id: string): void {
    if (!this.puzzles.has(id)) {
      throw new Error(`Puzzle não encontrado: ${id}`)
    }

    if (this.states.get(id) === PuzzleState.Solved) {
      return
    }

    this.emit(PUZZLE_EVENTS.FAILED, id)
  }

  private updateStates(): void {
    let changed = false

    this.puzzles.forEach((puzzle) => {
      const currentState = this.states.get(puzzle.id)

      if (currentState === PuzzleState.Solved) {
        return
      }

      const canUnlock = puzzle.prerequisiteIds.every(
        (prerequisiteId) =>
          this.states.get(prerequisiteId) === PuzzleState.Solved
      )

      if (
        canUnlock &&
        currentState === PuzzleState.Locked
      ) {
        this.states.set(
          puzzle.id,
          PuzzleState.Available
        )

        this.emit(
          PUZZLE_EVENTS.STATE_CHANGED,
          puzzle.id,
          PuzzleState.Available
        )

        changed = true
      }
    })

    if (changed) {
      this.updateStates()
    }
  }
}