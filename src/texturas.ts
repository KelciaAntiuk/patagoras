import Phaser from 'phaser'

/**
 * Texturas geradas em runtime, para o projeto rodar sem depender de nenhum
 * arquivo de arte ainda. Quando os sprites reais chegarem, é só trocar por
 * `this.load.image(...)` no `preload` e apagar isto.
 */

const TONS_MADEIRA = [0x8a5a2b, 0x7d4f26, 0x96633a, 0x724625, 0x9c6b3f]
const LARGURAS_TABUA = [22, 30, 18, 26, 32]

export function criarTexturaMadeira(cena: Phaser.Scene, chave = 'madeira'): void {
  const lado = 128
  const g = cena.add.graphics()

  let x = 0
  let i = 0
  while (x < lado) {
    const largura = LARGURAS_TABUA[i % LARGURAS_TABUA.length]
    g.fillStyle(TONS_MADEIRA[i % TONS_MADEIRA.length], 1)
    g.fillRect(x, 0, largura, lado)
    g.lineStyle(1, 0x5f3a1c, 0.45)
    g.lineBetween(x + largura, 0, x + largura, lado)
    x += largura
    i++
  }

  // emenda horizontal, para as tábuas não parecerem infinitas
  g.lineStyle(2, 0x4d2f19, 0.45)
  g.lineBetween(0, 64, lado, 64)

  g.generateTexture(chave, lado, lado)
  g.destroy()
}

export function createTestItemTexture(scene: Phaser.Scene, key = 'test-item-icon'): void {
  const g = scene.add.graphics()

  g.fillStyle(0x6fd1e6, 1)
  g.fillCircle(12, 12, 9)
  g.fillStyle(0xd7f6ff, 1)
  g.fillCircle(9, 9, 3)
  g.lineStyle(2, 0x2a7a8c, 1)
  g.strokeCircle(12, 12, 9)

  g.generateTexture(key, 24, 24)
  g.destroy()
}

export function createNumberItemTexture(scene: Phaser.Scene, value: number, key: string): void {
  const size = 24
  const canvasTexture = scene.textures.createCanvas(key, size, size)!
  const ctx = canvasTexture.getContext()
  const radius = 4

  ctx.beginPath()
  ctx.moveTo(radius, 0)
  ctx.arcTo(size, 0, size, size, radius)
  ctx.arcTo(size, size, 0, size, radius)
  ctx.arcTo(0, size, 0, 0, radius)
  ctx.arcTo(0, 0, size, 0, radius)
  ctx.closePath()
  ctx.fillStyle = '#f2ece0'
  ctx.fill()
  ctx.lineWidth = 2
  ctx.strokeStyle = '#2f2f3a'
  ctx.stroke()

  ctx.fillStyle = '#1a1208'
  ctx.font = 'bold 14px monospace'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(String(value), size / 2, size / 2 + 1)

  canvasTexture.refresh()
}

export function criarTexturaJogador(cena: Phaser.Scene, chave = 'jogador'): void {
  const g = cena.add.graphics()

  g.fillStyle(0x1b1b22, 1)
  g.fillRect(2, 9, 16, 15) // casaco
  g.fillStyle(0xe8c9a0, 1)
  g.fillRect(5, 2, 10, 8) // rosto
  g.fillStyle(0x3a2a1c, 1)
  g.fillRect(5, 0, 10, 4) // cabelo
  g.fillStyle(0x2f2f3a, 1)
  g.fillRect(3, 24, 5, 4) // pé esquerdo
  g.fillRect(12, 24, 5, 4) // pé direito

  g.generateTexture(chave, 20, 28)
  g.destroy()
}
