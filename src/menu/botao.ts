import Phaser from 'phaser'

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

  private realcar(): void {
    if (this.chaveHover) this.setTexture(this.chaveHover)
    else this.setTint(REALCE)
  }
}
