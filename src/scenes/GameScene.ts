import Phaser from 'phaser'
import { MUNDO, PAREDES, SALAS, SPAWN } from '../mapa'
import { criarTexturaJogador, criarTexturaMadeira } from '../texturas'

const VELOCIDADE = 180

export class GameScene extends Phaser.Scene {
  private jogador!: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody
  private setas!: Phaser.Types.Input.Keyboard.CursorKeys

  constructor() {
    super('GameScene')
  }

  create(): void {
    criarTexturaMadeira(this)
    criarTexturaJogador(this)

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

    this.setas = this.input.keyboard!.createCursorKeys()

    // colisores visíveis com a tecla C — útil pra conferir se a planta bate com a arte
    this.physics.world.drawDebug = false
    this.input.keyboard!.on('keydown-C', () => {
      const mundo = this.physics.world
      mundo.drawDebug = !mundo.drawDebug
      if (!mundo.drawDebug) mundo.debugGraphic.clear()
    })

    this.add
      .text(8, 8, 'setas: mover   ·   C: colisores', {
        fontFamily: 'monospace',
        fontSize: '11px',
        color: '#9a9aae',
      })
      .setScrollFactor(0)
      .setDepth(100)
  }

  update(): void {
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
