import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Good Lact',
        short_name: 'GoodLact',
        description: 'Il tuo compagno intelligente per l\'intolleranza al lattosio',
        theme_color: '#2c7bb6',
        icons: [
          {
            src: '/Good Lact Pittogramma.svg',
            sizes: '192x192',
            type: 'image/svg+xml'
          },
          {
            src: '/Good Lact Pittogramma.svg',
            sizes: '512x512',
            type: 'image/svg+xml'
          }
        ]
      }
    })
  ]
})
