import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/ReactZero-Lattice/',
  plugins: [react()],
  server: {
    port: 3001,
    open: true,
  },
})
