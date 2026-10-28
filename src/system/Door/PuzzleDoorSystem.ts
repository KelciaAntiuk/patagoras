import Phaser from 'phaser'
import { PLAYER_CONFIG } from '../../characters/Player/Player.config'
import type { PuzzleId } from '../../puzzles'
import type { WorldRect } from '../Collision/Collision.types'
import { getActorCenter, hasLineOfSight } from '../Collision/LineOfSight'
import type { InventorySystem } from '../Inventory/InventorySystem'
import { PUZZLE_EVENTS, PuzzleEstado } from '../Puzzle/Puzzle.types'
import type { PuzzleSystem } from '../Puzzle/PuzzleSystem'
import { PuzzleDoor } from './PuzzleDoor'
import { DOOR_EVENTS } from './PuzzleDoor.types'
import type { PuzzleDoorDefinition, PuzzleDoorSystemConfig } from './PuzzleDoor.types'

const RAIO_INTERACAO_PADRAO = PLAYER_CONFIG.interactionRadius

const DICA_TRANCADA = 'Trancada'
const DICA_INTERAGIR = '[E] Abrir'
const DICA_ABERTA = 'Aberta'

export class PuzzleDoorSystem extends Phaser.Events.EventEmitter {
  private readonly portas: PuzzleDoor[] = []
  private readonly colliders = new Map<PuzzleDoor, Phaser.Physics.Arcade.Collider[]>()
  // Suporta múltiplas portas associadas ao mesmo puzzleId
  private readonly puzzleMap = new Map<PuzzleId, PuzzleDoor[]>()

  private focada: PuzzleDoor | null = null
  private readonly raio: number

  private readonly jogador: Phaser.Physics.Arcade.Sprite
  private readonly atoresColisao: Phaser.Physics.Arcade.Sprite[]
  private readonly inventario: InventorySystem
  private readonly getObstacles?: () => readonly WorldRect[]
  private puzzleSystem?: PuzzleSystem

  constructor(
    private readonly scene: Phaser.Scene,
    config: PuzzleDoorSystemConfig,
  ) {
    super()
    this.jogador = config.jogador
    this.atoresColisao = [
      config.jogador,
      ...(config.atoresColisao ?? []),
    ]
    this.inventario = config.inventario
    this.raio = config.raioInteracao ?? RAIO_INTERACAO_PADRAO
    this.getObstacles = config.getObstacles
    if (config.puzzles) {
      this.vincularPuzzleSystem(config.puzzles)
    }
  }

  adicionarPorta(def: PuzzleDoorDefinition): PuzzleDoor {
    const porta = new PuzzleDoor(this.scene, def)
    this.portas.push(porta)

    this.colliders.set(
      porta,
      this.atoresColisao.map((ator) => porta.bindCollider(ator)),
    )

    if (def.condicao.tipo === 'puzzle') {
      const lista = this.puzzleMap.get(def.condicao.puzzleId) ?? []
      lista.push(porta)
      this.puzzleMap.set(def.condicao.puzzleId, lista)
    }

    porta.on(DOOR_EVENTS.UNLOCKED, (p: PuzzleDoor) => this.emit(DOOR_EVENTS.UNLOCKED, p))
    porta.on(DOOR_EVENTS.OPENED, (p: PuzzleDoor) => this.emit(DOOR_EVENTS.OPENED, p))
    porta.on(DOOR_EVENTS.CLOSED, (p: PuzzleDoor) => this.emit(DOOR_EVENTS.CLOSED, p))
    porta.on(DOOR_EVENTS.LOCKED_FEEDBACK, (p: PuzzleDoor) => this.emit(DOOR_EVENTS.LOCKED_FEEDBACK, p))

    porta.on(DOOR_EVENTS.OPENED, () => {
      const lista = this.colliders.get(porta)
      if (lista) {
        lista.forEach((c) => c.destroy())
        this.colliders.delete(porta)
      }
    })

    porta.on(DOOR_EVENTS.CLOSED, () => {
      if (!this.colliders.has(porta)) {
        this.colliders.set(
          porta,
          this.atoresColisao.map((ator) => porta.bindCollider(ator)),
        )
      }
    })

    return porta
  }

  vincularPuzzleSystem(puzzleSystem: PuzzleSystem): void {
    this.puzzleSystem = puzzleSystem
    puzzleSystem.on(PUZZLE_EVENTS.SOLVED, (puzzleId: PuzzleId) => {
      const portas = this.puzzleMap.get(puzzleId)
      if (portas) {
        portas.forEach((porta) => {
          if (porta.isLocked) {
            porta.unlock()
          }
        })
      }
    })
  }

  getClosedDoorRects(): WorldRect[] {
    const rects: WorldRect[] = []
    for (const porta of this.portas) {
      if (!porta.isOpen) {
        rects.push(this.getDoorRect(porta))
      }
    }
    return rects
  }

  update(): void {
    const proxima = this.puzzleSystem?.aberto ? null : this.portaMaisProxima()

    if (proxima === this.focada) return

    this.focada?.mostrarDica(null)

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

  interagir(): boolean {
    this.update()
    if (!this.focada) return false
    if (this.focada.isOpen && !this.focada.def.podeFechar) {
      return false
    }
    this.focada.interact(this.inventario, this.puzzleSystem)
    return true
  }

  private getDoorRect(porta: PuzzleDoor): WorldRect {
    return {
      x: porta.def.x - porta.def.largura / 2,
      y: porta.def.y - porta.def.altura / 2,
      width: porta.def.largura,
      height: porta.def.altura,
    }
  }

  private portaMaisProxima(): PuzzleDoor | null {
    const { x, y } = getActorCenter(this.jogador)
    const obstacles = this.getObstacles ? this.getObstacles() : []
    let melhor: PuzzleDoor | null = null
    let melhorDist = this.raio

    for (const porta of this.portas) {
      const doorRect = this.getDoorRect(porta)
      const targetX = Phaser.Math.Clamp(x, doorRect.x, doorRect.x + doorRect.width)
      const targetY = Phaser.Math.Clamp(y, doorRect.y, doorRect.y + doorRect.height)
      const dist = Phaser.Math.Distance.Between(x, y, targetX, targetY)

      if (
        dist <= this.raio &&
        dist < melhorDist &&
        hasLineOfSight(x, y, targetX, targetY, obstacles, doorRect)
      ) {
        melhor = porta
        melhorDist = dist
      }
    }

    return melhor
  }

  getPorta(id: string): PuzzleDoor | undefined {
    return this.portas.find((p) => p.id === id)
  }

  getPortaPorPuzzle(puzzleId: PuzzleId): PuzzleDoor | undefined {
    return this.puzzleMap.get(puzzleId)?.[0]
  }

  destroy(): void {
    this.colliders.forEach((lista) => lista.forEach((c) => c.destroy()))
    this.colliders.clear()
    this.portas.forEach((p) => p.destroy())
    this.portas.length = 0
    this.puzzleMap.clear()
    this.focada = null
    this.removeAllListeners()
  }
}
