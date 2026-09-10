import Phaser from 'phaser'
import { Botao } from './botao'
import { criarTitulo } from './titulo'
import { montarPainel, agruparJanela } from './painel'
import type { Janela } from './painel'
// o Vite resolve os imports para as URLs finais e falha o build se algum sumir
import fundoMenu from './backgroundMenuInicial.png'
import btnStart from './btn-start.png'
import btnCreditos from './btn-creditos.png'
import btnStartHover from './btn-start-hover.png'
import btnCreditosHover from './btn-creditos-hover.png'
import painel from './painel.png'
import btnX from './btn-x.png'

const DICA = 'Dica: Explore, resolva puzzles e fuja do Pato. Erros de cálculo aumentam o perigo.'

const CREDITOS = [
  'O TEOREMA DE PATÁGORAS',
  '',
  'Criado por',
  'Leticia Parpineli',
  'Kélcia Kohls',
  'Enrique Zoz',
  'Mateus Zeviani',
  'Luiz Henrique',
  'Julian Alves',
]

/** Tela de abertura: começar o jogo ou ver os créditos. */
export class InicioScene extends Phaser.Scene {
  private painel!: Janela

  constructor() {
    super('InicioScene')
  }

  preload(): void {
    this.load.image('menu-fundo', fundoMenu)
    this.load.image('btn-start', btnStart)
    this.load.image('btn-creditos', btnCreditos)
    this.load.image('btn-start-hover', btnStartHover)
    this.load.image('btn-creditos-hover', btnCreditosHover)
    this.load.image('painel', painel)
    this.load.image('btn-x', btnX)
  }

  create(): void {
    const L = this.scale.width
    const A = this.scale.height

    for (const chave of ['btn-start', 'btn-start-hover', 'btn-creditos', 'btn-creditos-hover', 'painel', 'btn-x']) {
      this.textures.get(chave).setFilter(Phaser.Textures.FilterMode.NEAREST)
    }

    // a arte é 1024x555 e o viewport 800x450: escala para cobrir e centraliza
    const fundo = this.add.image(L / 2, A / 2, 'menu-fundo')
    fundo.setScale(Math.max(L / fundo.width, A / fundo.height))
    this.add.rectangle(0, 0, L, A, 0x05080c, 0.25).setOrigin(0)

    criarTitulo(this, L)

    new Botao(this, L / 2, 250, 'btn-start', () => this.comecar())
    new Botao(this, L / 2, 318, 'btn-creditos', () => this.painel.mostrar(true))

    const barra = this.add.graphics()
    barra.fillStyle(0x0d1218, 0.88)
    barra.fillRoundedRect(L / 2 - 310, A - 52, 620, 32, 6)
    barra.lineStyle(2, 0x415264, 0.9)
    barra.strokeRoundedRect(L / 2 - 310, A - 52, 620, 32, 6)
    this.add
      .text(L / 2, A - 36, DICA, {
        fontFamily: '"Patrick Hand", Georgia, serif',
        fontSize: '16px',
        color: '#dbe6f0',
      })
      .setOrigin(0.5)

    this.criarPainel()
  }

  /** Painel de créditos: a moldura do pack, com os botões de check e X. */
  private criarPainel(): void {
    const { fundo, moldura, interior } = montarPainel(this, 'painel')

    // ancorado no topo do interior: o texto cresce para baixo e nunca alcança
    // o botão, que fica preso ao rodapé
    const texto = this.add
      .text(interior.centerX, interior.top + 8, CREDITOS.join('\n'), {
        fontFamily: '"Patrick Hand", Georgia, serif',
        fontSize: '18px',
        color: '#f4efe4',
        align: 'center',
        lineSpacing: 2,
      })
      .setOrigin(0.5, 0)

    const fechar = (): void => {
      this.painel.mostrar(false)
    }
    const x = new Botao(this, interior.right - 14, interior.top + 14, 'btn-x', fechar)

    this.painel = agruparJanela(this, { fundo, moldura, interior }, [texto, x])
  }

  private comecar(): void {
    this.scene.start('GameScene')
  }
}
