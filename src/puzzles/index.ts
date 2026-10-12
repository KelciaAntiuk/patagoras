import type { PuzzleDefinicao } from '../system/Puzzle/Puzzle.types'

export type PuzzleId =
  | 'teste'
  | 'entrada-cozinha'
  | 'refeitorio'
  | 'cozinha'
  | 'sala-aula-1'
  | 'sala-aula-2'
  | 'biblioteca-pista'
  | 'biblioteca-senha'
  | 'diretor'
  | 'avaliacao-final'

export const PUZZLES: Record<PuzzleId, PuzzleDefinicao> = {
  teste: {
    tipo: 'slots',
    titulo: 'Cadeado de teste',
    enunciado: 'Coloque o número que abre o cadeado.\n3 + 4 = ?',
    slots: [{ resposta: 7 }],
  },

  'entrada-cozinha': {
    tipo: 'slots',
    titulo: 'Porta da cozinha',
    enunciado:
      'Charada riscada na madeira:\n' +
      '"Pegue o triplo de meia dúzia\n' +
      'e tire uma dúzia inteira.\n' +
      'O que sobrar destranca a porta."',
    slots: [{ rotulo: 'abre =', resposta: 6 }],
  },

  refeitorio: {
    tipo: 'slots',
    titulo: 'Refeitório',
    enunciado: 'Há 36 bandejas para dividir igualmente em 6 mesas. Depois chegam mais 7. Quantas bandejas por mesa, somando as 7 extras?',
    slots: [{ resposta: 13 }],
  },

  cozinha: {
    tipo: 'slots',
    titulo: 'Cozinha',
    requisitos: ['refeitorio'],
    enunciado: 'x + 15 = 32',
    slots: [{ rotulo: 'x =', resposta: 17 }],
  },

  'sala-aula-1': {
    tipo: 'slots',
    titulo: 'Sala de aula 1',
    requisitos: ['cozinha'],
    enunciado: '2x + 6 = 20',
    slots: [{ rotulo: 'x =', resposta: 7 }],
  },

  'sala-aula-2': {
    tipo: 'slots',
    titulo: 'Sala de aula 2',
    requisitos: ['sala-aula-1'],
    enunciado: '3(x - 2) = 18',
    slots: [{ rotulo: 'x =', resposta: 8 }],
  },

  'biblioteca-pista': {
    tipo: 'nota',
    titulo: 'Anotação da biblioteca',
    requisitos: ['sala-aula-2'],
    texto: 'Os números das páginas marcadas são 3, 8 e 1. Use-os na ordem em que foram encontrados para formar o código do armário.',
  },

  'biblioteca-senha': {
    tipo: 'slots',
    titulo: 'Armário da biblioteca',
    requisitos: ['biblioteca-pista'],
    enunciado: 'Coloque o código das páginas marcadas.',
    slots: [{ resposta: 3 }, { resposta: 8 }, { resposta: 1 }],
  },

  diretor: {
    tipo: 'nota',
    titulo: 'Documento do diretor',
    requisitos: ['biblioteca-senha'],
    texto: 'Relatório confidencial sobre o incidente que deu origem aos acontecimentos do jogo.',
  },

  'avaliacao-final': {
    tipo: 'slots',
    titulo: 'Avaliação final',
    requisitos: ['diretor'],
    enunciado: '3x + 4 = 25',
    slots: [{ rotulo: 'x =', resposta: 7 }],
  },
}
