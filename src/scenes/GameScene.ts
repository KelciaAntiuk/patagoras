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

import {
    getActorCenter,
} from '../system/Collision/LineOfSight'

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
    PLAYER_CONFIG,
} from '../characters/Player/Player.config'

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
    PuzzleEstado,
} from '../system/Puzzle/Puzzle.types'

import type {
    PuzzleFechamento,
} from '../system/Puzzle/Puzzle.types'

import {
    PuzzleDoorSystem,
} from '../system/Door/PuzzleDoorSystem'

import {
    DOOR_EVENTS,
} from '../system/Door/PuzzleDoor.types'

import type {
    PuzzleDoorDefinition,
} from '../system/Door/PuzzleDoor.types'

import type {
    PuzzleDoor,
} from '../system/Door/PuzzleDoor'

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

const PICKUP_RADIUS = PLAYER_CONFIG.interactionRadius

const SPAWN_JOGADOR_X = 470
const SPAWN_JOGADOR_Y = 600

const PUZZLE_TESTE_X = 480
const PUZZLE_TESTE_Y = 660

const PORTA_SPRITESHEETS: readonly {
    readonly key: string
    readonly path: string
    readonly frameWidth: number
    readonly frameHeight: number
}[] = [
    {
        key: 'porta-biblioteca',
        path: 'assets/tilesets/portabiblioteca.png',
        frameWidth: 32,
        frameHeight: 32,
    },
    {
        key: 'porta_cozinha',
        path: 'assets/tilesets/portadacozinha.png',
        frameWidth: 32,
        frameHeight: 32,
    },
    {
        key: 'porta-diretoria',
        path: 'assets/tilesets/portadiretoria.png',
        frameWidth: 32,
        frameHeight: 32,
    },
    {
        key: 'porta-secreta',
        path: 'assets/tilesets/portaesconderijo.png',
        frameWidth: 48,
        frameHeight: 16,
    },
    {
        key: 'porta-tutorial',
        path: 'assets/tilesets/portarefeitorio.png',
        frameWidth: 48,
        frameHeight: 48,
    },
    {
        key: 'porta_sala_1',
        path: 'assets/tilesets/portassala1.png',
        frameWidth: 32,
        frameHeight: 32,
    },
    {
        key: 'porta_sala_2',
        path: 'assets/tilesets/portassala2.png',
        frameWidth: 32,
        frameHeight: 32,
    },
]

const PORTA_TEXTURA_POR_ID: Readonly<Record<string, string>> = {
    'porta-biblioteca': 'porta-biblioteca',
    'porta_cozinha': 'porta_cozinha',
    'porta-cozinha': 'porta_cozinha',
    'porta-diretoria': 'porta-diretoria',
    'porta-secreta': 'porta-secreta',
    'porta-tutorial': 'porta-tutorial',
    'porta-refeitorio': 'porta-tutorial',
    'porta_sala_1': 'porta_sala_1',
    'porta-sala-aula-1': 'porta_sala_1',
    'porta_sala_2': 'porta_sala_2',
    'porta-sala-aula-2': 'porta_sala_2',
}

const PORTA_OBJETO_TILED_POR_ID: Readonly<Record<string, string>> = {
    'porta-refeitorio': 'porta-tutorial',
    'porta-cozinha': 'porta_cozinha',
    'porta-sala-aula-1': 'porta_sala_1',
    'porta-biblioteca': 'porta-biblioteca',
}

const PORTAS: readonly PuzzleDoorDefinition[] = [
    {
        id: 'porta-refeitorio',
        x: 476,
        y: 572,
        largura: 48,
        altura: 32,
        condicao: { tipo: 'puzzle', puzzleId: 'refeitorio' },
        mensagemAbrir: 'O refeitório foi destrancado.',
        textureKey: PORTA_TEXTURA_POR_ID['porta-refeitorio'],
        closeFrame: 0,
        openFrame: 1,
        manterEscalaNativa: true,
        originY: 2 / 3,
    },
    {
        id: 'porta-cozinha',
        x: 252,
        y: 484,
        largura: 16,
        altura: 32,
        condicao: { tipo: 'puzzle', puzzleId: 'entrada-cozinha' },
        mensagemAbrir: 'A cozinha foi destrancada.',
        textureKey: PORTA_TEXTURA_POR_ID['porta-cozinha'],
        closeFrame: 0,
        openFrame: 1,
    },
    {
        id: 'porta-sala-aula-1',
        x: 276,
        y: 412,
        largura: 32,
        altura: 16,
        condicao: { tipo: 'puzzle', puzzleId: 'sala-aula-1' },
        mensagemAbrir: 'A sala de aula 1 e a biblioteca foram destrancadas!',
        textureKey: PORTA_TEXTURA_POR_ID['porta-sala-aula-1'],
        closeFrame: 0,
        openFrame: 1,
    },
    ]

const PORTA_BIBLIOTECA_ID = 'porta-biblioteca'
const PORTA_DIRETORIA_ID = 'porta-diretoria'
const PORTA_AVALIACAO_ID = 'porta-avaliacao-final'

// SAÍDA: a chave aparece perto da porta de saída depois da avaliação final.
const PORTA_SAIDA: PuzzleDoorDefinition = {
    id: 'porta-saida',
    x: 486,
    // topo da porta alinhado ao topo da parede de baixo (y = 692)
    y: 692 + 29 / 2,
    largura: 48,
    altura: 29,
    textureKey: 'porta-dupla-fechada',
    condicao: { tipo: 'item', itemId: 'chave-saida' },
    mensagemTrancada: 'Saída trancada. Precisa de uma chave.',
    mensagemAbrir: 'Você destrancou a saída e escapou do internato!',
}

const CHAVE_SAIDA: ItemDefinition = {
    id: 'chave-saida',
    name: 'Chave da saída',
    description: 'A chave que abre a porta de saída do internato.',
    textureKey: 'sprite-chave',
    kind: ItemKind.Generic,
}

// Recortes da porta dupla de madeira no Dungeon_Tileset.png
const PORTA_DUPLA_FECHADA = { key: 'porta-dupla-fechada', x: 10, y: 595, w: 48, h: 29 }

// Parede grossa na parte de baixo da sala da saída (mesma altura da porta)
const PAREDE_SAIDA = { x: 340, y: 692, largura: 272, altura: 29 }
const COR_PAREDE = 0x44342c
const COR_PAREDE_TOPO = 0x5a463a
const COR_PAREDE_BASE = 0x2a1f19

const CHAVE_SAIDA_X = 486
const CHAVE_SAIDA_Y = 664

const COMIDA: ItemDefinition = {
    id: 'food-can',
    name: 'Lata de comida',
    description:
        'Uma lata fechada encontrada no internato.',
    textureKey:
        'sprite-comida',
    kind:
        ItemKind.Food,
}

// Cada área só tem as peças do puzzle que destranca a próxima.
// Dígitos repetidos (1 e 3) nunca ficam acessíveis antes da hora,
// para uma peça de um puzzle posterior não resolver um anterior.
const ITENS_DOS_PUZZLES: readonly {
    readonly item: ItemDefinition
    readonly x: number
    readonly y: number
    readonly cor: number
}[] = [
    // SAGUÃO (início): peças do refeitório (13) e uma comida para aprender o Q
    {
        item: COMIDA,
        x: 372,
        y: 604,
        cor: 0xe67e22,
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
        x: 372,
        y: 676,
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
        x: 580,
        y: 652,
        cor: 0x55efc4,
    },

    // REFEITÓRIO + SALA 2: peças da sala 2 (24), da porta da cozinha (6)
    // e o 1 da porta da sala 1, longe da porta, perto de onde o Patágoras ronda
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
        x: 284,
        y: 548,
        cor: 0xfdcb6e,
    },
    {
        item: {
            id: 'number-six',
            name: 'Número 6',
            description:
                'Um seis de metal, arrancado de alguma porta.',
            textureKey:
                'sprite-numero-6',
            kind: ItemKind.Number,
            value: 6,
        },
        x: 468,
        y: 330,
        cor: 0x16a085,
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
        x: 580,
        y: 548,
        cor: 0xdfe6e9,
    },

    // COZINHA: o 9 da porta da sala 1, comida extra e o 7 da avaliação
    // final, que aparece cedo de propósito e só serve lá no fim
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
        x: 164,
        y: 548,
        cor: 0x81ecec,
    },
    {
        item: COMIDA,
        x: 196,
        y: 516,
        cor: 0xe67e22,
    },
    {
        item: {
            id: 'avaliacao-numero-7',
            name: 'Número 7',
            description:
                'Um sete escrito a caneta vermelha, rasgado de uma prova corrigida.',
            textureKey:
                'sprite-numero-7',
            kind: ItemKind.Number,
            value: 7,
        },
        x: 164,
        y: 436,
        cor: 0xe17055,
    },

    // SALA 1 + BIBLIOTECA (abrem juntas): páginas do armário (381)
    {
        item: {
            id: 'biblioteca-numero-8',
            name: 'Página 8',
            description:
                'Página 8 antiga com anotações e número destacado.',
            textureKey:
                'sprite-numero-8',
            kind: ItemKind.Number,
            value: 8,
        },
        x: 172,
        y: 326,
        cor: 0x74b9ff,
    },
    {
        item: {
            id: 'biblioteca-numero-3',
            name: 'Página 3',
            description:
                'Página 3 arrancada de um livro marcado da biblioteca.',
            textureKey:
                'sprite-numero-3',
            kind: ItemKind.Number,
            value: 3,
        },
        x: 516,
        y: 324,
        cor: 0xff7675,
    },
    {
        item: {
            id: 'biblioteca-numero-1',
            name: 'Página 1',
            description:
                'Página 1 marcada com o primeiro dígito do código.',
            textureKey:
                'sprite-numero-1',
            kind: ItemKind.Number,
            value: 1,
        },
        x: 716,
        y: 388,
        cor: 0xffeaa7,
    },
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

    /** Enquanto true, a escuridão segue a câmera (revelação da chave). */
    private revelandoChave = false

    private escuridao!:
        Phaser.GameObjects.Image

    private playerLife!:
        PlayerLifeSystem

    private collision!:
        CollisionSystem

    private puzzles!:
        PuzzleSystem

    private doorSystem!:
        PuzzleDoorSystem

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

    private layersMoveisInvisiveis:
        Phaser.Tilemaps.TilemapLayer[] = []

    private salasLayers =
        new Map<string, Phaser.Tilemaps.TilemapLayer[]>()

    private salasChao =
        new Map<string, Phaser.Tilemaps.TilemapLayer>()

    private portasVisuais: {
        readonly sprite: Phaser.GameObjects.Sprite
        readonly salas: ReadonlySet<string>
    }[] = []

    private salaAtual: string | null = null

    private hiddenTiles:
        Phaser.Tilemaps.Tile[] = []

    private debugVisible = false

    private solidObstaclesCache:
        readonly WorldRect[] = []

    private solidObstaclesDirty = true

    private ultimaDirecao:
        | 'frente'
        | 'diagonal-baixo'
        | 'lado'
        | 'diagonal-cima'
        | 'cima' = 'frente'
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

        for (const portaSheet of PORTA_SPRITESHEETS) {
            this.load.spritesheet(
                portaSheet.key,
                portaSheet.path,
                {
                    frameWidth: portaSheet.frameWidth,
                    frameHeight: portaSheet.frameHeight,
                },
            )
        }

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

        this.load.image('sprite-pilha', 'assets/sprites/puzzles/pilha.png')
        this.load.image('sprite-comida', 'assets/sprites/puzzles/lata-comida.png')
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

        this.layersMoveisInvisiveis = []
        this.salasLayers.clear()
        this.salasChao.clear()
        this.portasVisuais = []
        this.salaAtual = null
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

            const barraIdx = nome.indexOf('/')
            if (barraIdx > 0) {
                const nomeSala = nome.slice(0, barraIdx)
                let grupoLayers = this.salasLayers.get(nomeSala)
                if (!grupoLayers) {
                    grupoLayers = []
                    this.salasLayers.set(nomeSala, grupoLayers)
                }
                grupoLayers.push(layer)

                if (nomeLower.includes('mapa bruto')) {
                    this.salasChao.set(nomeSala, layer)
                }
            }

            if (nomeLower.includes('mapa bruto')) {
                layer.setDepth(0)
            } else if (nomeLower.includes('detalhes de solo')) {
                layer.setDepth(1)
            } else if (nomeLower.includes('paredes 2')) {
                layer.setDepth(3)
            } else if (nomeLower.includes('paredes invisiveis')) {
                layer.setDepth(10)
            } else if (nomeLower.includes('paredes')) {
                layer.setDepth(2)
            } else if (nomeLower.includes('mobilha invisivel')) {
                layer.setDepth(10)
                this.layersMoveisInvisiveis.push(layer)
            } else if (nomeLower.includes('mobilha por cima da parede')) {
                layer.setDepth(11)
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
        this.player
            .setScale(PLAYER_CONFIG.scale)
            .setDepth(20)
        // Hitbox na base/pés (10x8) separada das dimensões visuais do frame 24x24 (offset 7, 16)
        this.player.setSize(
            PLAYER_CONFIG.bodyWidth,
            PLAYER_CONFIG.bodyHeight,
        )
        this.player.setOffset(
            PLAYER_CONFIG.bodyOffsetX,
            PLAYER_CONFIG.bodyOffsetY,
        )

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

                    getObstacles: () =>
                        this.getSolidObstacles(),
                },
            )

        // COLISÕES DO MAPA (usa apenas as camadas 'colisao' e 'colisao moveis' do Tiled)
        const wallRects = layerColisao
            ? this.extractWallRects([layerColisao])
            : []

        const furnitureRects =
            this.extractObjectLayerRects(
                map,
                'colisao moveis',
                mapOriginX - refX,
                mapOriginY - refY,
            )

        const collisionRects: readonly WorldRect[] = [
            ...wallRects,
            ...furnitureRects,
        ]

        this.collision
            .buildWalls(
                collisionRects,
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
                collisionRects,
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

                    raioInteracao:
                        PICKUP_RADIUS,

                    getObstacles: () =>
                        this.getSolidObstacles(),
                },
            )

        // GATILHOS DA BIBLIOTECA
        this.puzzles
            .adicionarGatilho(
                548,
                356,
                'biblioteca-pista',
            )

        this.puzzles
            .adicionarGatilho(
                644,
                356,
                'biblioteca-senha',
            )


        this.criarPortas(
            map,
            mapOriginX - refX,
            mapOriginY - refY,
        )



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
        this.spawnItensDosPuzzles()

        this.atualizarVisibilidadeSala(true)

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
                this.doorSystem
                    .destroy()

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

                this.solidObstaclesCache = []
                this.solidObstaclesDirty = true
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

        if (this.revelandoChave) {
            const centro = this.cameras.main.midPoint
            this.escuridao.setPosition(centro.x, centro.y)
        } else {
            this.escuridao.setPosition(
                this.player.x,
                this.player.y,
            )
        }

        // ATUALIZA QUAL ITEM ESTÁ
        // MAIS PRÓXIMO DO PLAYER
        this.collision.update()

        this.puzzles.update()

        this.doorSystem.update()

        // E = INTERAÇÃO (COLETA ITEM SE FOCADO -> PORTA -> GATILHO PUZZLE)
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
            } else if (
                !this.doorSystem
                    .interagir()
            ) {
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

        this.atualizarVisibilidadeSala()

        if (this.layersMoveisInvisiveis.length > 0) {
            // Restaura os móveis que deixaram de cobrir o personagem
            for (const tile of this.hiddenTiles) {
                tile.alpha = 1
            }
            this.hiddenTiles = []

            // Pega apenas os blocos de móveis invisíveis que estão sobre o personagem
            for (const layerInvisivel of this.layersMoveisInvisiveis) {
                if (!layerInvisivel.visible) {
                    continue
                }
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
                        tile.alpha = 0 // Apenas este móvel sobre o player fica invisível!
                        this.hiddenTiles.push(tile)
                    }
                }
            }
        }
    }

    private getSolidObstacles(): readonly WorldRect[] {
        if (!this.doorSystem) {
            return this.collision.walls.getWallRects()
        }
        if (this.solidObstaclesDirty) {
            const wallRects =
                this.collision.walls.getWallRects()
            const closedDoors =
                this.doorSystem.getClosedDoorRects()
            this.solidObstaclesCache =
                closedDoors.length === 0
                    ? wallRects
                    : [...wallRects, ...closedDoors]
            this.solidObstaclesDirty = false
        }
        return this.solidObstaclesCache
    }

    private descobrirSala(
        x: number,
        y: number,
        preferencia?: string | null,
    ): string | null {
        if (preferencia) {
            const chaoPreferido = this.salasChao.get(preferencia)
            const tile = chaoPreferido?.getTileAtWorldXY(x, y)
            if (tile && tile.index > 0) {
                return preferencia
            }
        }

        for (const [sala, chaoLayer] of this.salasChao) {
            if (sala === preferencia) {
                continue
            }
            const tile = chaoLayer.getTileAtWorldXY(x, y)
            if (tile && tile.index > 0) {
                return sala
            }
        }

        return null
    }

    private atualizarVisibilidadeSala(forcar = false): void {
        if (this.salasChao.size === 0) {
            return
        }

        const playerBody =
            this.player.body as Phaser.Physics.Arcade.Body | null
        const px = playerBody ? playerBody.center.x : this.player.x
        const py = playerBody ? playerBody.center.y : this.player.y

        const novaSala = this.descobrirSala(px, py, this.salaAtual)
        const trocouSala =
            novaSala !== null && novaSala !== this.salaAtual

        if (trocouSala) {
            this.salaAtual = novaSala
        }

        if (this.salaAtual && (trocouSala || forcar)) {
            for (const [sala, layers] of this.salasLayers) {
                const visivel = sala === this.salaAtual
                for (const layer of layers) {
                    layer.setVisible(visivel)
                }
            }

            for (const pickup of this.collision.pickups.getPickups()) {
                if (!pickup.active) {
                    continue
                }
                const salaItem = this.descobrirSala(
                    pickup.x,
                    pickup.y,
                    this.salaAtual,
                )
                pickup.setVisible(
                    salaItem === null || salaItem === this.salaAtual,
                )
            }

            for (const portaVisual of this.portasVisuais) {
                if (!portaVisual.sprite.active) {
                    continue
                }
                portaVisual.sprite.setVisible(
                    portaVisual.salas.size === 0 ||
                        portaVisual.salas.has(this.salaAtual),
                )
            }
        }

        if (this.salaAtual && this.patagoras?.sprite) {
            const patoBody =
                this.patagoras.sprite.body as
                    | Phaser.Physics.Arcade.Body
                    | null
            const patoX = patoBody
                ? patoBody.center.x
                : this.patagoras.sprite.x
            const patoY = patoBody
                ? patoBody.center.y
                : this.patagoras.sprite.y
            const salaPato = this.descobrirSala(
                patoX,
                patoY,
                this.salaAtual,
            )
            if (salaPato !== null) {
                this.patagoras.sprite.setVisible(
                    salaPato === this.salaAtual,
                )
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

        const horizontalRects: WorldRect[] = []
        rows.forEach((xList, y) => {
            xList.sort((a, b) => a - b)
            let startX = xList[0]
            let prevX = xList[0]
            for (let i = 1; i < xList.length; i++) {
                if (xList[i] === prevX + 16) {
                    prevX = xList[i]
                } else {
                    horizontalRects.push({
                        x: startX,
                        y,
                        width: prevX - startX + 16,
                        height: 16,
                    })
                    startX = xList[i]
                    prevX = xList[i]
                }
            }
            horizontalRects.push({
                x: startX,
                y,
                width: prevX - startX + 16,
                height: 16,
            })
        })

        horizontalRects.sort((a, b) =>
            a.x !== b.x
                ? a.x - b.x
                : a.width !== b.width
                  ? a.width - b.width
                  : a.y - b.y,
        )

        const mergedRects: WorldRect[] = []
        for (const rect of horizontalRects) {
            const last = mergedRects[mergedRects.length - 1]
            if (
                last &&
                last.x === rect.x &&
                last.width === rect.width &&
                last.y + last.height === rect.y
            ) {
                mergedRects[mergedRects.length - 1] = {
                    x: last.x,
                    y: last.y,
                    width: last.width,
                    height: last.height + rect.height,
                }
            } else {
                mergedRects.push(rect)
            }
        }

        return mergedRects
    }

    private extractObjectLayerRects(
        map: Phaser.Tilemaps.Tilemap,
        layerName: string,
        offsetX: number,
        offsetY: number,
    ): readonly WorldRect[] {
        const objectLayer = map.objects.find(
            (layer) =>
                layer.name.toLowerCase() ===
                layerName.toLowerCase(),
        )

        if (!objectLayer) {
            return []
        }

        const rects: WorldRect[] = []

        for (const obj of objectLayer.objects) {
            if (obj.point || obj.visible === false) {
                continue
            }

            const baseX = (obj.x ?? 0) + offsetX
            const baseY = (obj.y ?? 0) + offsetY

            if (obj.polygon && obj.polygon.length >= 3) {
                const points = obj.polygon.map((p) => ({
                    x: baseX + p.x,
                    y: baseY + p.y,
                }))

                rects.push(
                    ...this.polygonToRects(points),
                )
                continue
            }

            const width = obj.width ?? 0
            const height = obj.height ?? 0

            if (width >= 1 || height >= 1) {
                const minThickness = 2
                const rectW = Math.max(width, minThickness)
                const rectH = Math.max(height, minThickness)
                const rectX =
                    width < minThickness
                        ? baseX - (rectW - width) / 2
                        : baseX
                const rectY =
                    height < minThickness
                        ? baseY - (rectH - height) / 2
                        : baseY

                rects.push({
                    x: rectX,
                    y: rectY,
                    width: rectW,
                    height: rectH,
                })
            }
        }

        return rects
    }

    private polygonToRects(
        points: readonly { x: number; y: number }[],
    ): readonly WorldRect[] {
        let minX = Infinity
        let maxX = -Infinity
        let minY = Infinity
        let maxY = -Infinity
        let area2 = 0

        for (let i = 0; i < points.length; i++) {
            const p1 = points[i]
            const p2 = points[(i + 1) % points.length]
            if (p1.x < minX) minX = p1.x
            if (p1.x > maxX) maxX = p1.x
            if (p1.y < minY) minY = p1.y
            if (p1.y > maxY) maxY = p1.y
            area2 += p1.x * p2.y - p2.x * p1.y
        }

        const bboxW = maxX - minX
        const bboxH = maxY - minY
        if (bboxW < 1 && bboxH < 1) {
            return []
        }

        const minThickness = 2
        const fillRatio =
            bboxW * bboxH > 0
                ? Math.abs(area2) / 2 / (bboxW * bboxH)
                : 1

        // Polígonos quase retangulares (ou muito finos) viram um único retângulo
        if (
            fillRatio >= 0.85 ||
            bboxW < minThickness ||
            bboxH < minThickness
        ) {
            const rectW = Math.max(bboxW, minThickness)
            const rectH = Math.max(bboxH, minThickness)
            return [{
                x: bboxW < minThickness ? minX - (rectW - bboxW) / 2 : minX,
                y: bboxH < minThickness ? minY - (rectH - bboxH) / 2 : minY,
                width: rectW,
                height: rectH,
            }]
        }

        // Polígonos em L / côncavos são decompostos em faixas horizontais
        // usando as coordenadas Y dos próprios vértices para não pular partes finas
        const sortedYs = Array.from(
            new Set(points.map((p) => p.y)),
        ).sort((a, b) => a - b)

        const rawStrips: WorldRect[] = []

        for (let b = 0; b + 1 < sortedYs.length; b++) {
            const yTop = sortedYs[b]
            const yBot = sortedYs[b + 1]
            const bandH = yBot - yTop
            if (bandH <= 0.01) {
                continue
            }

            const sampleY = (yTop + yBot) / 2
            const intersections: number[] = []

            for (let i = 0; i < points.length; i++) {
                const a = points[i]
                const bPt = points[(i + 1) % points.length]
                if (
                    (a.y <= sampleY && bPt.y > sampleY) ||
                    (bPt.y <= sampleY && a.y > sampleY)
                ) {
                    const t = (sampleY - a.y) / (bPt.y - a.y)
                    intersections.push(
                        a.x + t * (bPt.x - a.x),
                    )
                }
            }

            intersections.sort((a, bVal) => a - bVal)

            for (let i = 0; i + 1 < intersections.length; i += 2) {
                const x1 = intersections[i]
                const x2 = intersections[i + 1]
                const w = x2 - x1
                if (w >= 1) {
                    rawStrips.push({
                        x: x1,
                        y: yTop,
                        width: w,
                        height: bandH,
                    })
                }
            }
        }

        // Mescla faixas verticais adjacentes com mesma largura e posição X
        const merged: WorldRect[] = []
        for (const strip of rawStrips) {
            const match = merged.find(
                (r) =>
                    Math.abs(r.x - strip.x) < 1.5 &&
                    Math.abs(r.width - strip.width) < 1.5 &&
                    Math.abs(r.y + r.height - strip.y) < 0.5,
            )
            if (match) {
                const idx = merged.indexOf(match)
                merged[idx] = {
                    x: Math.min(match.x, strip.x),
                    y: match.y,
                    width: Math.max(match.width, strip.width),
                    height: match.height + strip.height,
                }
            } else {
                merged.push(strip)
            }
        }

        const ensured = merged.map((r) => {
            if (r.height >= minThickness) {
                return r
            }
            return {
                x: r.x,
                y: r.y - (minThickness - r.height) / 2,
                width: r.width,
                height: minThickness,
            }
        })

        return ensured.length > 0
            ? ensured
            : [{
                x: minX,
                y: minY,
                width: Math.max(bboxW, minThickness),
                height: Math.max(bboxH, minThickness),
            }]
    }

    private criarPortas(
        map: Phaser.Tilemaps.Tilemap,
        offsetX: number,
        offsetY: number,
    ):
        void {

        const objectLayerPortas = map.objects.find(
            (layer) => layer.name.toLowerCase() === 'portas',
        )

        const portasTiled = new Map<
            string,
            { x: number; y: number; largura: number; altura: number }
        >()

        if (objectLayerPortas) {
            for (const obj of objectLayerPortas.objects) {
                const nome = obj.name?.trim()
                const largura = Math.round(obj.width ?? 0)
                const altura = Math.round(obj.height ?? 0)
                if (!nome || largura < 1 || altura < 1) {
                    continue
                }
                const wx = (obj.x ?? 0) + offsetX
                const wy = (obj.y ?? 0) + offsetY
                portasTiled.set(nome, {
                    x: Math.round(wx + (obj.width ?? 0) / 2),
                    y: Math.round(wy + (obj.height ?? 0) / 2),
                    largura,
                    altura,
                })
            }
        }

        const aplicarPosicaoTiled = (
            def: PuzzleDoorDefinition,
        ): PuzzleDoorDefinition => {
            const nomeTiled = PORTA_OBJETO_TILED_POR_ID[def.id] ?? def.id
            const dados = portasTiled.get(nomeTiled)
            if (!dados) {
                return def
            }
            return {
                ...def,
                x: dados.x,
                y: dados.y,
                largura: dados.largura,
                altura: dados.altura,
            }
        }
        this.criarTexturasPortaDupla()

        this.doorSystem =
            new PuzzleDoorSystem(
                this,
                {
                    jogador:
                        this.player,
                    atoresColisao: [
                        this.patagoras.sprite,
                    ],
                    inventario:
                        this.inventory,
                    puzzles:
                        this.puzzles,
                    raioInteracao:
                        PICKUP_RADIUS,
                    getObstacles: () =>
                        this.getSolidObstacles(),
                },
            )

        const registrarObstaculoPorta = (
            porta: PuzzleDoor,
        ): void => {
            const isRefeitorio =
                porta.id === 'porta-refeitorio'
            const rect: WorldRect = {
                x:
                    porta.def.x -
                    porta.def.largura / 2,
                y: isRefeitorio
                    ? 564
                    : porta.def.y -
                      porta.def.altura / 2,
                width: porta.def.largura,
                height: isRefeitorio
                    ? 32
                    : porta.def.altura,
            }

            this.solidObstaclesDirty = true

            this.patagorasPathfinder.setDynamicObstacle(
                porta.id,
                rect,
                !porta.isOpen,
            )

            porta.on(
                DOOR_EVENTS.OPENED,
                () => {
                    this.solidObstaclesDirty = true
                    this.patagorasPathfinder.setDynamicObstacle(
                        porta.id,
                        rect,
                        false,
                    )
                },
            )

            porta.on(
                DOOR_EVENTS.CLOSED,
                () => {
                    this.solidObstaclesDirty = true
                    this.patagorasPathfinder.setDynamicObstacle(
                        porta.id,
                        rect,
                        true,
                    )
                },
            )
        }

        const registrarPortaVisual = (
            sprite: Phaser.GameObjects.Sprite,
            x: number,
            y: number,
            largura: number,
            altura: number,
        ): void => {
            const salas = new Set<string>()
            const margem = 8
            const pontos = [
                [x, y],
                [x, y - altura / 2 - margem],
                [x, y + altura / 2 + margem],
                [x - largura / 2 - margem, y],
                [x + largura / 2 + margem, y],
            ]

            for (const [px, py] of pontos) {
                for (const [sala, chaoLayer] of this.salasChao) {
                    const tile = chaoLayer.getTileAtWorldXY(px, py)
                    if (tile && tile.index > 0) {
                        salas.add(sala)
                    }
                }
            }

            this.portasVisuais.push({ sprite, salas })
        }

        const nomesPortasComSistema = new Set<string>()

        PORTAS.forEach(
            (def) => {
                const defFinal = aplicarPosicaoTiled(def)
                const nomeTiled = PORTA_OBJETO_TILED_POR_ID[def.id] ?? def.id
                nomesPortasComSistema.add(nomeTiled)
                const porta =
                    this.doorSystem
                        .adicionarPorta(
                            defFinal,
                        )
                registrarObstaculoPorta(porta)
                registrarPortaVisual(
                    porta,
                    defFinal.x,
                    defFinal.y,
                    defFinal.largura,
                    defFinal.altura,
                )
            },
        )

        // PORTA DA BIBLIOTECA: só destranca depois do puzzle da sala 1.
        // Usa callback (e não puzzleId) porque o puzzle da sala 1 já
        // está vinculado à porta da própria sala 1.
        nomesPortasComSistema.add(PORTA_BIBLIOTECA_ID)
        const defBiblioteca = aplicarPosicaoTiled({
            id: PORTA_BIBLIOTECA_ID,
            x: 564,
            y: 412,
            largura: 32,
            altura: 16,
            condicao: {
                tipo: 'callback',
                fn: () =>
                    this.puzzles
                        .estado('sala-aula-1') ===
                    PuzzleEstado.Resolvido,
            },
            mensagemTrancada: 'Biblioteca trancada',
            mensagemAbrir: 'A biblioteca foi destrancada.',
            textureKey: PORTA_TEXTURA_POR_ID[PORTA_BIBLIOTECA_ID],
            closeFrame: 0,
            openFrame: 1,
        })
        const portaBiblioteca =
            this.doorSystem
                .adicionarPorta(defBiblioteca)
        registrarObstaculoPorta(portaBiblioteca)
        registrarPortaVisual(
            portaBiblioteca,
            defBiblioteca.x,
            defBiblioteca.y,
            defBiblioteca.largura,
            defBiblioteca.altura,
        )

        // Sprites visuais das demais portas da camada 'Portas' que já começam abertas
        portasTiled.forEach((dados, nomeTiled) => {
            if (nomesPortasComSistema.has(nomeTiled)) {
                return
            }
            const textureKey = PORTA_TEXTURA_POR_ID[nomeTiled]
            if (!textureKey || !this.textures.exists(textureKey)) {
                return
            }
            const sprite = this.add
                .sprite(dados.x, dados.y, textureKey, 1)
                .setDisplaySize(dados.largura, dados.altura)
                .setDepth(5)
            registrarPortaVisual(
                sprite,
                dados.x,
                dados.y,
                dados.largura,
                dados.altura,
            )

        // PORTA DA DIRETORIA (SALA DA AVALIAÇÃO FINAL):
        // só destranca depois do armário da biblioteca.
        const portaDiretoria =
            this.doorSystem
                .adicionarPorta({
                    id: PORTA_DIRETORIA_ID,
                    x: 604,
                    y: 484,
                    largura: 16,
                    altura: 32,
                    condicao: {
                        tipo: 'callback',
                        fn: () =>
                            this.puzzles
                                .estado('biblioteca-senha') ===
                            PuzzleEstado.Resolvido,
                    },
                    mensagemTrancada: 'Diretoria trancada',
                    mensagemAbrir: 'A diretoria foi destrancada.',
                })
        registrarObstaculoPorta(portaDiretoria)

        // PORTA DA AVALIAÇÃO FINAL (corredor dentro da diretoria,
        // marcada no mapa como "porta-secreta"): a própria porta é o
        // puzzle 'avaliacao-final' (3x + 4 = 25).
        const portaAvaliacao =
            this.doorSystem
                .adicionarPorta({
                    id: PORTA_AVALIACAO_ID,
                    x: 668,
                    y: 524,
                    largura: 48,
                    altura: 29,
                    textureKey: PORTA_DUPLA_FECHADA.key,
                    condicao: {
                        tipo: 'puzzle',
                        puzzleId: 'avaliacao-final',
                    },
                })
        registrarObstaculoPorta(portaAvaliacao)

        this.criarParedeSaida()

        const portaSaida =
            this.doorSystem.adicionarPorta(PORTA_SAIDA)
        registrarObstaculoPorta(portaSaida)

        portaSaida.on(DOOR_EVENTS.UNLOCKED, () => {
            if (PORTA_SAIDA.mensagemAbrir) {
                this.mostrarStatus(PORTA_SAIDA.mensagemAbrir)
            }

            // Mostra a porta abrindo e depois o modal de vitória
            this.time.delayedCall(700, () => {
                this.scene.launch('VitoriaScene')
                this.scene.pause()
            })
        })
    }

    /** Desenha a parede grossa onde fica a porta de saída. */
    private criarParedeSaida(): void {
        const { x, y, largura, altura } = PAREDE_SAIDA
        this.add
            .graphics()
            .setDepth(4) // acima do mapa, abaixo da porta (5)
            .fillStyle(COR_PAREDE)
            .fillRect(x, y, largura, altura)
            .fillStyle(COR_PAREDE_TOPO)
            .fillRect(x, y, largura, 2)
            .fillStyle(COR_PAREDE_BASE)
            .fillRect(x, y + altura - 3, largura, 3)
    }

    /** Recorta a porta dupla fechada do Dungeon_Tileset. */
    private criarTexturasPortaDupla(): void {
        const fonte = this.textures
            .get('dungeon-tileset')
            .getSourceImage() as HTMLImageElement

        for (const recorte of [PORTA_DUPLA_FECHADA]) {
            if (this.textures.exists(recorte.key)) continue
            const canvas = this.textures.createCanvas(
                recorte.key,
                recorte.w,
                recorte.h,
            )!
            canvas.context.imageSmoothingEnabled = false
            canvas.context.drawImage(
                fonte,
                recorte.x, recorte.y, recorte.w, recorte.h,
                0, 0, recorte.w, recorte.h,
            )
            canvas.refresh()
        }
    }

    /**
     * Faz a chave da saída aparecer e leva a câmera até ela,
     * voltando para o jogador em seguida. O jogo fica pausado
     * durante a animação para o Patágoras não atacar.
     */
    private revelarChaveSaida(): void {
        this.collision.spawnPickup(
            CHAVE_SAIDA_X,
            CHAVE_SAIDA_Y,
            CHAVE_SAIDA,
        )

        const camera = this.cameras.main
        const IDA_MS = 900
        const PAUSA_MS = 1200
        const VOLTA_MS = 700

        this.revelandoChave = true
        this.physics.pause()
        camera.stopFollow()
        camera.pan(CHAVE_SAIDA_X, CHAVE_SAIDA_Y, IDA_MS, 'Sine.easeInOut')

        this.time.delayedCall(IDA_MS + PAUSA_MS, () => {
            camera.pan(this.player.x, this.player.y, VOLTA_MS, 'Sine.easeInOut')

            this.time.delayedCall(VOLTA_MS, () => {
                camera.startFollow(this.player, true, 0.2, 0.2)
                this.physics.resume()
                this.revelandoChave = false
            })
        })
    }

    private abrirPorta(
        puzzleId: PuzzleId,
    ): boolean {

        const porta =
            this.doorSystem
                .getPortaPorPuzzle(
                    puzzleId,
                )

        if (!porta) return false

        if (porta.isLocked) {
            porta.unlock()
        } else if (!porta.isOpen) {
            porta.openDoor()
        }

        if (
            porta.def
                .mensagemAbrir
        ) {
            this.mostrarStatus(
                porta.def
                    .mensagemAbrir,
            )
        }

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
                // SALA 1 RESOLVIDA -> DESTRANCA TAMBÉM A BIBLIOTECA
                if (puzzleId === 'sala-aula-1') {
                    const portaBiblioteca =
                        this.doorSystem
                            .getPorta(
                                PORTA_BIBLIOTECA_ID,
                            )

                    if (portaBiblioteca?.isLocked) {
                        portaBiblioteca.unlock()
                    }
                }

                // AVALIAÇÃO FINAL: abre a porta e revela a chave da saída
                if (puzzleId === 'avaliacao-final') {
                    this.abrirPorta(puzzleId)
                    this.mostrarStatus(
                        'Avaliação final concluída! Uma chave apareceu perto da saída.',
                    )
                    this.revelarChaveSaida()
                    return
                }

                if (
                    this.abrirPorta(
                        puzzleId,
                    )
                ) {
                    return
                }

                if (puzzleId === 'biblioteca-pista') {
                    this.mostrarStatus(
                        'Pista anotada! Páginas marcadas: 3, 8 e 1. Use o código no armário.',
                    )
                    return
                }

                if (puzzleId === 'biblioteca-senha') {
                    const portaDiretoria =
                        this.doorSystem.getPorta(PORTA_DIRETORIA_ID)
                    if (portaDiretoria?.isLocked) {
                        portaDiretoria.unlock()
                    }
                    this.mostrarStatus(
                        'Armário destrancado! A diretoria foi aberta.',
                    )
                    return
                }

                this.mostrarStatus(
                    'Puzzle resolvido!',
                    )
            },
        )

        this.doorSystem.on(
            DOOR_EVENTS
                .LOCKED_FEEDBACK,

            (
                porta: PuzzleDoor,
            ) => {
                this.mostrarStatus(
                        porta.def
                            .mensagemTrancada ??
                            'A porta está trancada.',
                    )
            },
        )

        this.puzzles.on(
            PUZZLE_EVENTS
                .FAILED,
            () => {
                this.patagoras.setErrorCount(
                    this.puzzles.totalErros,
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

        const { x, y } =
            getActorCenter(this.player)

        this.pickupRadiusDebug
            .strokeCircle(
                x,
                y,
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
