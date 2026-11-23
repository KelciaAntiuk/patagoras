import Phaser from 'phaser'
import { Botao } from './botao'
import { montarPainel } from './painel'
import { CREDITOS } from './InicioScene'

import painel from './painel.png'
import btnReiniciar from './btn-reiniciar.png'
import btnReiniciarHover from './btn-reiniciar-hover.png'
import btnCreditos from './btn-creditos.png'
import btnCreditosHover from './btn-creditos-hover.png'

const TEXTURAS: Record<string, string> = {
  painel,
  'btn-reiniciar': btnReiniciar,
  'btn-reiniciar-hover': btnReiniciarHover,
  'btn-creditos': btnCreditos,
  'btn-creditos-hover': btnCreditosHover,
}

const ALTURA_BOTAO = 60
const VAO = 8

/**
 * Modal de vitória: aparece quando o jogador sai pela porta de saída.
 * Não tem botão de fechar: o jogador só pode jogar novamente ou ver os créditos.
 */
export class VitoriaScene extends Phaser.Scene {
  private conteudo: Phaser.GameObjects.GameObject[] = []
  private musicaVitoria?: Phaser.Sound.BaseSound

  constructor() {
    super('VitoriaScene')
  }

  preload(): void {
    for (const [chave, url] of Object.entries(TEXTURAS)) {
      if (!this.textures.exists(chave)) this.load.image(chave, url)
    }

    if (!this.cache.audio.exists('musica-vitoria')) {
      this.load.audio('musica-vitoria', 'assets/audio/voce_escapou.mp3')
    }
  }

  create(): void {
    for (const chave of Object.keys(TEXTURAS)) {
      this.textures.get(chave).setFilter(Phaser.Textures.FilterMode.NEAREST)
    }

    const { interior } = montarPainel(this, 'painel', 0.6)
    this.mostrarVitoria(interior)
    this.iniciarMusica()
  }

  private iniciarMusica(): void {
    if (!this.cache.audio.exists('musica-vitoria')) {
      return
    }

    this.musicaVitoria = this.sound.add('musica-vitoria', {
      loop: true,
      volume: 0.5,
    })

    const tocar = (): void => {
      if (this.musicaVitoria && !this.musicaVitoria.isPlaying) {
        this.musicaVitoria.play()
      }
    }

    if (this.sound.locked) {
      this.sound.once(Phaser.Sound.Events.UNLOCKED, tocar)
    } else {
      tocar()
    }

    this.events.once('shutdown', () => {
      this.sound.off(Phaser.Sound.Events.UNLOCKED, tocar)
      this.musicaVitoria?.stop()
      this.musicaVitoria?.destroy()
      this.musicaVitoria = undefined
    })
  }

  private limpar(): void {
    this.conteudo.forEach((o) => o.destroy())
    this.conteudo = []
  }

  private mostrarVitoria(interior: Phaser.Geom.Rectangle): void {
    this.limpar()

    const titulo = this.add
      .text(interior.centerX, interior.top + 2, 'ESCAPOU!', {
        fontFamily: 'LazyFox, monospace',
        fontSize: '33px',
        color: '#f4efe4',
      })
      .setOrigin(0.5, 0)
      .setStroke('#0b1219', 6)
      .setShadow(0, 0, '#000000', 10, true, true)

    const mensagem = this.add
      .text(interior.centerX, interior.top + 62, 'Você conseguiu fugir do Patágoras!', {
        fontFamily: '"Patrick Hand", Georgia, serif',
        fontSize: '20px',
        color: '#f4efe4',
        align: 'center',
        wordWrap: { width: interior.width - 16 },
      })
      .setOrigin(0.5, 0)

    const yUltimo = interior.bottom - ALTURA_BOTAO / 2
    const reiniciar = new Botao(
      this,
      interior.centerX,
      yUltimo - (ALTURA_BOTAO + VAO),
      'btn-reiniciar',
      () => this.jogarNovamente(),
    )
    const creditos = new Botao(this, interior.centerX, yUltimo, 'btn-creditos', () =>
      this.mostrarCreditos(interior),
    )

    this.conteudo.push(titulo, mensagem, reiniciar, creditos)
  }

  private mostrarCreditos(interior: Phaser.Geom.Rectangle): void {
    this.limpar()

    const texto = this.add
      .text(interior.centerX, interior.top + 2, CREDITOS.join('\n'), {
        fontFamily: '"Patrick Hand", Georgia, serif',
        fontSize: '16px',
        color: '#f4efe4',
        align: 'center',
        lineSpacing: 1,
      })
      .setOrigin(0.5, 0)

    const reiniciar = new Botao(
      this,
      interior.centerX,
      interior.bottom - ALTURA_BOTAO / 2,
      'btn-reiniciar',
      () => this.jogarNovamente(),
    )

    this.conteudo.push(texto, reiniciar)
  }

  private jogarNovamente(): void {
    this.scene.stop('GameScene')
    this.scene.start('GameScene', { abrirMenu: false })
  }
}
