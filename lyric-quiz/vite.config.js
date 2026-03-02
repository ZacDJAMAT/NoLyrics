import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    proxy: {
      // On dit à Vite : "Toutes les requêtes qui commencent par /api/deezer,
      // envoie-les discrètement à api.deezer.com"
      '/api/deezer': {
        target: 'https://api.deezer.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/deezer/, '')
      }
    }
  }
})