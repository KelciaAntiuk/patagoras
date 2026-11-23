import Phaser from 'phaser'

import type {
    Patagoras,
} from './Patagoras'

import {
    PATAGORAS_AUDIO_CONFIG,
    PATAGORAS_CONFIG,
} from './Patagoras.config'

import {
    PatagorasState,
} from './Patagoras.types'

export const PATAGORAS_AUDIO_KEYS = {
    steps: 'patagoras-passos',
    metal: 'patagoras-metal',
} as const

// Os sons do Phaser (WebAudio / HTML5) têm volume, rate e pan,
// mas o tipo BaseSound não expõe esses setters.
type SomControlavel =
    Phaser.Sound.BaseSound & {
        setVolume(value: number): unknown
        setRate(value: number): unknown
        setPan?: (value: number) => unknown
    }

/**
 * Controla os sons do Patágoras:
 * - passos: tocam só enquanto ele anda, e aceleram junto com
 *   a velocidade real dele (patrulha, perseguição e erros do jogador);
 * - metal rangendo: loop contínuo, mais intenso a cada erro.
 *
 * Ambos usam volume por aproximação (perto = alto, longe = baixo)
 * e um leve efeito estéreo (esquerda/direita).
 */
export class PatagorasAudio {

    private readonly steps?: SomControlavel

    private readonly metal?: SomControlavel

    private stepsVolume = 0

    private metalVolume = 0

    private readonly onPause = (): void => {
        this.pauseAll()
    }

    private readonly onResume = (): void => {
        this.resumeAll()
    }

    constructor(
        private readonly scene: Phaser.Scene,
        private readonly patagoras: Patagoras,
    ) {
        const cache = scene.cache.audio

        if (cache.exists(PATAGORAS_AUDIO_KEYS.steps)) {
            this.steps = scene.sound.add(
                PATAGORAS_AUDIO_KEYS.steps,
                { loop: true, volume: 0 },
            ) as SomControlavel
        }

        if (cache.exists(PATAGORAS_AUDIO_KEYS.metal)) {
            this.metal = scene.sound.add(
                PATAGORAS_AUDIO_KEYS.metal,
                { loop: true, volume: 0 },
            ) as SomControlavel
        }

        scene.events.on('pause', this.onPause)
        scene.events.on('resume', this.onResume)
    }

    public update(
        listenerX: number,
        listenerY: number,
        deltaMs: number,
    ): void {
        if (this.scene.sound.locked) {
            return
        }

        const cfg = PATAGORAS_AUDIO_CONFIG

        const px = this.patagoras.getBodyCenterX()
        const py = this.patagoras.getBodyCenterY()

        // ---- APROXIMAÇÃO ----
        const distance =
            Phaser.Math.Distance.Between(
                listenerX,
                listenerY,
                px,
                py,
            )

        const t = Phaser.Math.Clamp(
            (distance - cfg.minDistance) /
            (cfg.maxDistance - cfg.minDistance),
            0,
            1,
        )

        // Curva quadrática: o som cresce mais rápido quando ele chega perto
        const proximity = (1 - t) * (1 - t)

        const pan = Phaser.Math.Clamp(
            ((px - listenerX) / cfg.maxDistance) * cfg.maxPan,
            -cfg.maxPan,
            cfg.maxPan,
        )

        // ---- VELOCIDADE REAL DO PATO ----
        const body = this.patagoras.sprite.body
        const speed = body
            ? Math.hypot(body.velocity.x, body.velocity.y)
            : 0

        const stunned =
            this.patagoras.getState() === PatagorasState.Stunned

        const moving =
            !stunned &&
            speed > cfg.movingThreshold

        // Multiplicador vindo dos erros do jogador (1.0 / 1.1 / 1.25 / 1.5)
        const errorBoost =
            this.patagoras.getSpeedMultiplier() - 1

        // Suavização independente do FPS
        const alpha =
            1 - Math.exp(-deltaMs / cfg.smoothingMs)

        // ---- PASSOS ----
        if (this.steps) {
            // Ritmo proporcional à velocidade real:
            // patrulha = 1x, perseguição ≈ 1.33x, e ainda multiplicado pelos erros.
            const rate = Phaser.Math.Clamp(
                speed / PATAGORAS_CONFIG.speed,
                cfg.stepsMinRate,
                cfg.stepsMaxRate,
            )

            const target = moving
                ? cfg.stepsMaxVolume * proximity
                : 0

            this.stepsVolume +=
                (target - this.stepsVolume) * alpha

            this.steps.setRate(rate)
            this.steps.setVolume(this.stepsVolume)
            this.steps.setPan?.(pan)

            if (moving) {
                this.play(this.steps)
            } else if (
                this.steps.isPlaying &&
                this.stepsVolume < 0.01
            ) {
                // Pausa só depois do fade-out, pra não cortar seco
                this.steps.pause()
            }
        }

        // ---- METAL RANGENDO ----
        if (this.metal) {
            const rate =
                1 + errorBoost * cfg.metalRateBoost

            const intensity =
                (moving ? 1 : cfg.metalIdleFactor) *
                (1 + errorBoost * cfg.metalVolumeBoost)

            const target = Math.min(
                1,
                cfg.metalMaxVolume * proximity * intensity,
            )

            this.metalVolume +=
                (target - this.metalVolume) * alpha

            this.metal.setRate(rate)
            this.metal.setVolume(this.metalVolume)
            this.metal.setPan?.(pan)

            this.play(this.metal)
        }
    }

    private play(
        sound: SomControlavel,
    ): void {
        if (sound.isPaused) {
            sound.resume()
        } else if (!sound.isPlaying) {
            sound.play()
        }
    }

    private pauseAll(): void {
        if (this.steps?.isPlaying) {
            this.steps.pause()
        }

        if (this.metal?.isPlaying) {
            this.metal.pause()
        }
    }

    private resumeAll(): void {
        // Só o metal volta direto; os passos voltam
        // no próximo update se o pato estiver andando.
        if (this.metal?.isPaused) {
            this.metal.resume()
        }
    }

    public destroy(): void {
        this.scene.events.off('pause', this.onPause)
        this.scene.events.off('resume', this.onResume)

        this.steps?.stop()
        this.steps?.destroy()

        this.metal?.stop()
        this.metal?.destroy()
    }
}
