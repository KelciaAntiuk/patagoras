import Phaser from 'phaser'
import { MUNDO, PAREDES, SALAS, SPAWN } from '../mapa'
import { alternanciaLiberada } from '../ui/atalhos'
// o Vite resolve os imports para as URLs finais e falha o build se algum sumir
import madeira from '../arte/madeira.png'
import jogador from '../arte/jogador.png'

const VELOCIDADE = 180

export class GameScene extends Phaser.Scene {
  private jogador!: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody
  private setas!: Phaser.Types.Input.Keyboard.CursorKeys
  private escape!: Phaser.Input.Keyboard.Key
  private teclaC!: Phaser.Input.Keyboard.Key

  constructor() {
    super('GameScene')
  }

  preload(): void {
    this.load.image('madeira', madeira)
    this.load.image('jogador', jogador)
  }

  create(dados?: { abrirMenu?: boolean }): void {
    this.physics.world.setBounds(0, 0, MUNDO.largura, MUNDO.altura)
    this.cameras.main.setBounds(0, 0, MUNDO.largura, MUNDO.altura)

    // piso
    this.add.tileSprite(0, 0, MUNDO.largura, MUNDO.altura, 'madeira').setOrigin(0, 0)

    // paredes: retângulos pretos, cada um com corpo estático
    const paredes = PAREDES.map((p) => {
      const r = this.add.rectangle(p.x + p.w / 2, p.y + p.h / 2, p.w, p.h, 0x000000)
      this.physics.add.existing(r, true)
      return r
    })

    // nomes das salas, desenhados no mundo (rolam junto com a câmera)
    for (const sala of SALAS) {
      this.add
        .text(sala.x, sala.y, sala.nome.toUpperCase(), {
          fontFamily: 'Georgia, "Times New Roman", serif',
          fontSize: '20px',
          color: '#f2ece0',
        })
        .setOrigin(0.5)
        .setStroke('#1a1208', 5)
        .setDepth(5)
    }

    this.jogador = this.physics.add.sprite(SPAWN.x, SPAWN.y, 'jogador')
    this.jogador.setCollideWorldBounds(true)
    this.jogador.setDepth(10)
    // corpo só nos pés: deixa as portas mais generosas e dá a sensação de profundidade
    this.jogador.body.setSize(14, 12)
    this.jogador.body.setOffset(3, 15)

    this.physics.add.collider(this.jogador, paredes)

    this.cameras.main.startFollow(this.jogador, true, 0.12, 0.12)

    const teclado = this.input.keyboard!
    this.setas = teclado.createCursorKeys()
    this.escape = teclado.addKey(Phaser.Input.Keyboard.KeyCodes.ESC)
    this.teclaC = teclado.addKey(Phaser.Input.Keyboard.KeyCodes.C)

    this.physics.world.drawDebug = false

    this.add
      .text(8, 8, 'setas: mover   ·   ESC: menu   ·   C: colisores', {
        fontFamily: 'monospace',
        fontSize: '11px',
        color: '#9a9aae',
      })
      .setScrollFactor(0)
      .setDepth(100)

    // quem abre o menu é o ESC; a entrada no jogo vem da tela de início
    if (dados?.abrirMenu === true) this.abrirMenu()
  }

  private abrirMenu(): void {
    if (this.scene.isActive('MenuScene')) return
    this.escape.reset()
    this.scene.launch('MenuScene')
    this.scene.pause()
  }

  update(): void {
    if (Phaser.Input.Keyboard.JustDown(this.escape) && alternanciaLiberada(this.game, 'esc')) {
      this.abrirMenu()
      return
    }

    if (Phaser.Input.Keyboard.JustDown(this.teclaC) && alternanciaLiberada(this.game, 'colisores')) {
      const mundo = this.physics.world
      mundo.drawDebug = !mundo.drawDebug
      if (!mundo.drawDebug) mundo.debugGraphic.clear()
    }

    let x = 0
    let y = 0

    if (this.setas.left.isDown) x -= 1
    if (this.setas.right.isDown) x += 1
    if (this.setas.up.isDown) y -= 1
    if (this.setas.down.isDown) y += 1

    // normaliza para a diagonal não ficar mais rápida que a reta
    const direcao = new Phaser.Math.Vector2(x, y).normalize().scale(VELOCIDADE)
    this.jogador.setVelocity(direcao.x, direcao.y)
  }
}
