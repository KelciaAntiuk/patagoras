import Phaser from 'phaser'

/**
 * O evento `keydown-` do Phaser volta a disparar a cada frame enquanto a tecla
 * segue pressionada, e ESC ainda é disputado por duas cenas (o jogo abre o menu,
 * o menu fecha a si mesmo). Sem este guarda, um único toque alterna dezenas de
 * vezes e o estado final vira loteria.
 */
export function alternanciaLiberada(jogo: Phaser.Game, chave: string, ms = 300): boolean {
  const ultimo = (jogo.registry.get(chave) as number | undefined) ?? 0
  const agora = performance.now()
  if (agora - ultimo < ms) return false
  jogo.registry.set(chave, agora)
  return true
}
