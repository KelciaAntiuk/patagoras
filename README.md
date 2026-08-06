# Patágoras

Jogo 2D top-down de puzzles matemáticos e sobrevivência, desenvolvido em Phaser. O jogador explora um internato abandonado resolvendo equações para destrancar portas, enquanto é caçado por uma IA hostil materializada na forma de um pato mecânico.

## Stack

| | versão |
|---|---|
| [Phaser](https://phaser.io) | 4.2.1 |
| [TypeScript](https://www.typescriptlang.org) | 6.0.3 |
| [Vite](https://vite.dev) | 8.2.1 |
| [Tiled](https://www.mapeditor.org) (editor de mapas) | 1.12.2 |

O Phaser 4 já traz os próprios typings, então não existe `@types/phaser` — `import Phaser from 'phaser'` sai tipado direto.

## Requisitos

**Node 20.19+ ou 22+.** O Vite 8 usa o rolldown, que não roda em versões anteriores — no Node 20.11 o build quebra com um `SyntaxError` sobre `styleText` não existir em `node:util`.

O projeto tem um `.nvmrc` fixando o Node 22. Use `nvm use` (sem argumento — ele lê o arquivo sozinho):

```bash
nvm use
npm install
```

Se o `nvm use` reclamar que a versão não está instalada, rode `nvm install` antes.

## Como rodar

```bash
npm run dev
```

Abre em <http://localhost:5173>.

| script | o que faz |
|---|---|
| `npm run dev` | servidor de desenvolvimento com hot reload |
| `npm run build` | checa os tipos e gera o bundle de produção em `dist/` |
| `npm run preview` | serve o `dist/` para conferir o build |
| `npm run typecheck` | só a checagem de tipos, sem gerar nada |

## Controles

| tecla | ação |
|---|---|
| ← ↑ → ↓ | mover |
| C | liga/desliga os colisores na tela |

No modo dev, `window.jogo` dá acesso ao jogo pelo console do navegador.

## Estrutura

```
src/
  main.ts              config do jogo (viewport, física, cenas)
  mapa.ts              planta do internato: paredes, salas e spawn
  texturas.ts          texturas geradas em runtime (placeholder até a arte real)
  scenes/
    GameScene.ts       cena principal
public/assets/
  maps/                mapas exportados do Tiled (JSON)
  tilesets/            imagens dos tilesets
```

### O mapa

A planta vive em [`src/mapa.ts`](src/mapa.ts) como uma lista de retângulos — cada um vira um corpo estático no Phaser e um retângulo preto na tela. É só ajustar os números para mexer na planta; a tecla `C` mostra os colisores para comparar com a referência.

Isso é provisório. O caminho definitivo é desenhar os mapas no Tiled e carregá-los com `this.load.tilemapTiledJSON(...)` — o Phaser lê o JSON do Tiled nativamente, incluindo os *object layers* (spawn, portas, gatilhos de puzzle) com propriedades customizadas. Exporte sempre como **JSON** (`File → Export As`); o `.tmx` nativo o Phaser não lê.
##foi um teste, deixei para voces poderem ver

### VS Code

O [`.vscode/settings.json`](.vscode/settings.json) aponta o editor para o TypeScript do projeto. Na primeira vez que abrir um `.ts`, aceite o prompt de usar a versão do workspace — senão o VS Code usa a versão embutida dele e você vê erros diferentes dos do terminal.
