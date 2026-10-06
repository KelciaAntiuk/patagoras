import Phaser from 'phaser'
import { Botao } from '../../menu/botao'
import { alternanciaLiberada } from '../../ui/atalhos'
import { InventoryUI } from '../../ui/Inventory/InventoryUI'
import { PUZZLES } from '../../puzzles'
import type { PuzzleId } from '../../puzzles'
import type { InventorySystem } from '../Inventory/InventorySystem'
import type { Puzzle } from './Puzzle'

import painel from '../../menu/painel.png'
import btnX from '../../menu/btn-x.png'

export const PUZZLE_SCENE_KEY = 'PuzzleScene'

/** Mais claro que o menu de pausa: o jogador precisa enxergar o Patágoras chegando. */
const ESCURIDAO = 0.45

/** painel.png esticado em 9 partes: tamanho em pixels da textura (escala 2 na tela). */
const ESCALA = 2
const PAINEL_LARGURA = 280
const PAINEL_ALTURA = 190
const PAINEL_CANTO = 14
const BORDA = PAINEL_CANTO * ESCALA

const ALTURA_CABECALHO = 36
const ALTURA_INVENTARIO = 84

/** Dados que o `PuzzleSystem` passa ao abrir o modal. */
export interface PuzzleSceneDados {
  readonly puzzleId: PuzzleId
  readonly inventario: InventorySystem
  readonly resolver: () => void
  readonly fechar: () => void
}

/**
 * Modal genérico que hospeda qualquer puzzle.
 *
 * Roda por cima da GameScene **sem pausá-la** — é isso que permite o
 * Patágoras continuar perseguindo o jogador enquanto o puzzle está aberto.
 * Quem decide abrir/fechar é o `PuzzleSystem`; esta cena só desenha a
 * moldura, o inventário e repassa ESC/X para ele.
 */
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

    // Bloqueia cliques no que estiver atrás do modal.
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

    const puzzle: Puzzle = new PUZZLES[dados.puzzleId]({
      cena: this,
      area,
      inventario: dados.inventario,
      resolver: dados.resolver,
      fechar: dados.fechar,
    })

    this.criarCabecalho(interior, puzzle.titulo)
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
      .text(interior.centerX - inventario.getBounds().width / 2 - 14, y, 'Inventário', {
        fontFamily: '"Patrick Hand", Georgia, serif',
        fontSize: '18px',
        color: '#e8d9bf',
      })
      .setOrigin(1, 0.5)
  }
}
