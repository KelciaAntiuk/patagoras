import Phaser from 'phaser'

/**
 * Botão do menu. O rótulo vem desenhado no próprio sprite (Pixel UI pack),
 * então aqui não há texto — só a imagem, o realce e o clique.
 *
 * É uma Image, não um Container: com Container é preciso montar o `hitArea` na
 * mão, e o retângulo não coincidia com o desenho (ficava alguns pixels deslocado,
 * matando as bordas de baixo e da direita). Numa Image o Phaser deriva a área
 * clicável do próprio frame, já considerando origem e escala.
 *
 * Também não escalamos nos eventos: encolher o botão no `pointerdown` tirava a
 * borda de baixo do cursor, o `pointerout` disparava e o clique se perdia.
 *
 * O hover usa o sprite do estilo 2 do pack, quando existe (`<chave>-hover`).
 * O pressionado é escurecido por tint: o estilo 3 do pack não é derivável dos
 * outros — os três são desenhados à mão, não trocas de paleta —, então na
 * largura de 110px teria de ser redesenhado.
 */

/** Pixel art precisa de escala inteira, senão os pixels ficam irregulares. */
const ESCALA = 2
const REALCE = 0xdff5db
const PRESSIONADO = 0x9cba96

export class Botao extends Phaser.GameObjects.Image {
  private pressionando = false
  private readonly chaveHover: string | null

  constructor(cena: Phaser.Scene, x: number, y: number, chave: string, aoClicar: () => void) {
    super(cena, x, y, chave)
    this.setScale(ESCALA)
    this.setInteractive({ useHandCursor: true })

    const hover = `${chave}-hover`
    this.chaveHover = cena.textures.exists(hover) ? hover : null

    this.on('pointerover', () => this.realcar())
    this.on('pointerout', () => {
      this.pressionando = false
      this.setTexture(chave)
      this.clearTint()
    })
    this.on('pointerdown', () => {
      this.pressionando = true
      this.realcar()
      this.setTint(PRESSIONADO)
    })
    this.on('pointerup', () => {
      if (!this.pressionando) return
      this.pressionando = false
      this.clearTint()
      this.realcar()
      aoClicar()
    })

    cena.add.existing(this)
  }

  /** Sprite de hover do pack quando existe; senão, um tint claro. */
  private realcar(): void {
    if (this.chaveHover) this.setTexture(this.chaveHover)
    else this.setTint(REALCE)
  }
}
