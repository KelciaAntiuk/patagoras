import { Puzzle } from '../Puzzle'
import type { NotaPuzzleDef } from '../Puzzle.types'
import { ESTILO_TEXTO } from './estilo'

export class NotaPuzzle extends Puzzle<NotaPuzzleDef> {
  montar(): void {
    const { cena, area } = this.ctx

    cena.add
      .text(area.centerX, area.top + 4, this.def.texto, {
        ...ESTILO_TEXTO,
        wordWrap: { width: area.width - 24 },
      })
      .setOrigin(0.5, 0)

    cena.add
      .text(area.centerX, area.bottom, 'Concluir leitura', {
        ...ESTILO_TEXTO,
        backgroundColor: '#2a1810',
        padding: { x: 12, y: 4 },
      })
      .setOrigin(0.5, 1)
      .setInteractive({ useHandCursor: true })
      .on('pointerup', () => this.ctx.resolver())
  }
}
