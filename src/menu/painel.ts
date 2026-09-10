import Phaser from 'phaser'
import { Botao } from './botao'

/**
 * Moldura do Pixel UI pack usada como janela.
 *
 * `montarPainel` devolve o retângulo interno já em coordenadas de tela, para o
 * conteúdo ser ancorado por medida em vez de por número chutado — foi assim que
 * o botão de fechar acabou por cima do texto dos créditos.
 */

/** 14px de borda na arte, exibidos em x2. */
const BORDA = 28
const ESCALA = 2

export type Moldura = {
  fundo: Phaser.GameObjects.Rectangle
  moldura: Phaser.GameObjects.Image
  interior: Phaser.Geom.Rectangle
}

export type Janela = {
  container: Phaser.GameObjects.Container
  mostrar: (visivel: boolean) => void
  visivel: () => boolean
}

export function montarPainel(cena: Phaser.Scene, chave: string, escuridao = 0.82): Moldura {
  const L = cena.scale.width
  const A = cena.scale.height
  cena.textures.get(chave).setFilter(Phaser.Textures.FilterMode.NEAREST)

  // além de escurecer, engole os cliques dos elementos atrás
  const fundo = cena.add.rectangle(0, 0, L, A, 0x05080c, escuridao).setOrigin(0)
  fundo.setInteractive()

  const moldura = cena.add.image(L / 2, A / 2, chave).setScale(ESCALA)

  const interior = new Phaser.Geom.Rectangle(
    moldura.x - moldura.displayWidth / 2 + BORDA,
    moldura.y - moldura.displayHeight / 2 + BORDA,
    moldura.displayWidth - BORDA * 2,
    moldura.displayHeight - BORDA * 2,
  )

  return { fundo, moldura, interior }
}

/**
 * Agrupa a moldura e o conteúdo numa janela que pode ser aberta e fechada.
 *
 * O hit test do Phaser NÃO herda a visibilidade do container pai: só esconder o
 * container deixava o escurecimento — que ocupa a tela toda — continuar
 * roubando os cliques dos botões atrás. Por isso o input é ligado e desligado
 * junto com a visibilidade.
 */
export function agruparJanela(
  cena: Phaser.Scene,
  base: Moldura,
  extras: Phaser.GameObjects.GameObject[],
): Janela {
  const container = cena.add.container(0, 0, [base.fundo, base.moldura, ...extras]).setDepth(50)

  // o escurecimento e os botões, não só o primeiro: com a janela fechada eles
  // continuariam recebendo clique, roubando dos botões da tela atrás
  const clicaveis: Phaser.GameObjects.GameObject[] = [
    base.fundo,
    ...extras.filter((o) => o instanceof Botao),
  ]

  const mostrar = (visivel: boolean): void => {
    container.setVisible(visivel)
    for (const o of clicaveis) {
      if (visivel) o.setInteractive()
      else o.disableInteractive()
    }
  }

  mostrar(false)
  return { container, mostrar, visivel: () => container.visible }
}
