import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (
              id.includes('cfb') ||
              id.includes('codepage') ||
              id.includes('ssf') ||
              id.includes('fflate')
            ) {
              return 'excel-vendor'
            }
            if (id.includes('xlsx')) {
              return 'vendor-export-excel'
            }
            if (id.includes('jspdf') || id.includes('jspdf-autotable')) {
              return 'vendor-export-pdf'
            }
            if (
              id.includes('@mui') ||
              id.includes('@emotion') ||
              id.includes('@mui/icons-material')
            ) {
              return 'vendor-ui'
            }
            if (
              id.includes('/react/') ||
              id.includes('react-dom') ||
              id.includes('scheduler') ||
              id.includes('jsx-runtime')
            ) {
              return 'vendor-react'
            }
            return 'vendor'
          }
        },
      },
    },
  },
  server: {
    host: 'localhost',
    port: 3000,
    strictPort: true,
    cors: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
    },
  },
})
