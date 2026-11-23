export const FOOD_THROW_CONFIG = {
    maxRange: 100,
    projectileSpeed: 360,
    // Menor que o corpo do jogador (10x8): onde ele passa, a comida também passa
    projectileHitbox: 6,
    playerSlowMultiplier: 0.45,
    patagorasSleepMs: 5000,
} as const
