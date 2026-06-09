import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { TanStackRouterVite } from '@tanstack/router-plugin/vite'

export default defineConfig({
  plugins: [
    TanStackRouterVite({ routesDirectory: './src/routes', routeFileIgnorePattern: '.*\\.test\\.tsx?$' }),
    react(),
  ],
  resolve: {
    alias: {
      '@': '/src',
    },
  },
})
