import Phaser from 'phaser'
import { alternanciaLiberada } from '../ui/atalhos'

const PLAYER_SPEED = 180
const WORLD_WIDTH = 2400
const WORLD_HEIGHT = 1800

export class GameScene extends Phaser.Scene {
    private player!: Phaser.Physics.Arcade.Sprite
    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys
    private upKey!: Phaser.Input.Keyboard.Key
    private leftKey!: Phaser.Input.Keyboard.Key
    private downKey!: Phaser.Input.Keyboard.Key
    private rightKey!: Phaser.Input.Keyboard.Key
    private escape!: Phaser.Input.Keyboard.Key

    constructor() {
        super('GameScene')
    }

    create(dados?: { abrirMenu?: boolean }): void {
        this.createTestMap()

        // Cria uma textura temporária para representar o personagem
        const graphics = this.make.graphics({ x: 0, y: 0 })

        graphics.fillStyle(0x3498db)
        graphics.fillRect(0, 0, 40, 40)
        graphics.generateTexture('player', 40, 40)
        graphics.destroy()

        // Cria o personagem com física
        this.player = this.physics.add.sprite(400, 300, 'player')

        // this.cameras.main.startFollow(this.player)

        this.cameras.main.startFollow(
            this.player,
            true,
            0.01,
            0.01,
        )

        // Captura as setas do teclado
        this.cursors = this.input.keyboard!.createCursorKeys()

        // Define a movimentação com WASD além das setas
        this.upKey = this.input.keyboard!.addKey(
            Phaser.Input.Keyboard.KeyCodes.W,
        )

        this.leftKey = this.input.keyboard!.addKey(
            Phaser.Input.Keyboard.KeyCodes.A,
        )

        this.downKey = this.input.keyboard!.addKey(
            Phaser.Input.Keyboard.KeyCodes.S,
        )

        this.rightKey = this.input.keyboard!.addKey(
            Phaser.Input.Keyboard.KeyCodes.D,
        )

        this.escape = this.input.keyboard!.addKey(
            Phaser.Input.Keyboard.KeyCodes.ESC,
        )

        // quem abre a pausa é o ESC; a entrada no jogo vem da tela de início
        if (dados?.abrirMenu === true) this.abrirMenu()
    }

    private abrirMenu(): void {
        if (this.scene.isActive('MenuScene')) return

        // o menu abre com ESC ainda pressionado; sem o reset ele fecharia na hora
        this.escape.reset()

        this.scene.launch('MenuScene')
        this.scene.pause()
    }

    update(): void {
        if (
            Phaser.Input.Keyboard.JustDown(this.escape) &&
            alternanciaLiberada(this.game, 'esc')
        ) {
            this.abrirMenu()
            return
        }

        const left = this.cursors.left.isDown || this.leftKey.isDown
        const right = this.cursors.right.isDown || this.rightKey.isDown
        const up = this.cursors.up.isDown || this.upKey.isDown
        const down = this.cursors.down.isDown || this.downKey.isDown

        const x = Number(right) - Number(left)
        const y = Number(down) - Number(up)

        const direction = new Phaser.Math.Vector2(x, y)

        // Evita que a diagonal fique mais rápida
        if (direction.length() > 0) {
            direction.normalize()
        }

        this.player.setVelocity(
            direction.x * PLAYER_SPEED,
            direction.y * PLAYER_SPEED,
        )
    }

    private createTestMap(): void {
        const tileSize = 300

        const colors = [
            0x4f6d7a,
            0x6b705c,
            0x8a6d5c,
            0x495867,
            0x706677,
            0x567568,
        ]

        let index = 0

        for (let y = 0; y < WORLD_HEIGHT; y += tileSize) {
            for (let x = 0; x < WORLD_WIDTH; x += tileSize) {
                const color = colors[index % colors.length]

                this.add
                    .rectangle(
                        x + tileSize / 2,
                        y + tileSize / 2,
                        tileSize,
                        tileSize,
                        color,
                    )
                    .setStrokeStyle(3, 0xffffff, 0.25)

                this.add.text(
                    x + 15,
                    y + 15,
                    `${x}, ${y}`,
                    {
                        fontSize: '20px',
                        color: '#ffffff',
                    },
                )

                index++
            }
        }
    }
}