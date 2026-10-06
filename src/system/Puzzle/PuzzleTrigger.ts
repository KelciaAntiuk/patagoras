import Phaser from 'phaser'
import type { PuzzleId } from '../../puzzles'

const TEXTURA = 'puzzle-gatilho'
const TAMANHO = 20

/** Ponto do mapa que abre um puzzle quando o jogador interage (E) perto dele. */
export class PuzzleTrigger {
  readonly sprite: Phaser.GameObjects.Image
  private readonly dica: Phaser.GameObjects.Text

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    readonly puzzleId: PuzzleId,
  ) {
    criarTextura(scene)

    this.sprite = scene.add.image(x, y, TEXTURA).setDepth(4)

    this.dica = scene.add
      .text(x, y - TAMANHO, '[E] Puzzle', {
        fontSize: '12px',
        color: '#ffffff',
        backgroundColor: '#000000aa',
        padding: { x: 4, y: 2 },
      })
      .setOrigin(0.5, 1)
      .setDepth(12)
      .setVisible(false)
  }

  setFocado(focado: boolean): void {
    this.dica.setVisible(focado)
  }

  destroy(): void {
    this.sprite.destroy()
    this.dica.destroy()
  }
}

function criarTextura(scene: Phaser.Scene): void {
  if (scene.textures.exists(TEXTURA)) return

  const g = scene.make.graphics({ x: 0, y: 0 }, false)
  g.fillStyle(0x8e44ad)
  g.fillRect(0, 0, TAMANHO, TAMANHO)
  g.lineStyle(2, 0xf5d76e)
  g.strokeRect(1, 1, TAMANHO - 2, TAMANHO - 2)
  g.generateTexture(TEXTURA, TAMANHO, TAMANHO)
  g.destroy()
}
