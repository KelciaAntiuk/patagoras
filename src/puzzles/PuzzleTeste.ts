import Phaser from 'phaser'
import { ItemKind } from '../system/Inventory/Inventory.types'
import type { ItemDefinition } from '../system/Inventory/Inventory.types'
import { Puzzle } from '../system/Puzzle/Puzzle'

const VALOR_CORRETO = 7

const ESTILO_TEXTO = {
  fontFamily: '"Patrick Hand", Georgia, serif',
  fontSize: '18px',
  color: '#f4efe4',
  align: 'center',
} as const

/**
 * Puzzle de exemplo para testar a base: um cadeado que só abre com o
 * Número 7 do inventário. Mostra como desenhar na área, reagir a itens
 * do inventário, consumir um item e resolver o puzzle.
 */
export class PuzzleTeste extends Puzzle {
  readonly titulo = 'Cadeado de teste'

  private visor!: Phaser.GameObjects.Text
  private mensagem!: Phaser.GameObjects.Text
  private resolvido = false

  montar(): void {
    const { cena, area } = this.ctx

    cena.add
      .text(area.centerX, area.top + 6, `Clique no item certo do inventário\npara destrancar o cadeado.`, ESTILO_TEXTO)
      .setOrigin(0.5, 0)

    const cadeado = cena.add.graphics()
    cadeado.lineStyle(8, 0xb8b8b8)
    cadeado.strokeEllipse(area.centerX, area.centerY + 4, 52, 60)
    cadeado.fillStyle(0xd8b46a)
    cadeado.fillRoundedRect(area.centerX - 44, area.centerY + 10, 88, 64, 8)
    cadeado.lineStyle(3, 0x5a4632)
    cadeado.strokeRoundedRect(area.centerX - 44, area.centerY + 10, 88, 64, 8)

    this.visor = cena.add
      .text(area.centerX, area.centerY + 42, '?', { ...ESTILO_TEXTO, fontSize: '34px', color: '#3b2a1a' })
      .setOrigin(0.5)

    this.mensagem = cena.add
      .text(area.centerX, area.bottom - 4, 'ESC ou X fecha. Se o Patágoras te pegar, fecha também!', {
        ...ESTILO_TEXTO,
        fontSize: '15px',
        color: '#c9b79c',
      })
      .setOrigin(0.5, 1)
  }

  aoSelecionarItem(item: ItemDefinition, indice: number): void {
    if (this.resolvido) return

    if (item.kind !== ItemKind.Number || item.value !== VALOR_CORRETO) {
      this.mensagem.setText(`"${item.name}" não serve aqui.`).setColor('#ff9f8a')
      this.ctx.cena.tweens.killTweensOf(this.visor)
      this.visor.setX(this.ctx.area.centerX)
      this.ctx.cena.tweens.add({ targets: this.visor, x: this.visor.x + 6, duration: 50, yoyo: true, repeat: 3 })
      return
    }

    this.resolvido = true
    this.ctx.inventario.removeAll(indice)
    this.visor.setText(String(item.value))
    this.mensagem.setText('Destrancado!').setColor('#9be59b')
    this.ctx.cena.time.delayedCall(700, () => this.ctx.resolver())
  }
}
