import Phaser from 'phaser'
import type { ItemDefinition } from '../../Inventory/Inventory.types'
import { InventorySlotUI, SLOT_SIZE } from '../../../ui/Inventory/InventorySlotUI'
import { Puzzle } from '../Puzzle'
import { itemAtende } from '../Puzzle.types'
import type { SlotsPuzzleDef } from '../Puzzle.types'
import { ESTILO_TEXTO } from './estilo'

const ESPACO_SLOTS = 28
const ATRASO_RESULTADO = 600

export class SlotsPuzzle extends Puzzle<SlotsPuzzleDef> {
  private colocados: (ItemDefinition | null)[] = []
  private views: InventorySlotUI[] = []
  private grupo!: Phaser.GameObjects.Container
  private mensagem!: Phaser.GameObjects.Text
  private travado = false
  private resolvido = false

  montar(): void {
    const { cena, area } = this.ctx
    this.colocados = this.def.slots.map(() => null)

    cena.add
      .text(area.centerX, area.top + 4, this.def.enunciado, {
        ...ESTILO_TEXTO,
        wordWrap: { width: area.width - 24 },
      })
      .setOrigin(0.5, 0)

    this.grupo = cena.add.container(area.centerX, area.bottom - 58)
    const passo = SLOT_SIZE + ESPACO_SLOTS
    const inicio = (-(this.def.slots.length - 1) * passo) / 2

    this.views = this.def.slots.map((slot, i) => {
      const x = inicio + i * passo
      const view = new InventorySlotUI(cena, x, 0, () => !this.travado && this.devolver(i))
      this.grupo.add(view)

      if (slot.rotulo) {
        this.grupo.add(cena.add.text(x - SLOT_SIZE / 2 - 6, 0, slot.rotulo, ESTILO_TEXTO).setOrigin(1, 0.5))
      }
      return view
    })

    this.mensagem = cena.add
      .text(area.centerX, area.bottom, 'Clique nos itens do inventário para colocá-los.', {
        ...ESTILO_TEXTO,
        fontSize: '15px',
        color: '#c9b79c',
      })
      .setOrigin(0.5, 1)
  }

  aoSelecionarItem(item: ItemDefinition, indice: number): void {
    const vazio = this.colocados.indexOf(null)
    if (this.travado || vazio === -1) return

    this.ctx.inventario.removeAll(indice)
    this.colocar(vazio, item)

    if (!this.colocados.includes(null)) this.verificar()
  }

  desmontar(): void {
    if (this.resolvido) return
    this.colocados.forEach((item) => item && this.ctx.inventario.add(item))
  }

  private verificar(): void {
    this.travado = true
    const correto = this.colocados.every((item, i) => item && itemAtende(item, this.def.slots[i].resposta))

    if (correto) {
      this.mostrarMensagem('Correto!', '#9be59b')
      this.ctx.cena.time.delayedCall(ATRASO_RESULTADO, () => {
        this.resolvido = true
        this.ctx.resolver()
      })
      return
    }

    this.ctx.errar()
    this.mostrarMensagem('Resposta errada.', '#ff9f8a')
    this.ctx.cena.tweens.add({ targets: this.grupo, x: this.grupo.x + 6, duration: 50, yoyo: true, repeat: 3 })
    this.ctx.cena.time.delayedCall(ATRASO_RESULTADO, () => {
      this.devolverTodos()
      this.travado = false
    })
  }

  private colocar(indice: number, item: ItemDefinition | null): void {
    this.colocados[indice] = item
    this.views[indice].setSlot(item)
  }

  private devolver(indice: number): void {
    const item = this.colocados[indice]
    if (!item || !this.ctx.inventario.add(item)) return
    this.colocar(indice, null)
  }

  private devolverTodos(): void {
    this.colocados.forEach((_, i) => this.devolver(i))
  }

  private mostrarMensagem(texto: string, cor: string): void {
    this.mensagem.setText(texto).setColor(cor)
  }
}
