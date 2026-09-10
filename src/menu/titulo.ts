import Phaser from 'phaser'

const CORPO = 66

export function criarTitulo(cena: Phaser.Scene, L: number, y1 = 56, y2 = 134): void {
  const unidade = CORPO / 11
  const estilo = {
    fontFamily: 'LazyFox, monospace',
    fontSize: `${CORPO}px`,
    color: '#f4efe4',
  }

  const sombra = (t: Phaser.GameObjects.Text): Phaser.GameObjects.Text =>
    t.setStroke('#0b1219', 8).setShadow(0, 0, '#000000', 14, true, true)

  sombra(cena.add.text(L / 2, y1, 'O TEOREMA', estilo).setOrigin(0.5))

  const linha = sombra(cena.add.text(L / 2, y2, 'DE PATAGORAS', estilo).setOrigin(0.5))

  const regua = cena.add.text(0, 0, 'DE PAT', estilo).setVisible(false)
  const larguraA = cena.add.text(0, 0, 'A', estilo).setVisible(false)
  const xA = linha.x - linha.width / 2 + regua.width + larguraA.width / 2
  const yTopo = linha.y - linha.height / 2
  regua.destroy()
  larguraA.destroy()

  const blocos = [
    { x: xA + unidade, y: yTopo, w: unidade * 2, h: unidade },
    { x: xA - unidade, y: yTopo + unidade, w: unidade * 2, h: unidade },
  ]

  const contorno = 4
  const acento = cena.add.graphics()
  acento.fillStyle(0x0b1219, 1)
  for (const b of blocos) {
    acento.fillRect(b.x - contorno, b.y - contorno, b.w + contorno * 2, b.h + contorno * 2)
  }
  acento.fillStyle(0xf4efe4, 1)
  for (const b of blocos) acento.fillRect(b.x, b.y, b.w, b.h)
}
