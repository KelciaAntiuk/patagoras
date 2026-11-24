import { defineConfig } from 'vite'

export default defineConfig({
  // base relativa: o executável (Electron) abre o jogo via file://
  base: './',
  server: { port: 5173, open: true },
  build: { target: 'es2022' },
})
