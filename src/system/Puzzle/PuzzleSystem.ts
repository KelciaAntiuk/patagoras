import Phaser from 'phaser'
import { PATAGORAS_EVENTS } from '../../characters/Patagoras/Patagoras.events'
import type { PatagorasHit } from '../../characters/Patagoras/PatagorasHit'
import type { PuzzleId } from '../../puzzles'
import type { InventorySystem } from '../Inventory/InventorySystem'
import { PUZZLE_EVENTS, PuzzleCloseReason } from './Puzzle.types'
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

/**
 * Controla o ciclo de vida dos puzzles a partir da GameScene.
 *
 * Comportamentos comuns a TODOS os puzzles ficam mapeados aqui:
 * - abrir pelo gatilho no mapa (E);
 * - fechar com ESC / botão X;
 * - fechar sozinho quando o Patágoras pega o jogador;
 * - fechar ao resolver, emitindo SOLVED;
 * - fechar se a GameScene for encerrada.
 *
 * Eventos: ver `PUZZLE_EVENTS`.
 */
export class PuzzleSystem extends Phaser.Events.EventEmitter {
  private readonly gatilhos: PuzzleTrigger[] = []
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

  /** Enquanto true, a GameScene deve ignorar movimento e interação do jogador. */
  get aberto(): boolean {
    return this.abertoId !== null
  }

  adicionarGatilho(x: number, y: number, puzzleId: PuzzleId): PuzzleTrigger {
    const gatilho = new PuzzleTrigger(this.scene, x, y, puzzleId)
    this.gatilhos.push(gatilho)
    return gatilho
  }

  /** Atualiza qual gatilho está ao alcance do jogador. Chamar no `update` da cena. */
  update(): void {
    const proximo = this.aberto ? null : this.gatilhoMaisProximo()
    if (proximo === this.focado) return

    this.focado?.setFocado(false)
    proximo?.setFocado(true)
    this.focado = proximo
  }

  /** Abre o puzzle do gatilho em foco. Retorna false se não havia nenhum. */
  interagir(): boolean {
    if (!this.focado) return false
    this.abrir(this.focado.puzzleId)
    return true
  }

  abrir(puzzleId: PuzzleId): void {
    if (this.aberto) return

    this.abertoId = puzzleId
    this.config.jogador.setVelocity(0, 0)

    const dados: PuzzleSceneDados = {
      puzzleId,
      inventario: this.config.inventario,
      resolver: () => this.resolver(),
      fechar: () => this.fechar(PuzzleCloseReason.Jogador),
    }
    this.scene.scene.launch(PUZZLE_SCENE_KEY, dados)

    this.emit(PUZZLE_EVENTS.OPENED, puzzleId)
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
    this.focado = null
    this.removeAllListeners()
  }

  private resolver(): void {
    if (!this.abertoId) return

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
