import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    // Listen on all interfaces for Docker
    host: '0.0.0.0',
    port: 5173,
    // Enable HMR for Docker
    watch: {
      usePolling: true,
      interval: 1000,
    },
    // Configure HMR for Docker
    hmr: {
      clientPort: 5173,
    },
  },
  // Optimize dependencies for faster cold starts
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'axios',
      'framer-motion',
    ],
  },
})
