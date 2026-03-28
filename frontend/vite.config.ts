import { defineConfig } from 'vite'
import tsconfigPaths from 'vite-tsconfig-paths'
import { TanStackRouterVite } from '@tanstack/router-plugin/vite'
import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const config = defineConfig({
  plugins: [
    tsconfigPaths({ projects: ['./tsconfig.json'] }),
    tailwindcss(),
    TanStackRouterVite({ autoCodeSplitting: true }),
    viteReact(),
  ],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8070',
        changeOrigin: true,
      },
      '/health': {
        target: 'http://localhost:8070',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
  },
})

export default config
