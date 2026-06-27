import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // Dev only: proxy /api calls to local backend
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      }
    }
  },
  build: {
    sourcemap: false,         // Smaller bundle in production
    minify: 'esbuild',        // Fast, reliable minification
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        // Split vendor libs into their own chunk for better caching
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'calendar-vendor': ['react-big-calendar', 'dayjs'],
        }
      }
    }
  }
}))
