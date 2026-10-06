import { PuzzleKind } from './Puzzle.types'
import type { PuzzleDefinition } from './Puzzle.types'
import {
  createEquationSlotPuzzle,
  createNotePuzzle,
  createNumberInputPuzzle,
  createPasswordPuzzle,
} from './puzzles'

/**
 * Ordem oficial da campanha.
 *
 * A sala inicial (escape final) NÃO possui puzzle e fica fora desta lista.
 * O jogador pode explorar as salas, mas só pode concluir um puzzle quando
 * todos os seus pré-requisitos estiverem resolvidos.
 */
export const PUZZLE_IDS = {
  REFEITORIO: 'puzzle-refeitorio-01',
  COZINHA: 'puzzle-cozinha-01',
  SALA_AULA_1: 'puzzle-sala-aula-01',
  SALA_AULA_2: 'puzzle-sala-aula-02',
  BIBLIOTECA_PISTA: 'puzzle-biblioteca-01',
  BIBLIOTECA_SENHA: 'puzzle-biblioteca-02',
  DIRETOR: 'puzzle-diretor-01',
  AVALIACAO_FINAL: 'puzzle-avaliacao-final-01',
} as const

/**
 * IDs das salas usados pelo mapa/Tiled no futuro.
 * A sala inicial é apenas o ponto de fuga após o final.
 */
export const ROOM_IDS = {
  INICIAL: 'sala-inicial',
  REFEITORIO: 'refeitorio',
  COZINHA: 'cozinha',
  SALA_AULA_1: 'sala-aula-1',
  SALA_AULA_2: 'sala-aula-2',
  BIBLIOTECA: 'biblioteca',
  DIRETOR: 'sala-diretor',
  AVALIACAO: 'avaliacao-final',
} as const

/**
 * Configuração definitiva dos 8 puzzles da Fase 3.
 *
 * Tipos usados:
 * - NumberInput: resultado numérico simples.
 * - EquationSlot: resolução de equação com uma incógnita.
 * - Note: leitura obrigatória de um documento/pista.
 * - Password: código obtido através de uma pista anterior.
 */
export const PUZZLES: readonly PuzzleDefinition[] = [
  createNumberInputPuzzle(
    PUZZLE_IDS.REFEITORIO,
    ROOM_IDS.REFEITORIO,
    [],
    'Calcule o número indicado pela pista deixada no refeitório.',
    'Há 36 bandejas para organizar igualmente em 6 mesas. Depois, acrescente 7 bandejas que chegaram por último. Quantas bandejas ficam em cada mesa mais as 7 extras?',
    13,
  ),

  createEquationSlotPuzzle(
    PUZZLE_IDS.COZINHA,
    ROOM_IDS.COZINHA,
    [PUZZLE_IDS.REFEITORIO],
    'Descubra o valor de x para liberar o acesso à próxima área.',
    'x + 15 = 32',
    0,
    17,
  ),

  createEquationSlotPuzzle(
    PUZZLE_IDS.SALA_AULA_1,
    ROOM_IDS.SALA_AULA_1,
    [PUZZLE_IDS.COZINHA],
    'Resolva a equação encontrada na primeira sala de aula.',
    '2x + 6 = 20',
    0,
    7,
  ),

  createEquationSlotPuzzle(
    PUZZLE_IDS.SALA_AULA_2,
    ROOM_IDS.SALA_AULA_2,
    [PUZZLE_IDS.SALA_AULA_1],
    'Resolva a equação da segunda sala de aula.',
    '3(x - 2) = 18',
    0,
    8,
  ),

  createNotePuzzle(
    PUZZLE_IDS.BIBLIOTECA_PISTA,
    ROOM_IDS.BIBLIOTECA,
    [PUZZLE_IDS.SALA_AULA_2],
    'Leia o documento da biblioteca para descobrir o código do armário.',
    'Anotação encontrada na biblioteca: os números das páginas marcadas são 3, 8 e 1. A sequência deve ser usada na ordem em que foi encontrada para formar o código do armário.',
  ),

  createPasswordPuzzle(
    PUZZLE_IDS.BIBLIOTECA_SENHA,
    ROOM_IDS.BIBLIOTECA,
    [PUZZLE_IDS.BIBLIOTECA_PISTA],
    'Digite o código descoberto na biblioteca.',
    'Digite o código de 3 dígitos encontrado nas páginas marcadas.',
    '381',
    false,
  ),

  createNotePuzzle(
    PUZZLE_IDS.DIRETOR,
    ROOM_IDS.DIRETOR,
    [PUZZLE_IDS.BIBLIOTECA_SENHA],
    'Leia o documento do diretor para descobrir a verdade sobre o incidente.',
    'Documento do diretor: relatório confidencial sobre o incidente que deu origem aos acontecimentos do jogo. A leitura deste documento conclui o puzzle narrativo e libera a Avaliação Final. O texto definitivo da história deve ser inserido aqui sem alterar a lógica de progressão.',
  ),

  createNumberInputPuzzle(
    PUZZLE_IDS.AVALIACAO_FINAL,
    ROOM_IDS.AVALIACAO,
    [PUZZLE_IDS.DIRETOR],
    'Resolva a última questão para concluir a Avaliação Final.',
    'A última folha traz a equação 3x + 4 = 25. Qual é o valor de x?',
    7,
  ),
]

/**
 * Ordem linear esperada para validação e integração com portas/objetos.
 */
export const PUZZLE_PROGRESSION = PUZZLES.map((puzzle) => puzzle.id)

/**
 * Confere a consistência da campanha em tempo de execução/desenvolvimento.
 * Falhas aqui indicam erro de configuração, não erro do jogador.
 */
export function validatePuzzleDefinitions(
  puzzles: readonly PuzzleDefinition[] = PUZZLES,
): void {
  const ids = new Set<string>()

  for (const puzzle of puzzles) {
    if (ids.has(puzzle.id)) {
      throw new Error(`Puzzle duplicado: ${puzzle.id}`)
    }
    ids.add(puzzle.id)
  }

  for (const puzzle of puzzles) {
    for (const prerequisiteId of puzzle.prerequisiteIds) {
      if (!ids.has(prerequisiteId)) {
        throw new Error(
          `Pré-requisito inexistente: ${prerequisiteId} em ${puzzle.id}`,
        )
      }
      if (prerequisiteId === puzzle.id) {
        throw new Error(`Puzzle não pode depender dele mesmo: ${puzzle.id}`)
      }
    }
  }

  for (let index = 1; index < puzzles.length; index += 1) {
    const previous = puzzles[index - 1]
    const current = puzzles[index]

    if (!current.prerequisiteIds.includes(previous.id)) {
      throw new Error(
        `Progressão não linear: ${current.id} deve depender de ${previous.id}`,
      )
    }
  }

  const last = puzzles[puzzles.length - 1]
  if (!last || last.kind === PuzzleKind.Note) {
    throw new Error('A progressão deve terminar em um puzzle jogável, não em uma pista.')
  }
}
