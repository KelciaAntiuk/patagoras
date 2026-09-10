import Phaser from 'phaser'
import { Botao } from './botao'
import { montarPainel } from './painel'
import { alternanciaLiberada } from '../ui/atalhos'
// o Vite resolve os imports para as URLs finais e falha o build se algum sumir
import painelPausa from './painel-pausa.png'
import btnPausa from './btn-pausa.png'
import btnReiniciar from './btn-reiniciar.png'
import btnSair from './btn-sair.png'
import btnPausaHover from './btn-pausa-hover.png'
import btnReiniciarHover from './btn-reiniciar-hover.png'
import btnSairHover from './btn-sair-hover.png'

/** Menu de pausa: uma janela sobre o jogo, que continua visível atrás. */
export class MenuScene extends Phaser.Scene {
  private escape!: Phaser.Input.Keyboard.Key

  constructor() {
    super('MenuScene')
  }

  preload(): void {
    this.load.image('painel-pausa', painelPausa)
    this.load.image('btn-pausa', btnPausa)
    this.load.image('btn-reiniciar', btnReiniciar)
    this.load.image('btn-sair', btnSair)
    this.load.image('btn-pausa-hover', btnPausaHover)
    this.load.image('btn-reiniciar-hover', btnReiniciarHover)
    this.load.image('btn-sair-hover', btnSairHover)
  }

  create(): void {
    for (const chave of ['btn-pausa', 'btn-pausa-hover', 'btn-reiniciar', 'btn-reiniciar-hover', 'btn-sair', 'btn-sair-hover']) {
      this.textures.get(chave).setFilter(Phaser.Textures.FilterMode.NEAREST)
    }

    // escuridão leve: o jogo pausado continua legível atrás da janela
    const { interior } = montarPainel(this, 'painel-pausa', 0.45)

    this.add
      .text(interior.centerX, interior.top + 2, 'PAUSA', {
        fontFamily: 'LazyFox, monospace',
        fontSize: '33px', // 3x o corpo de desenho da fonte
        color: '#f4efe4',
      })
      .setOrigin(0.5, 0)
      .setStroke('#0b1219', 6)
      .setShadow(0, 0, '#000000', 10, true, true)

    // três botões de 220x60 empilhados no espaço que sobra abaixo do título
    const alturaBotao = 60
    const vao = 8
    const primeiro = interior.top + 44 + alturaBotao / 2
    const passo = alturaBotao + vao
    new Botao(this, interior.centerX, primeiro, 'btn-pausa', () => this.retomar())
    new Botao(this, interior.centerX, primeiro + passo, 'btn-reiniciar', () => this.reiniciar())
    new Botao(this, interior.centerX, primeiro + passo * 2, 'btn-sair', () => this.sair())

    // o menu abre com ESC ainda pressionado; sem o reset ele fecharia na hora
    this.escape = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ESC)
    this.escape.reset()
  }

  update(): void {
    if (!Phaser.Input.Keyboard.JustDown(this.escape)) return
    if (!alternanciaLiberada(this.game, 'esc')) return

    this.retomar()
  }

  private retomar(): void {
    this.scene.resume('GameScene')
    this.scene.stop()
  }

  private reiniciar(): void {
    this.scene.stop('GameScene')
    // start a partir do menu encerra o próprio menu e sobe o jogo do zero
    this.scene.start('GameScene', { abrirMenu: false })
  }

  private sair(): void {
    this.scene.stop('GameScene')
    // start a partir do menu encerra o próprio menu
    this.scene.start('InicioScene')
  }
}
