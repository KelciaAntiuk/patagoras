import Phaser from 'phaser'
import { GameScene } from './scenes/GameScene'

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game',
  backgroundColor: '#0b0b10',
  pixelArt: true,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 800,
    height: 450,
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 }, // top-down: sem gravidade
      debug: true, // cria o gráfico de debug; o desenho fica desligado até apertar C
    },
  },
  scene: [GameScene],
}

const jogo = new Phaser.Game(config)

// no dev, `window.jogo` dá acesso ao jogo pelo console do navegador
if (import.meta.env.DEV) {
  ;(window as unknown as { jogo: Phaser.Game }).jogo = jogo
}
