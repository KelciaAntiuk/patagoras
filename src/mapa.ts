/**
 * Planta do internato, traçada a partir da imagem de referência.
 *
 * As coordenadas estão em pixels do mundo, com origem no canto superior esquerdo,
 * na mesma escala da imagem original (1787 x 1301). Cada parede é um retângulo
 * preto — é só ajustar os números aqui para mexer na planta.
 */

export type Retangulo = { x: number; y: number; w: number; h: number }

export const MUNDO = { largura: 1787, altura: 1301 }

export const PAREDES: Retangulo[] = [
  // --- moldura externa ---
  { x: 0, y: 0, w: 1787, h: 26 }, // topo
  { x: 0, y: 0, w: 28, h: 1301 }, // oeste
  { x: 1759, y: 0, w: 28, h: 1301 }, // leste
  { x: 0, y: 1185, w: 705, h: 116 }, // rodapé oeste
  { x: 955, y: 1185, w: 832, h: 116 }, // rodapé leste — o vão entre os dois é a Sala Inicial

  // --- Diretoria ---
  { x: 110, y: 143, w: 135, h: 22 }, // divisória interna

  // --- bloco maciço do topo, entre a Diretoria e a Sala 1 ---
  { x: 325, y: 26, w: 580, h: 164 },
  { x: 405, y: 190, w: 500, h: 16 },

  // --- Sala 1 e Sala 2 ---
  { x: 1300, y: 26, w: 60, h: 264 }, // divisória entre as duas
  { x: 1135, y: 285, w: 225, h: 25 }, // parede sul da Sala 1

  // --- miolo: o labirinto de corredores ---
  { x: 530, y: 300, w: 55, h: 175 },
  { x: 725, y: 305, w: 200, h: 25 },
  { x: 1050, y: 300, w: 140, h: 110 },
  { x: 925, y: 410, w: 265, h: 200 },
  { x: 1285, y: 425, w: 55, h: 175 },
  { x: 26, y: 470, w: 445, h: 40 }, // parede norte da Cozinha
  { x: 465, y: 505, w: 60, h: 245 },
  { x: 585, y: 612, w: 225, h: 58 },

  // --- Sala 3 (o vão em y 740–840 é a porta) ---
  { x: 1440, y: 440, w: 347, h: 26 }, // norte
  { x: 1440, y: 440, w: 26, h: 300 }, // oeste
  { x: 1440, y: 840, w: 347, h: 26 }, // sul

  // --- Sala 4 (o vão em y 866–905 é a porta) ---
  { x: 1440, y: 905, w: 26, h: 280 }, // oeste

  // --- bloco entre a Cozinha e o Refeitório ---
  { x: 405, y: 930, w: 195, h: 255 },
]

export const SALAS: { nome: string; x: number; y: number }[] = [
  { nome: 'Diretoria', x: 183, y: 82 },
  { nome: 'Sala 1', x: 1043, y: 90 },
  { nome: 'Sala 2', x: 1552, y: 68 },
  { nome: 'Sala 3', x: 1595, y: 525 },
  { nome: 'Sala 4', x: 1605, y: 993 },
  { nome: 'Cozinha', x: 165, y: 758 },
  { nome: 'Refeitório', x: 910, y: 937 },
  { nome: 'Sala Inicial', x: 830, y: 1258 },
]

/** O jogador começa na Sala Inicial, no corredor de baixo. */
export const SPAWN = { x: 830, y: 1235 }
