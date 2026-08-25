import Phaser from 'phaser'
import { MUNDO, PAREDES, SALAS, SPAWN } from '../mapa'
import { createNumberItemTexture, createTestItemTexture, criarTexturaJogador, criarTexturaMadeira } from '../texturas'
import { InventorySystem } from '../system/Inventory/InventorySystem'
import type { ItemDefinition } from '../system/Inventory/Inventory.types'
import { TEST_ITEM } from '../system/Inventory/Item'
import { NUMBER_ITEM_THREE } from '../system/Inventory/NumberItem'
import { InventoryUI } from '../ui/Inventory/InventoryUI'

const VELOCIDADE = 180

const DROP_DIRECTIONS = [
  { x: 0, y: 1 },
  { x: 0, y: -1 },
  { x: 1, y: 0 },
  { x: -1, y: 0 },
  { x: 1, y: 1 },
  { x: -1, y: 1 },
  { x: 1, y: -1 },
  { x: -1, y: -1 },
]
const DROP_DISTANCES = [20, 32, 48, 64]

type WorldItem = Phaser.Types.Physics.Arcade.SpriteWithDynamicBody

export class GameScene extends Phaser.Scene {
  private jogador!: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody
  private setas!: Phaser.Types.Input.Keyboard.CursorKeys

  private inventory!: InventorySystem
  private pickupKey!: Phaser.Input.Keyboard.Key
  private dropKeys!: Phaser.Input.Keyboard.Key[]
  private worldItems: WorldItem[] = []
  private pickupHint!: Phaser.GameObjects.Text

  constructor() {
    super('GameScene')
  }

  create(): void {
    criarTexturaMadeira(this)
    criarTexturaJogador(this)
    createTestItemTexture(this)
    createNumberItemTexture(this, NUMBER_ITEM_THREE.value, NUMBER_ITEM_THREE.textureKey)

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
    this.pickupKey = this.input.keyboard!.addKey('E')
    this.dropKeys = [
      this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ONE),
      this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.TWO),
      this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.THREE),
    ]

    this.inventory = new InventorySystem(3)
    new InventoryUI(this, this.inventory, this.scale.width - 100, this.scale.height - 410)

    this.pickupHint = this.add
      .text(0, 0, 'E: Coletar', {
        fontFamily: 'monospace',
        fontSize: '12px',
        color: '#f2ece0',
      })
      .setOrigin(0.5)
      .setStroke('#1a1208', 4)
      .setDepth(11)
      .setVisible(false)

    this.spawnWorldItem(TEST_ITEM, 1, SPAWN.x + 70, SPAWN.y - 30)
    this.spawnWorldItem(NUMBER_ITEM_THREE, 1, 165, 800)

    // colisores visíveis com a tecla C — útil pra conferir se a planta bate com a arte
    this.physics.world.drawDebug = false
    this.input.keyboard!.on('keydown-C', () => {
      const mundo = this.physics.world
      mundo.drawDebug = !mundo.drawDebug
      if (!mundo.drawDebug) mundo.debugGraphic.clear()
    })

    this.add
      .text(8, 8, 'setas: mover   ·   E: coletar   ·   1/2/3: soltar   ·   C: colisores', {
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

    this.updatePickup()
    this.updateDropItems()
  }

  private updatePickup(): void {
    const nearbyItem = this.worldItems.find(
      (sprite) => sprite.active && this.physics.overlap(this.jogador, sprite),
    )

    this.pickupHint.setVisible(!!nearbyItem)
    if (!nearbyItem) return

    this.pickupHint.setPosition(nearbyItem.x, nearbyItem.y - 20)

    if (!Phaser.Input.Keyboard.JustDown(this.pickupKey)) return

    const item = nearbyItem.getData('item') as ItemDefinition
    const quantity = nearbyItem.getData('quantity') as number

    const collectedAll = this.inventory.add(item, quantity)
    if (collectedAll) {
      this.worldItems.splice(this.worldItems.indexOf(nearbyItem), 1)
      nearbyItem.destroy()
      this.pickupHint.setVisible(false)
    }
  }

  private updateDropItems(): void {
    this.dropKeys.forEach((key, index) => {
      if (Phaser.Input.Keyboard.JustDown(key)) this.dropSlot(index)
    })
  }

  private dropSlot(index: number): void {
    const removed = this.inventory.removeAll(index)
    if (!removed) return

    const { x, y } = this.findFreeDropSpot(this.itemFootprint(removed.item))
    this.spawnWorldItem(removed.item, removed.quantity, x, y)
  }

  private findFreeDropSpot(itemSize: number): { x: number; y: number } {
    for (const distance of DROP_DISTANCES) {
      for (const direction of DROP_DIRECTIONS) {
        const x = this.jogador.x + direction.x * distance
        const y = this.jogador.y + direction.y * distance
        if (!this.overlapsWall(x, y, itemSize)) return { x, y }
      }
    }

    return { x: this.jogador.x, y: this.jogador.y }
  }

  private overlapsWall(x: number, y: number, size: number): boolean {
    const half = size / 2
    return PAREDES.some(
      (p) => x + half > p.x && x - half < p.x + p.w && y + half > p.y && y - half < p.y + p.h,
    )
  }

  private itemFootprint(item: ItemDefinition): number {
    const frame = this.textures.getFrame(item.textureKey)
    return frame ? Math.max(frame.width, frame.height) : 24
  }

  private spawnWorldItem(item: ItemDefinition, quantity: number, x: number, y: number): WorldItem {
    const sprite = this.physics.add.sprite(x, y, item.textureKey)
    sprite.setDepth(6)
    sprite.setData('item', item)
    sprite.setData('quantity', quantity)
    this.worldItems.push(sprite)
    return sprite
  }
}
