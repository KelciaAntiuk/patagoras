import Phaser from 'phaser'

import { alternanciaLiberada } from '../ui/atalhos'

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

import {
    FoodThrowSystem,
} from '../system/Inventory/Food/FoodThrowSystem'

import {
    FOOD_EVENTS,
} from '../system/Inventory/Food/Food.events'

import {
    PlayerLifeSystem,
} from '../characters/Player/PlayerLifeSystem'

import {
    PLAYER_LIFE_EVENTS,
} from '../characters/Player/Player.events'

import {
    Patagoras,
} from '../characters/Patagoras/Patagoras'

import {
    PatagorasAI,
} from '../characters/Patagoras/PatagorasAI'

import {
    PatagorasPathfinder,
} from '../characters/Patagoras/PatagorasPathfinder'

import {
    PatagorasHit,
} from '../characters/Patagoras/PatagorasHit'

import {
    PATAGORAS_EVENTS,
} from '../characters/Patagoras/Patagoras.events'

import {
    PATAGORAS_CONFIG,
} from '../characters/Patagoras/Patagoras.config'

import {
    PuzzleSystem,
} from '../system/Puzzle/PuzzleSystem'

import {
    PUZZLE_EVENTS,
    PuzzleCloseReason,
} from '../system/Puzzle/Puzzle.types'

import type {
    PuzzleFechamento,
} from '../system/Puzzle/Puzzle.types'

const PLAYER_SPEED = 180

const WORLD_WIDTH = 2400
const WORLD_HEIGHT = 1800

const PICKUP_RADIUS = 90

const PUZZLE_TESTE_X = 480
const PUZZLE_TESTE_Y = 660

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

    private patagoras!:
        Patagoras

    private patagorasAI!:
        PatagorasAI

    private patagorasPathfinder!:
        PatagorasPathfinder

    private patagorasHit!:
        PatagorasHit

    private inventory!:
        InventorySystem

    private foodThrow!:
        FoodThrowSystem

    private playerLife!:
        PlayerLifeSystem

    private collision!:
        CollisionSystem

    private puzzles!:
        PuzzleSystem

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

    private escape!:
        Phaser.Input.Keyboard.Key

    private interactKey!:
        Phaser.Input.Keyboard.Key

    private foodKey!:
        Phaser.Input.Keyboard.Key

    private debugKey!:
        Phaser.Input.Keyboard.Key

    private inventoryText!:
        Phaser.GameObjects.Text

    private statusText!:
        Phaser.GameObjects.Text

    private livesText!:
        Phaser.GameObjects.Text

    private pickupRadiusDebug!:
        Phaser.GameObjects.Graphics

    private layerParedesInvisiveis!:
        Phaser.Tilemaps.TilemapLayer | null

    private hiddenTiles:
        Phaser.Tilemaps.Tile[] = []

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

        this.load.image(
            'dungeon-tileset',
            'assets/tilesets/Dungeon_Tileset.png',
        )

        this.load.tilemapTiledJSON(
            'mapa-principal',
            'assets/maps/mapaPrincipal.json',
        )
    }

    private criarCamada(
        map: Phaser.Tilemaps.Tilemap,
        nome: string,
        tilesets: Parameters<
            Phaser.Tilemaps.Tilemap['createLayer']
        >[1],
        x: number,
        y: number,
    ): Phaser.Tilemaps.TilemapLayer | null {
        return map.createLayer(
            nome,
            tilesets,
            x,
            y,
        ) as Phaser.Tilemaps.TilemapLayer | null
    }

    create(dados?: { abrirMenu?: boolean }): void {
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

        const dungeonTileset =
            map.addTilesetImage(
                'Dungeon_Tileset',
                'dungeon-tileset',
            )

        const rawTilesets = [
            oldHouseTileset,
            runSheetTileset,
            dungeonTileset,
        ]
        // Filter out nulls to prevent crashes
        const tilesets = rawTilesets.filter(ts => ts !== null) as Phaser.Tilemaps.Tileset[]

        const mapOriginX = 100
        const mapOriginY = 100

        const layerBruto = this.criarCamada(map, 'mapa bruto', tilesets, mapOriginX, mapOriginY)
        layerBruto?.setDepth(0)

        const layerSolo = this.criarCamada(map, 'detalhes de solo', tilesets, mapOriginX, mapOriginY)
        layerSolo?.setDepth(1)

        const layerParedes = this.criarCamada(map, 'paredes', tilesets, mapOriginX, mapOriginY)
        layerParedes?.setDepth(2)

        const layerParedes2 = this.criarCamada(map, 'paredes 2', tilesets, mapOriginX, mapOriginY)
        layerParedes2?.setDepth(3)

        const layerParedesInvisiveis = this.criarCamada(map, 'paredes invisiveis', tilesets, mapOriginX, mapOriginY + 256)
        layerParedesInvisiveis?.setVisible(true)
        layerParedesInvisiveis?.setDepth(10) // Acima do personagem

        const layerProps = this.criarCamada(map, 'detalhes de Props', tilesets, mapOriginX, mapOriginY)
        layerProps?.setDepth(11)

        // Camada de colisão personalizada desenhada no Tiled
        const layerColisao = this.criarCamada(map, 'colisao', tilesets, mapOriginX, mapOriginY)
        layerColisao?.setVisible(false)

        this.layerParedesInvisiveis = layerParedesInvisiveis

        this.createTestTextures()

        // PERSONAGEM (bloco 16x16 posicionado dentro da casa)
        this.player =
            this.physics.add.sprite(
                400,
                460,
                'player',
            )
        this.player.setDepth(5)

        // SISTEMA DE VIDAS DO PLAYER
        this.playerLife =
            new PlayerLifeSystem()

        // PATÁGORAS
        this.patagoras =
            new Patagoras(
                this,
                550,
                460,
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

        // PAREDES DO MAPA COM COLISÃO (usa a camada 'colisao' do Tiled)
        const hasCustomCollision =
            layerColisao &&
            layerColisao.filterTiles((t: Phaser.Tilemaps.Tile) => t.index > 0).length > 0

        const wallRects =
            this.extractWallRects(
                hasCustomCollision
                    ? [layerColisao] : [layerParedes, layerParedes2],
            )

        this.collision
            .buildWalls(
                wallRects,
            )
            .bindActor(
                this.player,
            )

        this.collision.walls
            .bindActor(
                this.patagoras.sprite,
            )

        // PATHFINDING DO PATÁGORAS
        this.patagorasPathfinder =
            new PatagorasPathfinder(
                WORLD_WIDTH,
                WORLD_HEIGHT,
                16,
                wallRects,
                PATAGORAS_CONFIG
                    .pathfindingPadding,
            )

        // IA DO PATÁGORAS
        this.patagorasAI =
            new PatagorasAI(
                this,
                this.patagoras,
                this.player,
                this.patagorasPathfinder,
            )

        // HIT DO PATÁGORAS
        this.patagorasHit =
            new PatagorasHit(
                this,
                this.patagoras,
                this.player,
            )

        this.patagorasHit.on(
            PATAGORAS_EVENTS.HIT_PLAYER,
            () => {
                const tookDamage =
                    this.playerLife
                        .takeDamage()

                if (!tookDamage) {
                    return
                }

                this.patagorasAI.stun(
                    PATAGORAS_CONFIG
                        .hitRecoveryMs,
                )
            },
        )

        // PUZZLES
        this.puzzles =
            new PuzzleSystem(
                this,
                {
                    jogador:
                        this.player,

                    inventario:
                        this.inventory,

                    patagorasHit:
                        this.patagorasHit,
                },
            )

        this.puzzles
            .adicionarGatilho(
                PUZZLE_TESTE_X,
                PUZZLE_TESTE_Y,
                'teste',
            )

        // SISTEMA DE COMIDA
        this.foodThrow =
            new FoodThrowSystem(
                this,
                this.player,
                this.patagoras,
                this.patagorasAI,
                this.inventory,
                this.collision,
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

        // ESC = MENU
        this.escape =
            this.input.keyboard!
                .addKey(
                    Phaser.Input.Keyboard
                        .KeyCodes.ESC,
                )

        // E = INTERAGIR
        this.interactKey =
            this.input.keyboard!
                .addKey(
                    Phaser.Input.Keyboard
                        .KeyCodes.E,
                )

        // Q = USAR / ARREMESSAR COMIDA
        this.foodKey =
            this.input.keyboard!
                .addKey(
                    Phaser.Input.Keyboard
                        .KeyCodes.Q,
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
                this.puzzles
                    .destroy()

                this.foodThrow
                    .destroy()

                this.patagorasAI
                    .destroy()

                this.patagorasHit
                    .destroy()

                this.playerLife
                    .destroy()

                this.collision
                    .destroy()

                this.inventory
                    .removeAllListeners()

                this.patagoras
                    .destroy()
            },
        )

        if (
            dados?.abrirMenu === true
        ) {
            this.abrirMenu()
        }
    }

    private abrirMenu(
        gameOver = false,
    ): void {
        if (
            this.scene.isActive(
                'MenuScene',
            )
        ) {
            return
        }

        this.escape.reset()

        this.scene.launch(
            'MenuScene',
            {
                gameOver,
            },
        )

        this.scene.pause()
    }

    update(): void {

        const puzzleAberto =
            this.puzzles.aberto

        // ABRE MENU COM ESC
        if (
            Phaser.Input.Keyboard
                .JustDown(
                    this.escape,
                ) &&
            !puzzleAberto &&
            alternanciaLiberada(
                this.game,
                'esc',
            )
        ) {
            this.abrirMenu()

            return
        }

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
            puzzleAberto
                ? 0
                : Number(right) -
                Number(left)

        const y =
            puzzleAberto
                ? 0
                : Number(down) -
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

        const playerSpeed =
            PLAYER_SPEED *
            this.foodThrow
                .getPlayerSpeedMultiplier()

        this.player
            .setVelocity(
                direction.x *
                playerSpeed,

                direction.y *
                playerSpeed,
            )

        // ATUALIZA IA DO PATÁGORAS
        this.patagorasAI.update()

        // ATUALIZA QUAL ITEM ESTÁ
        // MAIS PRÓXIMO DO PLAYER
        this.collision.update()

        this.puzzles.update()

        // E = COLETA ITEM OU ABRE PUZZLE
        if (
            Phaser.Input.Keyboard
                .JustDown(
                    this.interactKey,
                ) &&
            !puzzleAberto
        ) {
            if (
                this.collision.pickups
                    .getFocused()
            ) {
                this.collision
                    .tryCollect()
            } else {
                this.puzzles
                    .interagir()
            }
        }

        // USA / ARREMESSA COMIDA COM Q
        if (
            Phaser.Input.Keyboard
                .JustDown(
                    this.foodKey,
                )
        ) {
            this.foodThrow
                .tryUseFood()
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

        if (this.layerParedesInvisiveis) {
            // Restaura as paredes que deixaram de cobrir o personagem
            for (const tile of this.hiddenTiles) {
                tile.alpha = 1
            }
            this.hiddenTiles = []

            // Pega apenas os blocos de paredes invisíveis que estão sobre o personagem
            const overlappingTiles =
                this.layerParedesInvisiveis.getTilesWithinWorldXY(
                    this.player.x - 6,
                    this.player.y - 18,
                    12,
                    24,
                    { isNotEmpty: true },
                )

            for (const tile of overlappingTiles) {
                if (tile && tile.index > 0) {
                    tile.alpha = 0 // Apenas esta parede do player fica invisível!
                    this.hiddenTiles.push(tile)
                }
            }
        }
    }

    private createTestTextures():
        void {

        this.createSolidTexture(
            'player',
            16,
            16,
            0x3498db,
        )

        this.createSolidTexture(
            'patagoras',
            20,
            20,
            0xe74c3c,
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
            this.textures.exists(
                key,
            )
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

    private extractWallRects(
        layers: readonly (Phaser.Tilemaps.TilemapLayer | null)[],
    ): readonly WorldRect[] {
        const wallSet = new Set<string>()

        layers.forEach((layer) => {
            if (!layer) {
                return
            }

            const tiles = layer.filterTiles(
                (tile: Phaser.Tilemaps.Tile) => tile.index > 0,
            )

            if (!tiles) {
                return
            }

            tiles.forEach((tile: Phaser.Tilemaps.Tile) => {
                const wx = tile.pixelX + layer.x
                const wy = tile.pixelY + layer.y
                wallSet.add(`${wx},${wy}`)
            })
        })

        const rows = new Map<number, number[]>()
        wallSet.forEach((key) => {
            const [x, y] = key.split(',').map(Number)
            if (!rows.has(y)) {
                rows.set(y, [])
            }
            rows.get(y)!.push(x)
        })

        const rects: WorldRect[] = []
        rows.forEach((xList, y) => {
            xList.sort((a, b) => a - b)
            let startX = xList[0]
            let prevX = xList[0]
            for (let i = 1; i < xList.length; i++) {
                if (xList[i] === prevX + 16) {
                    prevX = xList[i]
                } else {
                    rects.push({
                        x: startX,
                        y,
                        width: prevX - startX + 16,
                        height: 16,
                    })
                    startX = xList[i]
                    prevX = xList[i]
                }
            }
            rects.push({
                x: startX,
                y,
                width: prevX - startX + 16,
                height: 16,
            })
        })

        return rects
    }

    private spawnTestPickups():
        void {

        const positions = [
            {
                x: 350,
                y: 460,
            },
            {
                x: 450,
                y: 460,
            },
            {
                x: 400,
                y: 500,
            },
            {
                x: 480,
                y: 480,
            },
            {
                x: 320,
                y: 480,
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

                'Mover: WASD/setas | Interagir: E | Comida: Q | Menu: ESC | Debug: F3',

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

        this.livesText =
            this.add
                .text(
                    16,
                    145,
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
                    185,

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

        this.updateLivesHud(
            this.playerLife
                .getLives(),
            this.playerLife
                .getMaxLives(),
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

        this.puzzles.on(
            PUZZLE_EVENTS
                .SOLVED,

            () => {
                this.statusText
                    .setText(
                        'Puzzle resolvido!',
                    )
            },
        )

        this.puzzles.on(
            PUZZLE_EVENTS
                .CLOSED,

            (
                fechamento:
                    PuzzleFechamento,
            ) => {
                if (
                    fechamento.motivo ===
                    PuzzleCloseReason.Atacado
                ) {
                    this.statusText
                        .setText(
                            'O Patágoras te pegou! O puzzle foi fechado.',
                        )
                }
            },
        )

        this.foodThrow.on(
            FOOD_EVENTS.NO_FOOD,
            () => {
                this.statusText
                    .setText(
                        'Você não possui comida.',
                    )
            },
        )

        this.foodThrow.on(
            FOOD_EVENTS.BUSY,
            () => {
                this.statusText
                    .setText(
                        'A comida já está sendo arremessada.',
                    )
            },
        )

        this.foodThrow.on(
            FOOD_EVENTS.THROW_STARTED,
            () => {
                this.statusText
                    .setText(
                        'Comida arremessada.',
                    )
            },
        )

        this.foodThrow.on(
            FOOD_EVENTS.LANDED,
            () => {
                this.statusText
                    .setText(
                        'A comida caiu no chão.',
                    )
            },
        )

        this.foodThrow.on(
            FOOD_EVENTS.HIT_PATAGORAS,
            () => {
                this.statusText
                    .setText(
                        'Patágoras comeu a comida e dormiu.',
                    )
            },
        )

        this.playerLife.on(
            PLAYER_LIFE_EVENTS.CHANGED,
            (
                lives: number,
                maxLives: number,
            ) => {
                this.updateLivesHud(
                    lives,
                    maxLives,
                )

                if (lives > 0) {
                    this.statusText
                        .setText(
                            `Patágoras acertou você! Vidas restantes: ${lives}.`,
                        )
                }
            },
        )

        this.playerLife.on(
            PLAYER_LIFE_EVENTS.GAME_OVER,
            () => {
                this.player
                    .setVelocity(
                        0,
                        0,
                    )

                this.patagoras
                    .stop()

                this.statusText
                    .setText(
                        'GAME OVER',
                    )

                this.abrirMenu(true)
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

    private updateLivesHud(
        lives: number,
        maxLives: number,
    ): void {

        const full =
            '♥'.repeat(lives)

        const empty =
            '♡'.repeat(
                Math.max(
                    0,
                    maxLives - lives,
                ),
            )

        this.livesText
            .setText(
                `Vidas: ${full}${empty}`,
            )
    }

    private updatePickupRadiusDebug():
        void {

        if (
            !this.debugVisible
        ) {
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

}