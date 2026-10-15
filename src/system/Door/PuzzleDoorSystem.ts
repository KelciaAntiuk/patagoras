import Phaser from 'phaser'
import type { PuzzleId } from '../../puzzles'
import type { InventorySystem } from '../Inventory/InventorySystem'
import { PUZZLE_EVENTS, PuzzleEstado } from '../Puzzle/Puzzle.types'
import type { PuzzleSystem } from '../Puzzle/PuzzleSystem'
import { PuzzleDoor } from './PuzzleDoor'
import { DOOR_EVENTS } from './PuzzleDoor.types'
import type { PuzzleDoorDefinition, PuzzleDoorSystemConfig } from './PuzzleDoor.types'

const RAIO_INTERACAO_PADRAO = 40

const DICA_TRANCADA = 'Trancada'
const DICA_INTERAGIR = '[E] Abrir'
const DICA_ABERTA = 'Aberta'

/**
 * Sistema que gerencia todas as portas de puzzle da cena.
 *
 * Responsabilidades:
 * - Registrar e armazenar as portas (`PuzzleDoor`)
 * - Verificar proximidade do jogador e mostrar dicas
 * - Escutar input de interação
 * - Integrar automaticamente com o `PuzzleSystem`:
 *   portas com condição `{ tipo: 'puzzle' }` são destrancadas
 *   quando o respectivo puzzle é resolvido.
 */
export class PuzzleDoorSystem extends Phaser.Events.EventEmitter {
  private readonly portas: PuzzleDoor[] = []
  private readonly colliders = new Map<PuzzleDoor, Phaser.Physics.Arcade.Collider>()
  private readonly puzzleMap = new Map<PuzzleId, PuzzleDoor>()

  private focada: PuzzleDoor | null = null
  private readonly raio: number

  private readonly jogador: Phaser.Physics.Arcade.Sprite
  private readonly inventario: InventorySystem
  private puzzleSystem?: PuzzleSystem

  constructor(
    private readonly scene: Phaser.Scene,
    config: PuzzleDoorSystemConfig,
  ) {
    super()
    this.jogador = config.jogador
    this.inventario = config.inventario
    this.raio = config.raioInteracao ?? RAIO_INTERACAO_PADRAO
    if (config.puzzles) {
      this.vincularPuzzleSystem(config.puzzles)
    }
  }

  // =========================================================================
  // Registro de portas
  // =========================================================================

  /**
   * Cria e registra uma porta a partir de uma definição declarativa.
   * Automaticamente cria o collider com o jogador e configura o
   * mapeamento puzzle→porta se a condição for do tipo `puzzle`.
   */
  adicionarPorta(def: PuzzleDoorDefinition): PuzzleDoor {
    const porta = new PuzzleDoor(this.scene, def)
    this.portas.push(porta)

    // Collider com o jogador
    const collider = porta.bindCollider(this.jogador)
    this.colliders.set(porta, collider)

    // Mapear puzzle → porta
    if (def.condicao.tipo === 'puzzle') {
      this.puzzleMap.set(def.condicao.puzzleId, porta)
    }

    // Re-emitir eventos da porta no nível do sistema
    porta.on(DOOR_EVENTS.UNLOCKED, (p: PuzzleDoor) => this.emit(DOOR_EVENTS.UNLOCKED, p))
    porta.on(DOOR_EVENTS.OPENED, (p: PuzzleDoor) => this.emit(DOOR_EVENTS.OPENED, p))
    porta.on(DOOR_EVENTS.CLOSED, (p: PuzzleDoor) => this.emit(DOOR_EVENTS.CLOSED, p))
    porta.on(DOOR_EVENTS.LOCKED_FEEDBACK, (p: PuzzleDoor) => this.emit(DOOR_EVENTS.LOCKED_FEEDBACK, p))

    // Quando a porta abre, destroi o collider (o jogador pode passar)
    porta.on(DOOR_EVENTS.OPENED, () => {
      const c = this.colliders.get(porta)
      if (c) {
        c.destroy()
        this.colliders.delete(porta)
      }
    })

    // Quando a porta fecha, recria o collider
    porta.on(DOOR_EVENTS.CLOSED, () => {
      if (!this.colliders.has(porta)) {
        const novoCollider = porta.bindCollider(this.jogador)
        this.colliders.set(porta, novoCollider)
      }
    })

    return porta
  }

  // =========================================================================
  // Integração com PuzzleSystem
  // =========================================================================

  /**
   * Conecta este sistema ao `PuzzleSystem` para que portas com condição
   * `{ tipo: 'puzzle', puzzleId }` sejam automaticamente destrancadas
   * quando o puzzle correspondente for resolvido.
   */
  vincularPuzzleSystem(puzzleSystem: PuzzleSystem): void {
    this.puzzleSystem = puzzleSystem
    puzzleSystem.on(PUZZLE_EVENTS.SOLVED, (puzzleId: PuzzleId) => {
      const porta = this.puzzleMap.get(puzzleId)
      if (porta && porta.isLocked) {
        porta.unlock()
      }
    })
  }

  // =========================================================================
  // Update (chamado todo frame)
  // =========================================================================

  update(): void {
    const proxima = this.puzzleSystem?.aberto ? null : this.portaMaisProxima()

    if (proxima === this.focada) return

    // Limpa dica anterior
    this.focada?.mostrarDica(null)

    // Mostra dica na porta próxima
    if (proxima) {
      if (proxima.isOpen) {
        proxima.mostrarDica(DICA_ABERTA)
      } else if (proxima.isLocked) {
        if (proxima.def.condicao.tipo === 'puzzle') {
          const estado = this.puzzleSystem?.estado(proxima.def.condicao.puzzleId)
          if (estado === PuzzleEstado.Bloqueado) {
            proxima.mostrarDica(proxima.def.mensagemTrancada ?? DICA_TRANCADA)
          } else {
            proxima.mostrarDica(proxima.def.mensagemTrancada ?? '[E] Investigar porta')
          }
        } else {
          proxima.mostrarDica(proxima.def.mensagemTrancada ?? DICA_TRANCADA)
        }
      } else {
        proxima.mostrarDica(DICA_INTERAGIR)
      }
    }

    this.focada = proxima
  }

  // =========================================================================
  // Interação (chamada quando o jogador aperta "E")
  // =========================================================================

  /**
   * Tenta interagir com a porta mais próxima.
   * Retorna `true` se houve interação (mesmo que a porta esteja trancada).
   */
  interagir(): boolean {
    if (!this.focada) return false
    this.focada.interact(this.inventario, this.puzzleSystem)
    return true
  }

  // =========================================================================
  // Consultas
  // =========================================================================

  /** Retorna a porta mais próxima do jogador dentro do raio de interação. */
  private portaMaisProxima(): PuzzleDoor | null {
    const { x, y } = this.jogador
    let melhor: PuzzleDoor | null = null
    let melhorDist = this.raio

    for (const porta of this.portas) {
      const bounds = porta.getBounds()
      const dist = Phaser.Math.Distance.Between(
        x,
        y,
        Phaser.Math.Clamp(x, bounds.left, bounds.right),
        Phaser.Math.Clamp(y, bounds.top, bounds.bottom),
      )
      if (dist <= this.raio && dist < melhorDist) {
        melhor = porta
        melhorDist = dist
      }
    }

    return melhor
  }

  /** Busca uma porta pelo seu id. */
  getPorta(id: string): PuzzleDoor | undefined {
    return this.portas.find((p) => p.id === id)
  }

  /** Busca a porta vinculada a um puzzleId. */
  getPortaPorPuzzle(puzzleId: PuzzleId): PuzzleDoor | undefined {
    return this.puzzleMap.get(puzzleId)
  }

  // =========================================================================
  // Cleanup
  // =========================================================================

  destroy(): void {
    this.colliders.forEach((c) => c.destroy())
    this.colliders.clear()
    this.portas.forEach((p) => p.destroy())
    this.portas.length = 0
    this.puzzleMap.clear()
    this.focada = null
    this.removeAllListeners()
  }
}

