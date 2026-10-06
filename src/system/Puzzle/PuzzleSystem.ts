import Phaser from 'phaser'
import { PATAGORAS_EVENTS } from '../../characters/Patagoras/Patagoras.events'
import type { PatagorasHit } from '../../characters/Patagoras/PatagorasHit'
import { PUZZLES } from '../../puzzles'
import type { PuzzleId } from '../../puzzles'
import type { InventorySystem } from '../Inventory/InventorySystem'
import { PUZZLE_EVENTS, PuzzleCloseReason, PuzzleEstado } from './Puzzle.types'
import type { PuzzleFechamento } from './Puzzle.types'
import { PUZZLE_SCENE_KEY } from './PuzzleScene'
import type { PuzzleSceneDados } from './PuzzleScene'
import { PuzzleTrigger } from './PuzzleTrigger'

const RAIO_INTERACAO = 40

export interface PuzzleSystemConfig {
  readonly jogador: Phaser.Physics.Arcade.Sprite
  readonly inventario: InventorySystem
  readonly patagorasHit: PatagorasHit
  readonly raioInteracao?: number
}

export class PuzzleSystem extends Phaser.Events.EventEmitter {
  private readonly gatilhos: PuzzleTrigger[] = []
  private readonly resolvidos = new Set<PuzzleId>()
  private focado: PuzzleTrigger | null = null
  private abertoId: PuzzleId | null = null
  private readonly raio: number

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly config: PuzzleSystemConfig,
  ) {
    super()
    this.raio = config.raioInteracao ?? RAIO_INTERACAO

    config.patagorasHit.on(PATAGORAS_EVENTS.HIT_PLAYER, this.aoSerAtacado, this)
  }

  get aberto(): boolean {
    return this.abertoId !== null
  }

  estado(id: PuzzleId): PuzzleEstado {
    if (this.resolvidos.has(id)) return PuzzleEstado.Resolvido
    const requisitos = PUZZLES[id].requisitos ?? []
    return requisitos.every((r) => this.resolvidos.has(r)) ? PuzzleEstado.Disponivel : PuzzleEstado.Bloqueado
  }

  adicionarGatilho(x: number, y: number, puzzleId: PuzzleId): PuzzleTrigger {
    const gatilho = new PuzzleTrigger(this.scene, x, y, puzzleId)
    this.gatilhos.push(gatilho)
    return gatilho
  }

  update(): void {
    const proximo = this.aberto ? null : this.gatilhoMaisProximo()
    if (proximo === this.focado) return

    this.focado?.mostrarDica(null)
    proximo?.mostrarDica(this.estado(proximo.puzzleId))
    this.focado = proximo
  }

  interagir(): boolean {
    if (!this.focado) return false
    return this.abrir(this.focado.puzzleId)
  }

  abrir(puzzleId: PuzzleId): boolean {
    if (this.aberto || this.estado(puzzleId) !== PuzzleEstado.Disponivel) return false

    this.abertoId = puzzleId
    this.config.jogador.setVelocity(0, 0)

    const dados: PuzzleSceneDados = {
      definicao: PUZZLES[puzzleId],
      inventario: this.config.inventario,
      resolver: () => this.resolver(),
      errar: () => this.emit(PUZZLE_EVENTS.FAILED, puzzleId),
      fechar: () => this.fechar(PuzzleCloseReason.Jogador),
    }
    this.scene.scene.launch(PUZZLE_SCENE_KEY, dados)

    this.emit(PUZZLE_EVENTS.OPENED, puzzleId)
    return true
  }

  fechar(motivo: PuzzleCloseReason): void {
    if (!this.abertoId) return

    const fechamento: PuzzleFechamento = { puzzleId: this.abertoId, motivo }
    this.abertoId = null
    this.scene.scene.stop(PUZZLE_SCENE_KEY)

    this.emit(PUZZLE_EVENTS.CLOSED, fechamento)
  }

  destroy(): void {
    this.fechar(PuzzleCloseReason.Encerrado)
    this.config.patagorasHit.off(PATAGORAS_EVENTS.HIT_PLAYER, this.aoSerAtacado, this)
    this.gatilhos.forEach((g) => g.destroy())
    this.gatilhos.length = 0
    this.removeAllListeners()
  }

  private resolver(): void {
    if (!this.abertoId) return

    this.resolvidos.add(this.abertoId)
    this.emit(PUZZLE_EVENTS.SOLVED, this.abertoId)
    this.fechar(PuzzleCloseReason.Resolvido)
  }

  private aoSerAtacado(): void {
    this.fechar(PuzzleCloseReason.Atacado)
  }

  private gatilhoMaisProximo(): PuzzleTrigger | null {
    const { x, y } = this.config.jogador
    let melhor: PuzzleTrigger | null = null
    let melhorDistancia = this.raio

    for (const gatilho of this.gatilhos) {
      const distancia = Phaser.Math.Distance.Between(x, y, gatilho.sprite.x, gatilho.sprite.y)
      if (distancia <= melhorDistancia) {
        melhor = gatilho
        melhorDistancia = distancia
      }
    }
    return melhor
  }
}
