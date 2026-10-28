import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // The bundled verb data (~130 kB gzipped) trips the default 500 kB warning.
  build: { chunkSizeWarningLimit: 1500 },
})
