export const PATAGORAS_SPEED_MULTIPLIERS = [
    1.0,
    1.1,
    1.25,
    1.5,
] as const

export const PATAGORAS_CONFIG = {
    scale: 1,
    bodyWidth: 10,
    bodyHeight: 8,
    bodyOffsetX: 5,
    bodyOffsetY: 11,
    speed: 22.5,
    chaseSpeed: 30,
    errorSpeedMultipliers: PATAGORAS_SPEED_MULTIPLIERS,
    detectionRadius: 200,
    loseTargetRadius: 350,
    searchDurationMs: 5000,
    searchReachDistance: 16,
    wanderRadius: 450,
    wanderMinDistance: 120,
    wanderReachDistance: 16,
    playerReachabilityCheckMs: 500,
    hitCooldownMs: 1000,
    hitRecoveryMs: 5000,
    pathRecalculateMs: 250,
    waypointReachDistance: 4,
    pathfindingPadding: 0,
} as const

// CONFIGURAÇÃO DOS SONS DO PATÁGORAS (som por aproximação)
export const PATAGORAS_AUDIO_CONFIG = {
    // Distância (px) em que o som está no volume máximo
    minDistance: 32,
    // Distância (px) a partir da qual não se escuta mais nada
    maxDistance: 320,

    // Volume máximo de cada som (quando o pato está colado no jogador)
    stepsMaxVolume: 0.22,
    metalMaxVolume: 0.15,

    // Volume relativo do metal quando o pato está parado (0 a 1)
    metalIdleFactor: 0.4,

    // Limites da velocidade de reprodução dos passos
    // (1 = velocidade normal de patrulha, sem erros)
    stepsMinRate: 0.8,
    stepsMaxRate: 2,

    // Quanto o metal acelera/aumenta a cada nível de erro (0 = nada)
    metalRateBoost: 0.5,
    metalVolumeBoost: 0.4,

    // Intensidade máxima do som estéreo (esquerda/direita)
    maxPan: 0.6,

    // Velocidade mínima (px/s) para considerar que o pato está andando
    movingThreshold: 5,

    // Suavização das mudanças de volume (ms)
    smoothingMs: 120,
} as const