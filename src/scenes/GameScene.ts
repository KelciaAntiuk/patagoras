import Phaser from 'phaser'

import {
    CollisionSystem,
} from '../system/Collision/CollisionSystem'

import {
    COLLISION_EVENTS,
    PickupMode,
} from '../system/Collision/Collision.types'

import type {
    WorldRect,
} from '../system/Collision/Collision.types'

import type {
    Pickup,
} from '../system/Collision/Pickup'

import {
    INVENTORY_EVENTS,
    ItemKind,
} from '../system/Inventory/Inventory.types'

import type {
    InventorySlot,
    ItemDefinition,
} from '../system/Inventory/Inventory.types'

import {
    InventorySystem,
} from '../system/Inventory/InventorySystem'

const PLAYER_SPEED = 180

const WORLD_WIDTH = 2400
const WORLD_HEIGHT = 1800

const PICKUP_RADIUS = 90

const TEST_ITEMS:
    readonly ItemDefinition[] = [
        {
            id: 'rusty-key',
            name: 'Chave enferrujada',
            description:
                'Uma chave velha encontrada no chão.',
            textureKey:
                'test-item-key',
            kind:
                ItemKind.Generic,
        },
        {
            id: 'strange-note',
            name: 'Bilhete estranho',
            description:
                'Um bilhete com anotações incompletas.',
            textureKey:
                'test-item-note',
            kind:
                ItemKind.Generic,
        },
        {
            id: 'battery',
            name: 'Pilha',
            description:
                'Talvez ainda tenha alguma carga.',
            textureKey:
                'test-item-battery',
            kind:
                ItemKind.Generic,
        },
        {
            id: 'food-can',
            name: 'Lata de comida',
            description:
                'Uma lata fechada encontrada no internato.',
            textureKey:
                'test-item-food',
            kind:
                ItemKind.Food,
        },
        {
            id: 'number-seven',
            name: 'Número 7',
            description:
                'Um número que pode ser útil em algum puzzle.',
            textureKey:
                'test-item-number',
            kind:
                ItemKind.Number,
            value: 7,
        },
    ]

const TEST_ITEM_COLORS = [
    0xf1c40f,
    0xecf0f1,
    0x9b59b6,
    0xe67e22,
    0x2ecc71,
]

export class GameScene
    extends Phaser.Scene {

    private player!:
        Phaser.Physics.Arcade.Sprite

    private inventory!:
        InventorySystem

    private collision!:
        CollisionSystem

    private cursors!:
        Phaser.Types.Input.Keyboard.CursorKeys

    private upKey!:
        Phaser.Input.Keyboard.Key

    private leftKey!:
        Phaser.Input.Keyboard.Key

    private downKey!:
        Phaser.Input.Keyboard.Key

    private rightKey!:
        Phaser.Input.Keyboard.Key

    private interactKey!:
        Phaser.Input.Keyboard.Key

    private debugKey!:
        Phaser.Input.Keyboard.Key

    private inventoryText!:
        Phaser.GameObjects.Text

    private statusText!:
        Phaser.GameObjects.Text

    private pickupRadiusDebug!:
        Phaser.GameObjects.Graphics

    private debugVisible = false

    constructor() {
        super('GameScene')
    }

    preload(): void {
        this.load.image(
            'old-house',
            'assets/tilesets/old house.png',
        )

        this.load.image(
            'run-sheet',
            'assets/tilesets/16x16 Run-Sheet.png',
        )

        this.load.tilemapTiledJSON(
            'mapa-principal',
            'assets/maps/mapaPrincipal.json',
        )
    }

    create(): void {
        const map =
            this.make.tilemap({
                key: 'mapa-principal',
            })

        const oldHouseTileset =
            map.addTilesetImage(
                'old house',
                'old-house',
            )

        const runSheetTileset =
            map.addTilesetImage(
                '16x16 Run-Sheet',
                'run-sheet',
            )

        map.createLayer(
            'Camada de Blocos 1',
            [
                oldHouseTileset!,
                runSheetTileset!,
            ],
            0,
            0,
        )

        this.createTestTextures()

        // PERSONAGEM
        this.player =
            this.physics.add.sprite(
                400,
                300,
                'player',
            )

        // LIMITES FÍSICOS DO MUNDO
        this.physics.world
            .setBounds(
                0,
                0,
                WORLD_WIDTH,
                WORLD_HEIGHT,
            )

        // IMPEDE O PLAYER
        // DE SAIR DO MUNDO
        this.player
            .setCollideWorldBounds(
                true,
            )

        // INVENTÁRIO DE TESTE
        // Capacidade 3 para conseguirmos
        // testar inventário cheio.
        this.inventory =
            new InventorySystem(3)

        // SISTEMA DE COLISÃO
        this.collision =
            new CollisionSystem(
                this,
                this.inventory,
                {
                    pickupMode:
                        PickupMode.Interact,

                    pickupRadius:
                        PICKUP_RADIUS,
                },
            )

        // PAREDES DE TESTE
        const testWalls =
            this.createTestWalls()

        this.collision
            .buildWalls(
                testWalls,
            )
            .bindActor(
                this.player,
            )

        // ITENS DE TESTE
        this.spawnTestPickups()

        // LIMITES DA CÂMERA
        this.cameras.main
            .setBounds(
                0,
                0,
                WORLD_WIDTH,
                WORLD_HEIGHT,
            )

        // CÂMERA SEGUE PLAYER
        this.cameras.main
            .startFollow(
                this.player,
                true,
                0.2,
                0.2,
            )

        // CONTROLES
        this.cursors =
            this.input.keyboard!
                .createCursorKeys()

        this.upKey =
            this.input.keyboard!
                .addKey(
                    Phaser.Input.Keyboard
                        .KeyCodes.W,
                )

        this.leftKey =
            this.input.keyboard!
                .addKey(
                    Phaser.Input.Keyboard
                        .KeyCodes.A,
                )

        this.downKey =
            this.input.keyboard!
                .addKey(
                    Phaser.Input.Keyboard
                        .KeyCodes.S,
                )

        this.rightKey =
            this.input.keyboard!
                .addKey(
                    Phaser.Input.Keyboard
                        .KeyCodes.D,
                )

        // E = INTERAGIR
        this.interactKey =
            this.input.keyboard!
                .addKey(
                    Phaser.Input.Keyboard
                        .KeyCodes.E,
                )

        // F3 = DEBUG
        this.debugKey =
            this.input.keyboard!
                .addKey(
                    Phaser.Input.Keyboard
                        .KeyCodes.F3,
                )

        this.createTestHud()

        this.bindTestEvents()

        // LIMPEZA AO SAIR DA SCENE
        this.events.once(
            'shutdown',
            () => {
                this.collision
                    .destroy()

                this.inventory
                    .removeAllListeners()
            },
        )
    }

    update(): void {
        const left =
            this.cursors.left.isDown ||
            this.leftKey.isDown

        const right =
            this.cursors.right.isDown ||
            this.rightKey.isDown

        const up =
            this.cursors.up.isDown ||
            this.upKey.isDown

        const down =
            this.cursors.down.isDown ||
            this.downKey.isDown

        const x =
            Number(right) -
            Number(left)

        const y =
            Number(down) -
            Number(up)

        const direction =
            new Phaser.Math.Vector2(
                x,
                y,
            )

        // EVITA QUE A DIAGONAL
        // FIQUE MAIS RÁPIDA
        if (
            direction.length() > 0
        ) {
            direction.normalize()
        }

        this.player
            .setVelocity(
                direction.x *
                PLAYER_SPEED,

                direction.y *
                PLAYER_SPEED,
            )

        // ATUALIZA QUAL ITEM ESTÁ
        // MAIS PRÓXIMO DO PLAYER
        this.collision.update()

        // COLETA ITEM COM E
        if (
            Phaser.Input.Keyboard
                .JustDown(
                    this.interactKey,
                )
        ) {
            this.collision
                .tryCollect()
        }

        // LIGA/DESLIGA DEBUG COM F3
        if (
            Phaser.Input.Keyboard
                .JustDown(
                    this.debugKey,
                )
        ) {
            this.debugVisible =
                this.collision
                    .toggleDebug()

            this.pickupRadiusDebug
                .setVisible(
                    this.debugVisible,
                )
        }

        this.updatePickupRadiusDebug()
    }

    private createTestTextures():
        void {

        this.createSolidTexture(
            'player',
            40,
            40,
            0x3498db,
        )

        TEST_ITEMS.forEach(
            (
                item,
                index,
            ) => {
                this.createSolidTexture(
                    item.textureKey,
                    26,
                    26,
                    TEST_ITEM_COLORS[
                    index %
                    TEST_ITEM_COLORS
                        .length
                    ],
                )
            },
        )
    }

    private createSolidTexture(
        key: string,
        width: number,
        height: number,
        color: number,
    ): void {
        if (
            this.textures.exists(key)
        ) {
            return
        }

        const graphics =
            this.make.graphics({
                x: 0,
                y: 0,
            })

        graphics.fillStyle(
            color,
        )

        graphics.fillRect(
            0,
            0,
            width,
            height,
        )

        graphics.generateTexture(
            key,
            width,
            height,
        )

        graphics.destroy()
    }

    private createTestWalls():
        readonly WorldRect[] {

        const walls:
            readonly WorldRect[] = [
                {
                    x: 550,
                    y: 450,
                    width: 650,
                    height: 40,
                },
                {
                    x: 900,
                    y: 490,
                    width: 40,
                    height: 500,
                },
                {
                    x: 1200,
                    y: 300,
                    width: 500,
                    height: 40,
                },
                {
                    x: 300,
                    y: 1050,
                    width: 700,
                    height: 40,
                },
            ]

        // DESENHA AS PAREDES
        // Apenas para visualização.
        // A física fica no CollisionSystem.
        walls.forEach(
            (wall) => {
                this.add
                    .rectangle(
                        wall.x +
                        wall.width / 2,

                        wall.y +
                        wall.height / 2,

                        wall.width,
                        wall.height,

                        0x222222,
                    )
                    .setStrokeStyle(
                        2,
                        0xffffff,
                        0.5,
                    )
            },
        )

        return walls
    }

    private spawnTestPickups():
        void {

        const positions = [
            {
                x: 480,
                y: 300,
            },
            {
                x: 610,
                y: 350,
            },
            {
                x: 790,
                y: 350,
            },
            {
                x: 820,
                y: 650,
            },
            {
                x: 1080,
                y: 650,
            },
        ]

        positions.forEach(
            (
                position,
                index,
            ) => {
                this.collision
                    .spawnPickup(
                        position.x,
                        position.y,

                        TEST_ITEMS[
                        index %
                        TEST_ITEMS
                            .length
                        ],
                    )
            },
        )
    }

    private createTestHud():
        void {

        this.add
            .text(
                16,
                16,

                'Mover: WASD/setas | Coletar: E | Debug: F3',

                {
                    fontSize:
                        '16px',

                    color:
                        '#ffffff',

                    backgroundColor:
                        '#000000aa',

                    padding: {
                        x: 8,
                        y: 6,
                    },
                },
            )
            .setScrollFactor(0)
            .setDepth(100000)

        this.inventoryText =
            this.add
                .text(
                    16,
                    55,
                    '',
                    {
                        fontSize:
                            '16px',

                        color:
                            '#ffffff',

                        backgroundColor:
                            '#000000aa',

                        padding: {
                            x: 8,
                            y: 6,
                        },
                    },
                )
                .setScrollFactor(0)
                .setDepth(100000)

        this.statusText =
            this.add
                .text(
                    16,
                    145,

                    'Aproxime-se de um item.',

                    {
                        fontSize:
                            '16px',

                        color:
                            '#ffffff',

                        backgroundColor:
                            '#000000aa',

                        padding: {
                            x: 8,
                            y: 6,
                        },
                    },
                )
                .setScrollFactor(0)
                .setDepth(100000)

        this.pickupRadiusDebug =
            this.add
                .graphics()
                .setDepth(99999)
                .setVisible(false)

        this.updateInventoryHud(
            this.inventory
                .getSlots(),
        )
    }

    private bindTestEvents():
        void {

        this.inventory.on(
            INVENTORY_EVENTS.CHANGED,

            (
                slots:
                    readonly InventorySlot[],
            ) => {
                this.updateInventoryHud(
                    slots,
                )
            },
        )

        this.collision.on(
            COLLISION_EVENTS
                .PICKUP_RANGE_ENTERED,

            (
                pickup:
                    Pickup,
            ) => {
                this.statusText
                    .setText(
                        `[E] Coletar: ${pickup.item.name}`,
                    )
            },
        )

        this.collision.on(
            COLLISION_EVENTS
                .PICKUP_RANGE_LEFT,

            () => {
                this.statusText
                    .setText(
                        'Aproxime-se de um item.',
                    )
            },
        )

        this.collision.on(
            COLLISION_EVENTS
                .ITEM_COLLECTED,

            (
                pickup:
                    Pickup,
            ) => {
                this.statusText
                    .setText(
                        `Coletado: ${pickup.item.name}`,
                    )
            },
        )

        this.collision.on(
            COLLISION_EVENTS
                .PICKUP_BLOCKED,

            () => {
                this.statusText
                    .setText(
                        'Inventário cheio.',
                    )
            },
        )
    }

    private updateInventoryHud(
        slots:
            readonly InventorySlot[],
    ): void {

        const lines =
            slots.map(
                (
                    item,
                    index,
                ) => {
                    return `${index + 1}. ${item?.name ?? 'vazio'}`
                },
            )

        this.inventoryText
            .setText([
                'Inventário de teste:',
                ...lines,
            ])
    }

    private updatePickupRadiusDebug():
        void {

        if (!this.debugVisible) {
            return
        }

        this.pickupRadiusDebug
            .clear()

        this.pickupRadiusDebug
            .lineStyle(
                2,
                0xffe9a8,
                0.8,
            )

        this.pickupRadiusDebug
            .strokeCircle(
                this.player.x,
                this.player.y,
                PICKUP_RADIUS,
            )
    }

    private createTestMap():
        void {

        const tileSize = 300

        const colors = [
            0x4f6d7a,
            0x6b705c,
            0x8a6d5c,
            0x495867,
            0x706677,
            0x567568,
        ]

        let index = 0

        for (
            let y = 0;
            y < WORLD_HEIGHT;
            y += tileSize
        ) {
            for (
                let x = 0;
                x < WORLD_WIDTH;
                x += tileSize
            ) {
                const color =
                    colors[
                    index %
                    colors.length
                    ]

                this.add
                    .rectangle(
                        x +
                        tileSize / 2,

                        y +
                        tileSize / 2,

                        tileSize,
                        tileSize,
                        color,
                    )
                    .setStrokeStyle(
                        3,
                        0xffffff,
                        0.25,
                    )

                this.add.text(
                    x + 15,
                    y + 15,

                    `${x}, ${y}`,

                    {
                        fontSize:
                            '20px',

                        color:
                            '#ffffff',
                    },
                )

                index++
            }
        }
    }
}