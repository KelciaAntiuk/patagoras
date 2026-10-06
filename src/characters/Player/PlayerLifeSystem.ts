import Phaser from 'phaser'

import {
    PLAYER_CONFIG,
} from '../Player/Player.config'

import {
    PLAYER_LIFE_EVENTS,
} from '../Player/Player.events'

export class PlayerLifeSystem
    extends Phaser.Events.EventEmitter {

    private lives: number =
        PLAYER_CONFIG.maxLives

    public getLives(): number {
        return this.lives
    }

    public getMaxLives(): number {
        return PLAYER_CONFIG.maxLives
    }

    public isGameOver(): boolean {
        return this.lives <= 0
    }

    public takeDamage(
        amount = 1,
    ): boolean {

        if (
            amount <= 0 ||
            this.isGameOver()
        ) {
            return false
        }

        this.lives =
            Math.max(
                0,
                this.lives - amount,
            )

        this.emit(
            PLAYER_LIFE_EVENTS.CHANGED,
            this.lives,
            this.getMaxLives(),
        )

        if (this.isGameOver()) {
            this.emit(
                PLAYER_LIFE_EVENTS.GAME_OVER,
            )
        }

        return true
    }

    public reset(): void {
        this.lives =
            PLAYER_CONFIG.maxLives

        this.emit(
            PLAYER_LIFE_EVENTS.CHANGED,
            this.lives,
            this.getMaxLives(),
        )
    }

    public destroy(): void {
        this.removeAllListeners()
    }
}
