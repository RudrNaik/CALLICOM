import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import rulebookHtml from './vite-plugins/rulebookHtml.js'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), rulebookHtml()],
  server: {
    proxy: {
      '/api': 'http://localhost:8080',
    }
  },
})
