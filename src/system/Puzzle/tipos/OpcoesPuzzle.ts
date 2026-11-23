import Phaser from 'phaser'
import { Puzzle } from '../Puzzle'
import type { OpcoesPuzzleDef } from '../Puzzle.types'
import { ESTILO_TEXTO } from './estilo'

const ATRASO_RESULTADO = 600
const ESPACO_BOTOES = 18

export class OpcoesPuzzle extends Puzzle<OpcoesPuzzleDef> {
  private grupo!: Phaser.GameObjects.Container
  private mensagem!: Phaser.GameObjects.Text
  private travado = false

  montar(): void {
    const { cena, area } = this.ctx

    cena.add
      .text(area.centerX, area.top + 2, this.def.enunciado, {
        ...ESTILO_TEXTO,
        fontSize: '17px',
        wordWrap: { width: area.width - 20 },
      })
      .setOrigin(0.5, 0)

    this.grupo = cena.add.container(area.centerX, area.bottom - 54)

    const larguraBotao = 76
    const passo = larguraBotao + ESPACO_BOTOES
    const inicio = (-(this.def.opcoes.length - 1) * passo) / 2

    this.def.opcoes.forEach((opcao, i) => {
      const x = inicio + i * passo

      const botao = cena.add
        .text(x, 0, opcao, {
          ...ESTILO_TEXTO,
          fontSize: '20px',
          backgroundColor: '#2a1810',
          padding: { x: 18, y: 8 },
        })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true })

      botao.on('pointerover', () => {
        if (!this.travado) botao.setStyle({ backgroundColor: '#46281b' })
      })

      botao.on('pointerout', () => {
        if (!this.travado) botao.setStyle({ backgroundColor: '#2a1810' })
      })

      botao.on('pointerup', () => {
        if (!this.travado) this.escolher(opcao, botao)
      })

      this.grupo.add(botao)
    })

    this.mensagem = cena.add
      .text(area.centerX, area.bottom, 'Clique na resposta correta (não usa itens do inventário).', {
        ...ESTILO_TEXTO,
        fontSize: '15px',
        color: '#c9b79c',
      })
      .setOrigin(0.5, 1)
  }

  private escolher(opcao: string, botao: Phaser.GameObjects.Text): void {
    this.travado = true

    if (opcao === this.def.respostaCorreta) {
      botao.setStyle({ backgroundColor: '#1f4d2b' })
      this.mensagem.setText('Correto!').setColor('#9be59b')
      this.ctx.cena.time.delayedCall(ATRASO_RESULTADO, () => {
        this.ctx.resolver()
      })
      return
    }

    this.ctx.errar()
    botao.setStyle({ backgroundColor: '#5c1f1f' })
    this.mensagem.setText('Resposta errada! O Patágoras acelerou.').setColor('#ff9f8a')
    this.ctx.cena.tweens.add({
      targets: this.grupo,
      x: this.grupo.x + 6,
      duration: 50,
      yoyo: true,
      repeat: 3,
    })

    this.ctx.cena.time.delayedCall(ATRASO_RESULTADO, () => {
      botao.setStyle({ backgroundColor: '#2a1810' })
      this.travado = false
    })
  }
}
