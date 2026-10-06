import Phaser from 'phaser'
import { Botao } from '../../menu/botao'
import { alternanciaLiberada } from '../../ui/atalhos'
import { InventoryUI } from '../../ui/Inventory/InventoryUI'
import type { Puzzle } from './Puzzle'
import type { PuzzleContexto, PuzzleDefinicao } from './Puzzle.types'
import { criarPuzzle } from './tipos'
import { ESTILO_TEXTO } from './tipos/estilo'

import painel from '../../menu/painel.png'
import btnX from '../../menu/btn-x.png'

export const PUZZLE_SCENE_KEY = 'PuzzleScene'

const ESCURIDAO = 0.45

const ESCALA = 2
const PAINEL_LARGURA = 280
const PAINEL_ALTURA = 190
const PAINEL_CANTO = 14
const BORDA = PAINEL_CANTO * ESCALA

const ALTURA_CABECALHO = 36
const ALTURA_INVENTARIO = 84

export type PuzzleSceneDados = Omit<PuzzleContexto, 'cena' | 'area'> & {
  readonly definicao: PuzzleDefinicao
}

// Não pausa a GameScene: o Patágoras precisa continuar andando com o puzzle aberto.
export class PuzzleScene extends Phaser.Scene {
  private dados!: PuzzleSceneDados
  private escape!: Phaser.Input.Keyboard.Key

  constructor() {
    super(PUZZLE_SCENE_KEY)
  }

  preload(): void {
    this.load.image('painel', painel)
    this.load.image('btn-x', btnX)
  }

  create(dados: PuzzleSceneDados): void {
    this.dados = dados
    this.textures.get('painel').setFilter(Phaser.Textures.FilterMode.NEAREST)
    this.textures.get('btn-x').setFilter(Phaser.Textures.FilterMode.NEAREST)

    const L = this.scale.width
    const A = this.scale.height

    this.add.rectangle(0, 0, L, A, 0x05080c, ESCURIDAO).setOrigin(0).setInteractive()

    const moldura = this.add
      .nineslice(L / 2, A / 2, 'painel', undefined, PAINEL_LARGURA, PAINEL_ALTURA, PAINEL_CANTO, PAINEL_CANTO, PAINEL_CANTO, PAINEL_CANTO)
      .setScale(ESCALA)

    const interior = new Phaser.Geom.Rectangle(
      moldura.x - moldura.displayWidth / 2 + BORDA,
      moldura.y - moldura.displayHeight / 2 + BORDA,
      moldura.displayWidth - BORDA * 2,
      moldura.displayHeight - BORDA * 2,
    )

    const area = new Phaser.Geom.Rectangle(
      interior.x,
      interior.y + ALTURA_CABECALHO,
      interior.width,
      interior.height - ALTURA_CABECALHO - ALTURA_INVENTARIO - 12,
    )

    const { definicao, ...contexto } = dados
    const puzzle = criarPuzzle({ ...contexto, cena: this, area }, definicao)

    this.criarCabecalho(interior, definicao.titulo)
    this.criarInventario(interior, puzzle)

    this.escape = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ESC)
    this.escape.reset()

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => puzzle.desmontar())

    puzzle.montar()
  }

  update(): void {
    if (!Phaser.Input.Keyboard.JustDown(this.escape)) return
    if (!alternanciaLiberada(this.game, 'esc')) return

    this.dados.fechar()
  }

  private criarCabecalho(interior: Phaser.Geom.Rectangle, titulo: string): void {
    this.add
      .text(interior.centerX, interior.top + 2, titulo.toUpperCase(), {
        fontFamily: 'LazyFox, monospace',
        fontSize: '26px',
        color: '#f4efe4',
      })
      .setOrigin(0.5, 0)
      .setStroke('#0b1219', 5)

    new Botao(this, interior.right - 10, interior.top + 10, 'btn-x', () => this.dados.fechar())
  }

  private criarInventario(interior: Phaser.Geom.Rectangle, puzzle: Puzzle): void {
    const y = interior.bottom - ALTURA_INVENTARIO / 2

    const linha = this.add.graphics()
    linha.lineStyle(2, 0x2a1810, 0.8)
    linha.lineBetween(interior.left + 8, y - ALTURA_INVENTARIO / 2 - 6, interior.right - 8, y - ALTURA_INVENTARIO / 2 - 6)

    const inventario = new InventoryUI(this, this.dados.inventario, interior.centerX, y, (item, indice) =>
      puzzle.aoSelecionarItem(item, indice),
    )

    this.add
      .text(interior.centerX - inventario.getBounds().width / 2 - 14, y, 'Inventário', { ...ESTILO_TEXTO, color: '#e8d9bf' })
      .setOrigin(1, 0.5)
  }
}
