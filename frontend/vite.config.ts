import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/rooms': 'http://127.0.0.1:8000',
      '/campus': 'http://127.0.0.1:8000',
      '/faculty': 'http://127.0.0.1:8000',
      '/qr': 'http://127.0.0.1:8000',
      '/admin': 'http://127.0.0.1:8000',
      '/sim': 'http://127.0.0.1:8000',
      '/overrides': 'http://127.0.0.1:8000',
      '/ws': {
        target: 'ws://127.0.0.1:8000',
        ws: true,
      },
    },
  },
})
