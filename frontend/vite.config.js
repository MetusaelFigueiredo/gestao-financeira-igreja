import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// Vite config pronto para forçar atualização automática do Service Worker
// e evitar que usuários continuem com a versão antiga em cache.
// Cole este arquivo em frontend/vite.config.js (substituindo o existente, se houver).
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate', // checa automaticamente por updates
      injectRegister: 'auto',
      workbox: {
        // Faz o novo SW ativar imediatamente e assumir os clientes
        skipWaiting: true,
        clientsClaim: true,
      },
      // Opcional: personalizar o nome/arquivo do service worker
      // filename: 'sw.js',
      // Outras configurações (p.ex. runtimeCaching) podem ser adicionadas aqui
    })
  ],
  build: {
    // Se quiser remover o warning de tamanho de chunk na build, aumente este limite
    chunkSizeWarningLimit: 2000, // em KB (ex: 2000KB = 2MB)
  }
})