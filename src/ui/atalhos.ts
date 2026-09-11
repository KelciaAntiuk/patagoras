import Phaser from 'phaser'

export function alternanciaLiberada(jogo: Phaser.Game, chave: string, ms = 300): boolean {
  const ultimo = (jogo.registry.get(chave) as number | undefined) ?? 0
  const agora = performance.now()
  if (agora - ultimo < ms) return false
  jogo.registry.set(chave, agora)
  return true
}
