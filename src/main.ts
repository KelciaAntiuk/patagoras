import Phaser from 'phaser'
import { GameScene } from './scenes/GameScene'
import { MenuScene } from './menu/MenuScene'
import { InicioScene } from './menu/InicioScene'
import fonteTitulo from './menu/LazyFoxPixel.ttf'

async function carregarFontes(): Promise<void> {
  if (!('fonts' in document)) return
  const pixel = new FontFace('LazyFox', `url(${fonteTitulo})`)
  const carregando = Promise.all([
    pixel.load().then((f) => {
      document.fonts.add(f)
    }),
    document.fonts.load('400 25px "Patrick Hand"'),
  ]).then(() => undefined)

  const limite = new Promise<void>((resolver) => setTimeout(resolver, 2500))
  await Promise.race([carregando, limite]).catch(() => undefined)
}

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game',
  backgroundColor: '#131c24',
  roundPixels: true,
  scale: {

    mode: Phaser.Scale.ENVELOP,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 800,
    height: 450,
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: true,
    },
  },
  scene: [InicioScene, GameScene, MenuScene],
}

await carregarFontes()

const jogo = new Phaser.Game(config)

if (import.meta.env.DEV) {
  ;(window as unknown as { jogo: Phaser.Game }).jogo = jogo
}
