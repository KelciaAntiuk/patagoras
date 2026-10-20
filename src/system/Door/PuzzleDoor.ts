import Phaser from 'phaser'
import type { InventorySystem } from '../Inventory/InventorySystem'
import type { PuzzleSystem } from '../Puzzle/PuzzleSystem'
import { DOOR_EVENTS } from './PuzzleDoor.types'
import type { PuzzleDoorDefinition, UnlockCondition, UnlockConditionFn } from './PuzzleDoor.types'

const COR_PADRAO = 0x6b4526
const COR_BORDA_PADRAO = 0x2f1d0e
const DEPTH_PADRAO = 5
const ZONA_INTERACAO_PADDING = 24

/**
 * Cria dinamicamente uma textura sólida com borda para a porta, caso não use imagem externa.
 */
function obterOuCriarTexturaPorta(
  scene: Phaser.Scene,
  largura: number,
  altura: number,
  cor: number,
  corBorda: number,
): string {
  const chave = `puzzle-door-${largura}x${altura}-${cor.toString(16)}-${corBorda.toString(16)}`
  if (scene.textures.exists(chave)) return chave

  const g = scene.make.graphics({ x: 0, y: 0 }, false)
  g.fillStyle(cor)
  g.fillRect(0, 0, largura, altura)
  g.lineStyle(2, corBorda)
  g.strokeRect(1, 1, largura - 2, altura - 2)
  g.generateTexture(chave, largura, altura)
  g.destroy()

  return chave
}

/**
 * Porta genérica de puzzle.
 * Classe base de porta para puzzles (`PuzzleDoor`).
 *
 * Gerencia dois estados internos:
 * - `isLocked` (padrão: `true`)  — impede a abertura
 * - `isOpen`   (padrão: `false`) — controla passagem/colisão
 * Estende `Phaser.Physics.Arcade.Sprite` para integrar-se naturalmente
 * com a física e o ciclo de vida de entidades do Phaser 3.
 *
 * A porta cria um `Phaser.GameObjects.Rectangle` com corpo estático de
 * Arcade Physics. Quando aberta, desabilita a colisão e torna o visual
 * semi‑transparente; quando fechada, reativa tudo.
 *
 * O mecanismo de desbloqueio é **injetável**: aceita callbacks, itens
 * do inventário ou puzzles resolvidos externamente.
 * Estados:
 * - `isLocked` (boolean, padrão: `true`): indica se a porta está trancada.
 * - `isOpen` (boolean, padrão: `false`): indica se a passagem está liberada.
 */
export class PuzzleDoor extends Phaser.Physics.Arcade.Sprite {
  // ---- Estados da porta ----
  private _isLocked = true
  private _isOpen = false

  // ---- objetos Phaser ----
  readonly interactionZone: Phaser.GameObjects.Zone

  // ---- dica flutuante ----
  private readonly dica: Phaser.GameObjects.Text

  // ---- condição de desbloqueio ----
  private unlockFn: UnlockConditionFn | null = null
  private readonly podeFechar: boolean

  constructor(
    scene: Phaser.Scene,
    readonly def: PuzzleDoorDefinition,
  ) {
    const textureKey =
      def.textureKey ??
      obterOuCriarTexturaPorta(
        scene,
        def.largura,
        def.altura,
        def.cor ?? COR_PADRAO,
        def.corBorda ?? COR_BORDA_PADRAO,
      )

    super(scene, def.x, def.y, textureKey)

    this.podeFechar = def.podeFechar ?? false

    // ---------- Visual e Física da Porta ----------
    const depth = def.depth ?? DEPTH_PADRAO
    scene.add.existing(this)
    scene.physics.add.existing(this, true /* isStatic */)

    this.setDepth(depth)
    this.setDisplaySize(def.largura, def.altura)

    const staticBody = this.body as Phaser.Physics.Arcade.StaticBody
    staticBody.setSize(def.largura, def.altura)
    staticBody.updateFromGameObject()

    // ---------- Zona de Interação ----------
    const zoneW = def.largura + ZONA_INTERACAO_PADDING * 2
    const zoneH = def.altura + ZONA_INTERACAO_PADDING * 2
    this.interactionZone = scene.add.zone(def.x, def.y, zoneW, zoneH)
    scene.physics.add.existing(this.interactionZone, true /* isStatic */)

    // ---------- Dica ----------
    this.dica = scene.add
      .text(def.x, def.y - def.altura / 2 - 8, '', {
        fontSize: '12px',
        color: '#ffffff',
        backgroundColor: '#000000aa',
        padding: { x: 4, y: 2 },
      })
      .setOrigin(0.5, 1)
      .setDepth(depth + 7)
      .setVisible(false)

    // ---------- Condição ----------
    this.setUnlockCondition(def.condicao)
  }

  // =========================================================================
  // Getters
  // =========================================================================

  get isLocked(): boolean {
    return this._isLocked
  }

  get isOpen(): boolean {
    return this._isOpen
  }

  get id(): string {
    return this.def.id
  }

  /** Atua como alias para manter compatibilidade com códigos que usavam `.sprite` */
  get sprite(): this {
    return this
  }

  // =========================================================================
  // Injeção de Condição para Destrancar
  // =========================================================================

  /**
   * Define dinamicamente a condição de desbloqueio da porta.
   * Suporta:
   * - Callback arbitrário (`UnlockConditionFn`)
   * - Identificador de item (`itemId`)
   * - Puzzle associado (`puzzleId`)
   */
  setUnlockCondition(condicao: UnlockCondition): void {
    switch (condicao.tipo) {
      case 'callback':
        this.unlockFn = condicao.fn
        break

      case 'item': {
        const itemId = condicao.itemId
        this.unlockFn = (inv) => inv.has(itemId)
        break
      }

      case 'puzzle':
        this.unlockFn = null
        break
    }
  }

  // =========================================================================
  // Verificação da condição
  // =========================================================================

  /**
   * Verifica se a condição de desbloqueio foi satisfeita com base no inventário.
   */
  checkUnlockCondition(inventario: InventorySystem): boolean {
    if (!this._isLocked) return true
    return this.unlockFn ? this.unlockFn(inventario) : false
  }

  // =========================================================================
  // Unlock / Lock
  // =========================================================================

  /**
   * Destranca a porta mudando `isLocked` para `false` e chamando `openDoor()`.
   */
  unlock(): void {
    if (!this._isLocked) return
    this._isLocked = false
    this.emit(DOOR_EVENTS.UNLOCKED, this)
    this.openDoor()
  }

  // =========================================================================
  // Lógica de Abertura e Fechamento
  // =========================================================================

  /**
   * Abre a porta:
   * - Física: Desabilita a colisão do corpo físico para permitir a passagem do jogador.
   * - Visual: Altera o frame/animação ou reduz a opacidade do sprite.
   */
  openDoor(): void {
    if (this._isOpen) return
    this._isOpen = true

    // Física: desabilita o corpo para o jogador atravessar
    const staticBody = this.body as Phaser.Physics.Arcade.StaticBody
    if (staticBody) {
      staticBody.enable = false
      staticBody.checkCollision.none = true
    }

    // Visual: toca animação, troca frame ou aplica transparência
    if (this.def.openAnimKey && this.anims) {
      this.play(this.def.openAnimKey)
    } else if (this.def.openFrame !== undefined) {
      this.setFrame(this.def.openFrame)
    } else {
      this.setAlpha(0.2)
    }

    this.emit(DOOR_EVENTS.OPENED, this)
  }

  /**
   * Fecha a porta:
   * - Física: Reativa a colisão como parede bloqueadora.
   * - Visual: Restaura o frame/animação original ou a opacidade total.
   */
  closeDoor(): void {
    if (!this._isOpen) return
    this._isOpen = false

    // Física: reativa colisão
    const staticBody = this.body as Phaser.Physics.Arcade.StaticBody
    if (staticBody) {
      staticBody.enable = true
      staticBody.checkCollision.none = false
    }

    // Visual: restaura
    if (this.def.closeAnimKey && this.anims) {
      this.play(this.def.closeAnimKey)
    } else if (this.def.closeFrame !== undefined) {
      this.setFrame(this.def.closeFrame)
    } else {
      this.setAlpha(1)
    }

    this.emit(DOOR_EVENTS.CLOSED, this)
  }

  // =========================================================================
  // Lógica de Interação
  // =========================================================================

  /**
   * Método genérico chamado quando o jogador aperta a tecla de interação na área da porta.
   *
   * Fluxo:
   * 1. Se a porta já estiver aberta e puder fechar, fecha-a.
   * 2. Se estiver trancada:
   *    - Se for um puzzle direto na porta, abre o puzzle scene no PuzzleSystem.
   *    - Se a condição de desbloqueio for atendida, chama unlock().
   *    - Caso contrário, emite feedback de "trancada".
   * 3. Se estiver destrancada mas fechada, abre a porta.
   */
  interact(inventario: InventorySystem, puzzleSystem?: PuzzleSystem): void {
    if (this._isOpen) {
      if (this.podeFechar) {
        this.closeDoor()
      }
      return
    }

    // Porta trancada → verificar condição
    if (this._isLocked) {
      // Se a porta estiver vinculada a um puzzle direto e o puzzleSystem foi fornecido:
      if (this.def.condicao.tipo === 'puzzle' && puzzleSystem) {
        const abriu = puzzleSystem.abrir(this.def.condicao.puzzleId)
        if (!abriu) {
          this.emit(DOOR_EVENTS.LOCKED_FEEDBACK, this)
        }
        return
      }

      if (this.checkUnlockCondition(inventario)) {
        this.unlock()
      } else {
        this.emit(DOOR_EVENTS.LOCKED_FEEDBACK, this)
      }
      return
    }

    // Porta destrancada mas fechada → abrir
    this.openDoor()
  }

  // =========================================================================
  // Feedback e Dica Visual
  // =========================================================================

  mostrarDica(texto: string | null): void {
    if (texto === null) {
      this.dica.setVisible(false)
      return
    }
    this.dica.setText(texto).setVisible(true)
  }

  // =========================================================================
  // Colisores e Limpeza
  // =========================================================================

  /**
   * Cria um Arcade Collider entre a porta e o ator informado.
   * Retorna o collider criado para que o chamador possa destruí‑lo
   * quando necessário.
   */
  bindCollider(actor: Phaser.Physics.Arcade.Sprite): Phaser.Physics.Arcade.Collider {
    return this.scene.physics.add.collider(actor, this)
  }

  override destroy(fromScene?: boolean): void {
    this.dica.destroy()
    this.removeAllListeners()
    this.interactionZone.destroy()
    super.destroy(fromScene)
  }
}