import Phaser from 'phaser'

/**
 * Título "O TEOREMA DE PATÁGORAS" em LazyFox Pixel, compartilhado pela tela de
 * início e pela de pausa.
 *
 * A fonte não traz glifos acentuados (o "Á" cairia numa fonte lisa de fallback),
 * então escrevemos sem acento e desenhamos o agudo em pixel, na mesma grade.
 */

const CORPO = 66 // múltiplo de 11px, o corpo de desenho da fonte

export function criarTitulo(cena: Phaser.Scene, L: number, y1 = 56, y2 = 134): void {
  const unidade = CORPO / 11 // 1 pixel de arte da fonte
  const estilo = {
    fontFamily: 'LazyFox, monospace',
    fontSize: `${CORPO}px`,
    color: '#f4efe4',
  }

  // halo preto borrado atrás de cada letra, para o título se separar da arte
  const sombra = (t: Phaser.GameObjects.Text): Phaser.GameObjects.Text =>
    t.setStroke('#0b1219', 8).setShadow(0, 0, '#000000', 14, true, true)

  sombra(cena.add.text(L / 2, y1, 'O TEOREMA', estilo).setOrigin(0.5))

  const linha = sombra(cena.add.text(L / 2, y2, 'DE PATAGORAS', estilo).setOrigin(0.5))

  // mede o pedaço antes do "A" para saber onde o acento cai
  const regua = cena.add.text(0, 0, 'DE PAT', estilo).setVisible(false)
  const larguraA = cena.add.text(0, 0, 'A', estilo).setVisible(false)
  const xA = linha.x - linha.width / 2 + regua.width + larguraA.width / 2
  const yTopo = linha.y - linha.height / 2
  regua.destroy()
  larguraA.destroy()

  // agudo: dois blocos em escada. Cada bloco ganha um contorno de 1 unidade,
  // do mesmo jeito que o stroke envolve as letras.
  const blocos = [
    { x: xA + unidade, y: yTopo, w: unidade * 2, h: unidade },
    { x: xA - unidade, y: yTopo + unidade, w: unidade * 2, h: unidade },
  ]
  const acento = cena.add.graphics()
  // Graphics não borra, então o halo do acento é aproximado em camadas —
  // o suficiente para casar com o shadowBlur das letras ao lado
  for (let i = 5; i >= 1; i--) {
    acento.fillStyle(0x000000, 0.1)
    for (const b of blocos) {
      acento.fillRect(b.x - unidade * i, b.y - unidade * i, b.w + unidade * i * 2, b.h + unidade * i * 2)
    }
  }
  acento.fillStyle(0x0b1219, 1)
  for (const b of blocos) {
    acento.fillRect(b.x - unidade, b.y - unidade, b.w + unidade * 2, b.h + unidade * 2)
  }
  acento.fillStyle(0xf4efe4, 1)
  for (const b of blocos) acento.fillRect(b.x, b.y, b.w, b.h)
}
