import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  root: path.resolve(__dirname, 'src/dashboard'),
  build: {
    outDir: path.resolve(__dirname, 'dist/dashboard'),
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'src/dashboard/index.html')
      }
    }
  },

  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src/ui-dashboard')
    }
  },
  server: {
    port: 3000,
    open: true
  }
})