import Phaser from 'phaser'

import { alternanciaLiberada } from '../ui/atalhos'
import { InventoryUI } from '../ui/Inventory/InventoryUI'
import { SLOT_SIZE } from '../ui/Inventory/InventorySlotUI'

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
    ItemKind,
} from '../system/Inventory/Inventory.types'

import type {
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

import type {
    PuzzleId,
} from '../puzzles'

import {
    PUZZLE_EVENTS,
    PuzzleCloseReason,
} from '../system/Puzzle/Puzzle.types'

import type {
    PuzzleFechamento,
} from '../system/Puzzle/Puzzle.types'

const PLAYER_SPEED = 80

const ZOOM_CAMERA = 2
const ESCALA_INVENTARIO_HUD = 0.7
const FONTE_HUD = '"Patrick Hand", Georgia, serif'
const CORACAO = [
    '.oo.oo.',
    'owroRro',
    'orrrrro',
    'orrrrro',
    '.orrro.',
    '..oro..',
    '...o...',
]
const PIXEL_CORACAO = 3
const RAIO_VISAO = 55
const RAIO_ESCURIDAO = 100
const TAMANHO_ESCURIDAO = 800

const WORLD_WIDTH = 2400
const WORLD_HEIGHT = 1800

const PICKUP_RADIUS = 90

const SPAWN_JOGADOR_X = 470
const SPAWN_JOGADOR_Y = 600

const PUZZLE_TESTE_X = 480
const PUZZLE_TESTE_Y = 660

const PORTAS: readonly {
    readonly puzzleId: PuzzleId
    readonly porta: { x: number; y: number; l: number; a: number }
    readonly gatilho: { x: number; y: number }
    readonly aoAbrir: string
}[] = [
    {
        puzzleId: 'refeitorio',
        porta: { x: 475, y: 565, l: 40, a: 42 },
        gatilho: { x: 475, y: 596 },
        aoAbrir: 'O refeitório foi destrancado.',
    },
    {
        puzzleId: 'entrada-cozinha',
        porta: { x: 255, y: 482, l: 16, a: 30 },
        gatilho: { x: 272, y: 482 },
        aoAbrir: 'A cozinha foi destrancada.',
    },
    {
        puzzleId: 'sala-aula-1',
        porta: { x: 276, y: 412, l: 32, a: 20 },
        gatilho: { x: 276, y: 440 },
        aoAbrir: 'A sala de aula 1 foi destrancada.',
    },
]

const TEST_ITEMS:
    readonly ItemDefinition[] = [
        {
            id: 'rusty-key',
            name: 'Chave enferrujada',
            description:
                'Uma chave velha encontrada no chão.',
            textureKey:
                'sprite-chave',
            kind:
                ItemKind.Generic,
        },
        {
            id: 'strange-note',
            name: 'Bilhete estranho',
            description:
                'Um bilhete com anotações incompletas.',
            textureKey:
                'sprite-papel',
            kind:
                ItemKind.Generic,
        },
        {
            id: 'battery',
            name: 'Pilha',
            description:
                'Talvez ainda tenha alguma carga.',
            textureKey:
                'sprite-pilha',
            kind:
                ItemKind.Generic,
        },
        {
            id: 'food-can',
            name: 'Lata de comida',
            description:
                'Uma lata fechada encontrada no internato.',
            textureKey:
                'sprite-comida',
            kind:
                ItemKind.Food,
        },
        {
            id: 'number-six',
            name: 'Número 6',
            description:
                'Um seis de metal, arrancado de alguma porta.',
            textureKey:
                'sprite-numero-6',
            kind:
                ItemKind.Number,
            value: 6,
        },
        {
            id: 'number-seven',
            name: 'Número 7',
            description:
                'Um número que pode ser útil em algum puzzle.',
            textureKey:
                'sprite-numero-7',
            kind:
                ItemKind.Number,
            value: 7,
        },
    ]

const ITENS_DOS_PUZZLES: readonly {
    readonly item: ItemDefinition
    readonly x: number
    readonly y: number
    readonly cor: number
}[] = [
    {
        item: {
            id: 'number-three',
            name: 'Número 3',
            description:
                'Um três de metal. Parece ter saído de uma porta de armário.',
            textureKey:
                'sprite-numero-3',
            kind: ItemKind.Number,
            value: 3,
        },
        x: 160,
        y: 500,
        cor: 0xff7675,
    },
    {
        item: {
            id: 'number-eight',
            name: 'Número 8',
            description:
                'Um oito de metal, caído perto da entrada.',
            textureKey:
                'sprite-numero-8',
            kind: ItemKind.Number,
            value: 8,
        },
        x: 378,
        y: 600,
        cor: 0x74b9ff,
    },
    {
        item: {
            id: 'number-one',
            name: 'Número 1',
            description:
                'Um um de metal, esquecido entre as mesas.',
            textureKey:
                'sprite-numero-1',
            kind: ItemKind.Number,
            value: 1,
        },
        x: 520,
        y: 450,
        cor: 0xffeaa7,
    },
    {
        item: {
            id: 'refeitorio-numero-1',
            name: 'Número 1',
            description:
                'Um um rabiscado numa bandeja.',
            textureKey:
                'sprite-numero-1',
            kind: ItemKind.Number,
            value: 1,
        },
        x: 540,
        y: 606,
        cor: 0xa29bfe,
    },
    {
        item: {
            id: 'refeitorio-numero-3',
            name: 'Número 3',
            description:
                'Um três rabiscado numa bandeja.',
            textureKey:
                'sprite-numero-3',
            kind: ItemKind.Number,
            value: 3,
        },
        x: 530,
        y: 676,
        cor: 0x55efc4,
    },
    {
        item: {
            id: 'sala1-numero-1',
            name: 'Número 1',
            description:
                'Um um de giz, desenhado num caco de lousa.',
            textureKey:
                'sprite-numero-1',
            kind: ItemKind.Number,
            value: 1,
        },
        x: 300,
        y: 520,
        cor: 0xdfe6e9,
    },
    {
        item: {
            id: 'sala1-numero-9',
            name: 'Número 9',
            description:
                'Um nove de giz, desenhado num caco de lousa.',
            textureKey:
                'sprite-numero-9',
            kind: ItemKind.Number,
            value: 9,
        },
        x: 450,
        y: 515,
        cor: 0x81ecec,
    },
    {
        item: {
            id: 'sala2-numero-2',
            name: 'Número 2',
            description:
                'Um dois recortado de uma cartolina de chamada.',
            textureKey:
                'sprite-numero-2',
            kind: ItemKind.Number,
            value: 2,
        },
        x: 340,
        y: 380,
        cor: 0xfab1a0,
    },
    {
        item: {
            id: 'sala2-numero-4',
            name: 'Número 4',
            description:
                'Um quatro recortado de uma cartolina de chamada.',
            textureKey:
                'sprite-numero-4',
            kind: ItemKind.Number,
            value: 4,
        },
        x: 468,
        y: 392,
        cor: 0xfdcb6e,
    },
]

const TEST_ITEM_COLORS = [
    0x16a085,
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

    private escuridao!:
        Phaser.GameObjects.Image

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

    private dropKeys!:
        Phaser.Input.Keyboard.Key[]

    private debugKey!:
        Phaser.Input.Keyboard.Key

    private inventarioHud!:
        InventoryUI

    private controlesText!:
        Phaser.GameObjects.Text

    private coracoes:
        Phaser.GameObjects.Image[] = []

    private tweenStatus?:
        Phaser.Tweens.Tween

    private statusText!:
        Phaser.GameObjects.Text


    private pickupRadiusDebug!:
        Phaser.GameObjects.Graphics

    private layersParedesInvisiveis:
        Phaser.Tilemaps.TilemapLayer[] = []

    private hiddenTiles:
        Phaser.Tilemaps.Tile[] = []

    private debugVisible = false

    private ultimaDirecao:
        | 'frente'
        | 'diagonal-baixo'
        | 'lado'
        | 'diagonal-cima'
        | 'cima' = 'frente'

    private readonly barreiras =
        new Map<
            PuzzleId,
            {
                porta: Phaser.GameObjects.Rectangle
                colisor: Phaser.Physics.Arcade.Collider
            }
        >()

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

        this.load.image(
            'mobilha',
            'assets/tilesets/mobilha.png',
        )

        this.load.image(
            'rundown-house',
            'assets/tilesets/A rundown house.png',
        )

        this.load.image(
            'mobilha2.2',
            'assets/tilesets/mobilha2.2.png',
        )

        this.load.image(
            'mobilha3',
            'assets/tilesets/mobilha3.png',
        )

        this.load.tilemapTiledJSON(
            'mapa-principal',
            'assets/maps/mapaPrincipal.json',
        )

        // Carregamento dos spritesheets do personagem e do Patágoras
        this.load.spritesheet(
            'sprite_jogador',
            'assets/sprites/character/character-sheet.png',
            { frameWidth: 24, frameHeight: 24 }
        )

        this.load.spritesheet(
            'sprite_pato',
            'assets/sprites/character/pato-sheet.png',
            { frameWidth: 20, frameHeight: 18 }
        )

        // Carregamento individual das sprites do Patágoras
        for (let i = 3; i <= 20; i++) {
            const pad = String(i).padStart(4, '0')
            this.load.image(`pato-${pad}`, `assets/sprites/character/Sprite-${pad}.png`)
        }

        // Sprites de números dos puzzles e itens
        for (let i = 0; i <= 9; i++) {
            let filename = `Number ${i}.png`
            if (i === 1) filename = 'Number 1 (2).png'
            if (i === 3) filename = 'Number 3 (1).png'
            this.load.image('sprite-numero-' + i, 'assets/sprites/puzzles/' + filename)
        }

        this.load.image('sprite-pilha', 'assets/sprites/puzzles/pilha02.png')
        this.load.image('sprite-comida', 'assets/sprites/puzzles/comida.png')
        this.load.image('sprite-chave', 'assets/sprites/puzzles/chave.png')
        this.load.image('sprite-papel', 'assets/sprites/puzzles/papel.png')
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
        this.createTestTextures()

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

        const automapTileset =
            map.addTilesetImage(
                'automap-tiles',
                'automap-tiles',
            )

        const mobilhaTileset =
            map.addTilesetImage(
                'mobilha',
                'mobilha',
            )

        const rundownHouseTileset =
            map.addTilesetImage(
                'A rundown house',
                'rundown-house',
            )

        const mobilha22Tileset =
            map.addTilesetImage(
                'mobilha2.2',
                'mobilha2.2',
            )

        const mobilha3Tileset =
            map.addTilesetImage(
                'mobilha3',
                'mobilha3',
            )

        const rawTilesets = [
            oldHouseTileset,
            runSheetTileset,
            dungeonTileset,
            automapTileset,
            mobilhaTileset,
            rundownHouseTileset,
            mobilha22Tileset,
            mobilha3Tileset,
        ]
        // Filter out nulls to prevent crashes
        const tilesets = rawTilesets.filter(ts => ts !== null) as Phaser.Tilemaps.Tileset[]

        const mapOriginX = 100
        const mapOriginY = 100

        const refLayerData =
            map.layers.find((l) => l.name === 'colisao') ??
            map.layers[0]
        const refX = refLayerData ? refLayerData.x : 0
        const refY = refLayerData ? refLayerData.y : 0

        this.layersParedesInvisiveis = []
        const layersParedes: Phaser.Tilemaps.TilemapLayer[] = []
        let layerColisao: Phaser.Tilemaps.TilemapLayer | null = null

        for (const layerData of map.layers) {
            if (layerData.width === 0 || layerData.height === 0) {
                continue
            }

            const nome = layerData.name
            const nomeLower = nome.toLowerCase()

            if (nomeLower === 'colisao') {
                const lx = mapOriginX + Math.round(layerData.x - refX)
                const ly = mapOriginY + Math.round(layerData.y - refY)
                layerColisao = this.criarCamada(map, nome, tilesets, lx, ly)
                layerColisao?.setVisible(false)
                continue
            }

            if (!layerData.visible || nomeLower.includes('esqueleto')) {
                continue
            }

            const lx = mapOriginX + Math.round(layerData.x - refX)
            const ly = mapOriginY + Math.round(layerData.y - refY)
            const layer = this.criarCamada(map, nome, tilesets, lx, ly)
            if (!layer) {
                continue
            }

            layer.setVisible(true)

            if (nomeLower.includes('mapa bruto')) {
                layer.setDepth(0)
            } else if (nomeLower.includes('detalhes de solo')) {
                layer.setDepth(1)
            } else if (nomeLower.includes('paredes 2')) {
                layer.setDepth(3)
                layersParedes.push(layer)
            } else if (nomeLower.includes('paredes invisiveis')) {
                layer.setDepth(10)
                this.layersParedesInvisiveis.push(layer)
            } else if (nomeLower.includes('paredes')) {
                layer.setDepth(2)
                layersParedes.push(layer)
            } else if (nomeLower.includes('mobilha invisivel')) {
                layer.setDepth(10)
                this.layersParedesInvisiveis.push(layer)
            } else if (nomeLower.includes('mobilha por cima da parede')) {
                layer.setDepth(11)
                this.layersParedesInvisiveis.push(layer)
            } else if (nomeLower.includes('mobilha')) {
                layer.setDepth(4)
            } else if (nomeLower.includes('props')) {
                layer.setDepth(11)
            }
        }

        // Criação do jogador
        this.player =
            this.physics.add.sprite(
                SPAWN_JOGADOR_X,
                SPAWN_JOGADOR_Y,
                'sprite_jogador',
            )
        this.player.setDepth(5)
        // Hitbox nos pés (12x12) para frame de 24x24 (offset 6, 10)
        this.player.setSize(12, 12)
        this.player.setOffset(6, 10)

        // Movimentação do personagem para frente (baixo) - frames 8, 9, 10, 11
        this.anims.create({
            key: 'andar-frente',
            frames: this.anims.generateFrameNumbers('sprite_jogador', { start: 8, end: 11 }),
            frameRate: 8,
            repeat: -1,
        })

        // Movimentação do personagem para diagonal abaixo - frames 14 a 17
        this.anims.create({
            key: 'andar-diagonal-baixo',
            frames: this.anims.generateFrameNumbers('sprite_jogador', { start: 12, end: 15 }),
            frameRate: 8,
            repeat: -1,
        })

        // Movimentação do personagem para os lados (esquerda/direita) - frames 16, 17, 18, 19
        this.anims.create({
            key: 'andar-lado',
            frames: this.anims.generateFrameNumbers('sprite_jogador', { start: 16, end: 19 }),
            frameRate: 8,
            repeat: -1,
        })

        // Movimentação do personagem para diagonal acima - frames 20, 21, 22, 23
        this.anims.create({
            key: 'andar-diagonal-cima',
            frames: this.anims.generateFrameNumbers('sprite_jogador', { start: 20, end: 23 }),
            frameRate: 8,
            repeat: -1,
        })

        // Movimentação do personagem para trás (cima) - frames 24 a 27 (olhando apenas para cima)
        this.anims.create({
            key: 'andar-cima',
            frames: this.anims.generateFrameNumbers('sprite_jogador', { start: 24, end: 27 }),
            frameRate: 8,
            repeat: -1,
        })

        // Animações de parado (Idle) para cada direção
        this.anims.create({
            key: 'parado-frente',
            frames: [{ key: 'sprite_jogador', frame: 0 }],
            frameRate: 1,
            repeat: -1,
        })

        this.anims.create({
            key: 'parado-diagonal-baixo',
            frames: [{ key: 'sprite_jogador', frame: 12 }],
            frameRate: 1,
            repeat: -1,
        })

        this.anims.create({
            key: 'parado-lado',
            frames: [{ key: 'sprite_jogador', frame: 16 }],
            frameRate: 1,
            repeat: -1,
        })

        this.anims.create({
            key: 'parado-diagonal-cima',
            frames: [{ key: 'sprite_jogador', frame: 4 }],
            frameRate: 1,
            repeat: -1,
        })

        this.anims.create({
            key: 'parado-cima',
            frames: [{ key: 'sprite_jogador', frame: 24 }],
            frameRate: 1,
            repeat: -1,
        })

        this.player.anims.play('parado-frente')

        // Animação do Patágoras para baixo (S) - sprites 0003, 0004, 0005 e 0006
        this.anims.create({
            key: 'pato-andar-baixo',
            frames: [
                { key: 'pato-0003' },
                { key: 'pato-0004' },
                { key: 'pato-0005' },
                { key: 'pato-0006' },
            ],
            frameRate: 8,
            repeat: -1,
        })

        // Animação do Patágoras para cima (W) - sprites 0007 até 0012
        this.anims.create({
            key: 'pato-andar-cima',
            frames: [
                { key: 'pato-0007' },
                { key: 'pato-0008' },
                { key: 'pato-0009' },
                { key: 'pato-0010' },
                { key: 'pato-0011' },
                { key: 'pato-0012' },
            ],
            frameRate: 8,
            repeat: -1,
        })

        // Animação do Patágoras para os lados (A / D) - sprites 0013 até 0018
        this.anims.create({
            key: 'pato-andar-lado',
            frames: [
                { key: 'pato-0013' },
                { key: 'pato-0014' },
                { key: 'pato-0015' },
                { key: 'pato-0016' },
                { key: 'pato-0017' },
                { key: 'pato-0018' },
            ],
            frameRate: 8,
            repeat: -1,
        })

        // Animação do Patágoras na diagonal abaixo (S + A / S + D) - sprites 0019 e 0020
        this.anims.create({
            key: 'pato-andar-diagonal-baixo',
            frames: [
                { key: 'pato-0019' },
                { key: 'pato-0020' },
            ],
            frameRate: 6,
            repeat: -1,
        })
        
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
                    ? [layerColisao] : layersParedes,
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

        this.criarPortas()

        // PUZZLE DENTRO DA SALA 2 (LIBERA A PORTA DA COZINHA)
        this.puzzles
            .adicionarGatilho(
                420,
                338,
                'sala-aula-2',
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

        this.spawnItensDosPuzzles()

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

        // 1/2/3 = SOLTA O ITEM DO SLOT
        this.dropKeys = [
            Phaser.Input.Keyboard.KeyCodes.ONE,
            Phaser.Input.Keyboard.KeyCodes.TWO,
            Phaser.Input.Keyboard.KeyCodes.THREE,
        ].map(
            (code) =>
                this.input.keyboard!
                    .addKey(code),
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

        this.criarEscuridao()

        this.criarCameraHud()

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

        // ATUALIZA ANIMAÇÃO DO JOGADOR CONFORME MOVIMENTO
        if (direction.length() > 0) {
            if (x !== 0 && y < 0) {
                // W + A ou W + D → diagonal acima
                this.ultimaDirecao = 'diagonal-cima'
                this.player.setFlipX(x < 0)
                this.player.anims.play('andar-diagonal-cima', true)
            } else if (y < 0) {
                // W puro → olha apenas para cima
                this.ultimaDirecao = 'cima'
                this.player.setFlipX(false)
                this.player.anims.play('andar-cima', true)
            } else if (x !== 0 && y > 0) {
                this.ultimaDirecao = 'diagonal-baixo'
                this.player.setFlipX(x < 0)
                this.player.anims.play('andar-diagonal-baixo', true)
            } else if (x !== 0) {
                this.ultimaDirecao = 'lado'
                this.player.setFlipX(x < 0)
                this.player.anims.play('andar-lado', true)
            } else if (y > 0) {
                this.ultimaDirecao = 'frente'
                this.player.setFlipX(false)
                this.player.anims.play('andar-frente', true)
            }
        } else {
            this.player.anims.play('parado-' + this.ultimaDirecao, true)
        }

        // ATUALIZA IA DO PATÁGORAS
        this.patagorasAI.update()
        this.patagoras.updateAnimation()

        this.escuridao.setPosition(
            this.player.x,
            this.player.y,
        )

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
                !this.puzzles
                    .interagir()
            ) {
                if (
                    this.collision.pickups
                        .getFocused()
                ) {
                    this.collision
                        .tryCollect()
                }
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

        // SOLTA ITEM COM 1/2/3
        this.dropKeys.forEach(
            (key, index) => {
                if (
                    Phaser.Input.Keyboard
                        .JustDown(key) &&
                    !puzzleAberto
                ) {
                    this.soltarItem(index)
                }
            },
        )

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

        if (this.layersParedesInvisiveis.length > 0) {
            // Restaura as paredes que deixaram de cobrir o personagem
            for (const tile of this.hiddenTiles) {
                tile.alpha = 1
            }
            this.hiddenTiles = []

            // Pega apenas os blocos de paredes invisíveis que estão sobre o personagem
            for (const layerInvisivel of this.layersParedesInvisiveis) {
                const overlappingTiles =
                    layerInvisivel.getTilesWithinWorldXY(
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
    }

    private criarEscuridao(): void {
        if (!this.textures.exists('escuridao')) {
            const textura =
                this.textures.createCanvas(
                    'escuridao',
                    TAMANHO_ESCURIDAO,
                    TAMANHO_ESCURIDAO,
                )!
            const ctx = textura.getContext()
            const centro = TAMANHO_ESCURIDAO / 2
            const gradiente =
                ctx.createRadialGradient(
                    centro,
                    centro,
                    RAIO_VISAO,
                    centro,
                    centro,
                    RAIO_ESCURIDAO,
                )
            gradiente.addColorStop(0, 'rgba(0, 0, 0, 0)')
            gradiente.addColorStop(1, 'rgba(0, 0, 0, 1)')
            ctx.fillStyle = gradiente
            ctx.fillRect(0, 0, TAMANHO_ESCURIDAO, TAMANHO_ESCURIDAO)
            textura.refresh()
        }

        this.escuridao =
            this.add
                .image(
                    this.player.x,
                    this.player.y,
                    'escuridao',
                )
                .setDepth(90000)
    }

    private criarCameraHud(): void {
        const ehHud = (
            objeto: Phaser.GameObjects.GameObject,
        ): boolean =>
            'scrollFactorX' in objeto &&
            objeto.scrollFactorX === 0

        const hud =
            this.children.list
                .filter(ehHud)

        const cameraHud =
            this.cameras.add(
                0,
                0,
                this.scale.width,
                this.scale.height,
            )

        cameraHud.ignore(
            this.children.list
                .filter((o) => !ehHud(o)),
        )

        this.cameras.main
            .setZoom(ZOOM_CAMERA)
            .ignore(hud)

        const raiz = (
            objeto: Phaser.GameObjects.GameObject,
        ): Phaser.GameObjects.GameObject => {
            let atual = objeto
            while (atual.parentContainer) {
                atual = atual.parentContainer
            }
            return atual
        }

        const aoAdicionar = (
            objeto: Phaser.GameObjects.GameObject,
        ): void => {
            queueMicrotask(() => {
                if (!objeto.scene) {
                    return
                }
                if (ehHud(raiz(objeto))) {
                    this.cameras.main.ignore(objeto)
                } else {
                    cameraHud.ignore(objeto)
                }
            })
        }

        this.events.on(
            Phaser.Scenes.Events.ADDED_TO_SCENE,
            aoAdicionar,
        )

        this.events.once(
            'shutdown',
            () => {
                this.events.off(
                    Phaser.Scenes.Events.ADDED_TO_SCENE,
                    aoAdicionar,
                )
            },
        )
    }

    private createTestTextures():
        void {

        this.createSolidTexture(
            'automap-tiles',
            80,
            16,
            0xff0000,
        )

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
                if (!this.textures.exists(item.textureKey)) this.createSolidTexture(
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

    private criarPortas():
        void {

        this.barreiras.clear()

        PORTAS.forEach(
            (def) => {
                this.puzzles
                    .adicionarGatilho(
                        def.gatilho.x,
                        def.gatilho.y,
                        def.puzzleId,
                    )

                const porta = this.add
                    .rectangle(
                        def.porta.x,
                        def.porta.y,
                        def.porta.l,
                        def.porta.a,
                        0x6b4526,
                    )

                porta.setStrokeStyle(
                    2,
                    0x2f1d0e,
                )

                porta.setDepth(5)

                this.physics.add.existing(
                    porta,
                    true,
                )

                this.barreiras.set(
                    def.puzzleId,
                    {
                        porta,
                        colisor:
                            this.physics.add.collider(
                                this.player,
                                porta,
                            ),
                    },
                )
            },
        )
    }

    private abrirPorta(
        puzzleId: PuzzleId,
    ): boolean {

        const barreira =
            this.barreiras.get(puzzleId)

        const def =
            PORTAS.find(
                (p) =>
                    p.puzzleId ===
                    puzzleId,
            )

        if (!barreira || !def) return false

        barreira.colisor.destroy()
        barreira.porta.destroy()

        this.barreiras.delete(puzzleId)

        this.mostrarStatus(
                def.aoAbrir,
            )

        return true
    }

    private soltarItem(
        index: number,
    ): void {

        const item =
            this.inventory
                .removeAll(index)

        if (!item) return

        this.collision
            .spawnPickup(
                this.player.x,
                this.player.y + 10,
                item,
            )
    }

    private spawnItensDosPuzzles():
        void {

        ITENS_DOS_PUZZLES.forEach(
            (entrada) => {
                if (!this.textures.exists(entrada.item.textureKey)) {
                    this.createSolidTexture(
                        entrada.item
                            .textureKey,
                        26,
                        26,
                        entrada.cor,
                    )
                }

                this.collision
                    .spawnPickup(
                        entrada.x,
                        entrada.y,
                        entrada.item,
                    )
            },
        )
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
                x: 430,
                y: 430,
            },
            {
                x: 380,
                y: 440,
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
        criarTexturasCoracao(this)

        this.controlesText =
            this.add
                .text(
                    0,
                    0,
                    'WASD mover  ·  E interagir  ·  1/2/3 soltar  ·  Q comida  ·  ESC menu',
                    {
                        fontFamily: FONTE_HUD,
                        fontSize: '13px',
                        color: '#f4efe4',
                        backgroundColor: '#1a1208aa',
                        padding: { x: 8, y: 3 },
                    },
                )
                .setOrigin(1, 0)
                .setAlpha(0.75)
                .setResolution(2)
                .setScrollFactor(0)
                .setDepth(100000)

        this.inventarioHud =
            new InventoryUI(
                this,
                this.inventory,
                0,
                0,
            )
                .setScale(ESCALA_INVENTARIO_HUD)
                .setDepth(100000)

        this.inventory
            .getSlots()
            .forEach((_, indice, slots) => {
                const larguraSlots =
                    slots.length * SLOT_SIZE +
                    (slots.length - 1) * 10
                const xSlot =
                    -larguraSlots / 2 +
                    indice * (SLOT_SIZE + 10)

                this.inventarioHud.add(
                    this.add
                        .text(
                            xSlot + 3,
                            -SLOT_SIZE / 2,
                            String(indice + 1),
                            {
                                fontFamily: FONTE_HUD,
                                fontSize: '14px',
                                color: '#d8b46a',
                            },
                        )
                        .setResolution(2),
                )
            })

        this.coracoes =
            Array.from(
                { length: this.playerLife.getMaxLives() },
                () =>
                    this.add
                        .image(0, 0, 'coracao-cheio')
                        .setOrigin(0, 1)
                        .setScrollFactor(0)
                        .setDepth(100000),
            )

        this.statusText =
            this.add
                .text(
                    0,
                    0,
                    '',
                    {
                        fontFamily: FONTE_HUD,
                        fontSize: '17px',
                        color: '#f4efe4',
                        backgroundColor: '#1a1208dd',
                        padding: { x: 12, y: 5 },
                        align: 'center',
                    },
                )
                .setOrigin(0.5, 1)
                .setResolution(2)
                .setScrollFactor(0)
                .setDepth(100000)
                .setVisible(false)

        this.posicionarHud()

        this.scale.on(
            Phaser.Scale.Events.RESIZE,
            this.posicionarHud,
            this,
        )

        this.events.once(
            'shutdown',
            () => {
                this.scale.off(
                    Phaser.Scale.Events.RESIZE,
                    this.posicionarHud,
                    this,
                )
            },
        )

        this.pickupRadiusDebug =
            this.add
                .graphics()
                .setDepth(99999)
                .setVisible(false)

        this.updateLivesHud(
            this.playerLife
                .getLives(),
        )
    }

    private bindTestEvents():
        void {

        this.collision.on(
            COLLISION_EVENTS
                .PICKUP_RANGE_ENTERED,

            (
                pickup:
                    Pickup,
            ) => {
                this.mostrarStatus(
                        `[E] Coletar: ${pickup.item.name}`,
                        true,
                    )
            },
        )

        this.collision.on(
            COLLISION_EVENTS
                .PICKUP_RANGE_LEFT,

            () => {
                this.mostrarStatus(
                        '',
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
                this.mostrarStatus(
                        `Coletado: ${pickup.item.name}`,
                    )
            },
        )

        this.collision.on(
            COLLISION_EVENTS
                .PICKUP_BLOCKED,

            () => {
                this.mostrarStatus(
                        'Inventário cheio.',
                    )
            },
        )

        this.puzzles.on(
            PUZZLE_EVENTS
                .SOLVED,

            (
                puzzleId: PuzzleId,
            ) => {
                if (
                    this.abrirPorta(
                        puzzleId,
                    )
                ) {
                    return
                }

                this.mostrarStatus(
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
                    this.mostrarStatus(
                            'O Patágoras te pegou! O puzzle foi fechado.',
                        )
                }
            },
        )

        this.foodThrow.on(
            FOOD_EVENTS.NO_FOOD,
            () => {
                this.mostrarStatus(
                        'Você não possui comida.',
                    )
            },
        )

        this.foodThrow.on(
            FOOD_EVENTS.BUSY,
            () => {
                this.mostrarStatus(
                        'A comida já está sendo arremessada.',
                    )
            },
        )

        this.foodThrow.on(
            FOOD_EVENTS.THROW_STARTED,
            () => {
                this.mostrarStatus(
                        'Comida arremessada.',
                    )
            },
        )

        this.foodThrow.on(
            FOOD_EVENTS.LANDED,
            () => {
                this.mostrarStatus(
                        'A comida caiu no chão.',
                    )
            },
        )

        this.foodThrow.on(
            FOOD_EVENTS.HIT_PATAGORAS,
            () => {
                this.mostrarStatus(
                        'Patágoras comeu a comida e dormiu.',
                    )
            },
        )

        this.playerLife.on(
            PLAYER_LIFE_EVENTS.CHANGED,
            (
                lives: number,
            ) => {
                this.updateLivesHud(
                    lives,
                )

                if (lives > 0) {
                    this.mostrarStatus(
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

                this.mostrarStatus(
                        'GAME OVER',
                    )

                this.abrirMenu(true)
            },
        )
    }

    private areaVisivel():
        Phaser.Geom.Rectangle {
        const { width, height } =
            this.scale.gameSize
        const pai =
            this.scale.parentSize
        const escala =
            pai.width > 0 && pai.height > 0
                ? Math.max(
                    pai.width / width,
                    pai.height / height,
                )
                : 1
        const largura =
            Math.min(width, pai.width / escala || width)
        const altura =
            Math.min(height, pai.height / escala || height)

        return new Phaser.Geom.Rectangle(
            (width - largura) / 2,
            (height - altura) / 2,
            largura,
            altura,
        )
    }

    private posicionarHud(): void {
        const area =
            this.areaVisivel()
        const margem = 14

        this.controlesText.setPosition(
            area.right - margem,
            area.top + margem,
        )

        const larguraInventario =
            this.inventarioHud.getBounds().width
        const alturaInventario =
            this.inventarioHud.getBounds().height

        this.inventarioHud.setPosition(
            area.left + margem + larguraInventario / 2,
            area.bottom - margem - alturaInventario / 2,
        )

        const topoInventario =
            area.bottom - margem - alturaInventario

        this.coracoes.forEach((coracao, indice) => {
            coracao.setPosition(
                area.left + margem + 2 + indice * (coracao.width + 4),
                topoInventario - 6,
            )
        })

        this.statusText.setPosition(
            area.centerX,
            area.bottom - margem,
        )
    }

    private mostrarStatus(
        texto: string,
        fixo = false,
    ): void {
        this.tweenStatus?.remove()
        this.tweenStatus = undefined

        this.statusText.setText(texto)
        this.statusText
            .setAlpha(1)
            .setVisible(texto !== '')

        if (fixo || texto === '') {
            return
        }

        this.tweenStatus =
            this.tweens.add({
                targets: this.statusText,
                alpha: 0,
                delay: 2500,
                duration: 600,
                onComplete: () => {
                    this.statusText.setVisible(false)
                    this.tweenStatus = undefined
                },
            })
    }

    private updateLivesHud(
        lives: number,
    ): void {
        this.coracoes.forEach((coracao, indice) => {
            coracao.setTexture(
                indice < lives
                    ? 'coracao-cheio'
                    : 'coracao-vazio',
            )
        })
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

function criarTexturasCoracao(
    cena: Phaser.Scene,
): void {
    const variantes = [
        { chave: 'coracao-cheio', cores: { o: '#2a0f0a', r: '#e2453a', R: '#e2453a', w: '#ffb3a8' } },
        { chave: 'coracao-vazio', cores: { o: '#2a0f0a', r: '#4a3329', R: '#4a3329', w: '#4a3329' } },
    ] as const

    for (const { chave, cores } of variantes) {
        if (cena.textures.exists(chave)) {
            continue
        }

        const largura = CORACAO[0].length * PIXEL_CORACAO
        const altura = CORACAO.length * PIXEL_CORACAO
        const textura =
            cena.textures.createCanvas(chave, largura, altura)!
        const ctx = textura.getContext()

        CORACAO.forEach((linha, y) => {
            ;[...linha].forEach((pixel, x) => {
                if (pixel === '.') {
                    return
                }
                ctx.fillStyle = cores[pixel as keyof typeof cores]
                ctx.fillRect(
                    x * PIXEL_CORACAO,
                    y * PIXEL_CORACAO,
                    PIXEL_CORACAO,
                    PIXEL_CORACAO,
                )
            })
        })

        textura.refresh()
    }
}
